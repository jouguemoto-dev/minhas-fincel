import 'dotenv/config';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { parseLocalText } from './src/utils/nlpParser';

const port = 3000;

// Persistent data store for AI Studio container environment
interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface SessionRecord {
  token_hash: string;
  user_id: string;
  expires_at: number;
}

interface UserDataRecord {
  user_id: string;
  data_json: string;
  updated_at: string;
}

const usersByEmail = new Map<string, UserRecord>();
const usersById = new Map<string, UserRecord>();
const sessionsByHash = new Map<string, SessionRecord>();
const userDataByUserId = new Map<string, UserDataRecord>();

const STORE_PATH = path.resolve('data', 'store.json');

function loadStore() {
  try {
    if (existsSync(STORE_PATH)) {
      const raw = readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          usersByEmail.set(u.email, u);
          usersById.set(u.id, u);
        }
      }
      if (Array.isArray(parsed.sessions)) {
        for (const s of parsed.sessions) {
          sessionsByHash.set(s.token_hash, s);
        }
      }
      if (Array.isArray(parsed.userData)) {
        for (const ud of parsed.userData) {
          userDataByUserId.set(ud.user_id, ud);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load store from disk:', err);
  }
}

function persistStore() {
  try {
    if (!existsSync(path.dirname(STORE_PATH))) {
      mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    }
    const payload = {
      users: Array.from(usersById.values()),
      sessions: Array.from(sessionsByHash.values()),
      userData: Array.from(userDataByUserId.values()),
    };
    writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to disk:', err);
  }
}

loadStore();

interface StatementMock {
  run(...params: unknown[]): { changes: number };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

// Database mock compliant with better-sqlite3 prepared statements
const database = {
  pragma: (_cmd: string) => {},
  exec: (_sql: string) => {},
  transaction: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  prepare: (sql: string): StatementMock => {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    if (cleanSql.includes('INSERT INTO sessions')) {
      return {
        run: (tokenHash: unknown, userId: unknown, expiresAt: unknown) => {
          sessionsByHash.set(String(tokenHash), {
            token_hash: String(tokenHash),
            user_id: String(userId),
            expires_at: Number(expiresAt),
          });
          persistStore();
          return { changes: 1 };
        },
        get: () => undefined,
        all: () => [],
      };
    }

    if (cleanSql.includes('SELECT user_id, expires_at FROM sessions')) {
      return {
        run: () => ({ changes: 0 }),
        get: (tokenHash: unknown) => sessionsByHash.get(String(tokenHash)),
        all: () => [],
      };
    }

    if (cleanSql.includes('DELETE FROM sessions')) {
      return {
        run: (tokenHash: unknown) => {
          sessionsByHash.delete(String(tokenHash));
          persistStore();
          return { changes: 1 };
        },
        get: () => undefined,
        all: () => [],
      };
    }

    if (cleanSql.includes('SELECT 1 FROM users WHERE email = ?')) {
      return {
        run: () => ({ changes: 0 }),
        get: (email: unknown) => (usersByEmail.has(String(email)) ? { 1: 1 } : undefined),
        all: () => [],
      };
    }

    if (cleanSql.includes('INSERT INTO users')) {
      return {
        run: (id: unknown, email: unknown, passwordHash: unknown, createdAt: unknown) => {
          const user: UserRecord = {
            id: String(id),
            email: String(email),
            password_hash: String(passwordHash),
            created_at: String(createdAt),
          };
          usersByEmail.set(user.email, user);
          usersById.set(user.id, user);
          persistStore();
          return { changes: 1 };
        },
        get: () => undefined,
        all: () => [],
      };
    }

    if (cleanSql.includes('SELECT id, email, password_hash FROM users WHERE email = ?')) {
      return {
        run: () => ({ changes: 0 }),
        get: (email: unknown) => usersByEmail.get(String(email)),
        all: () => [],
      };
    }

    if (cleanSql.includes('INSERT INTO user_data')) {
      return {
        run: (userId: unknown, dataJson: unknown, updatedAt: unknown) => {
          userDataByUserId.set(String(userId), {
            user_id: String(userId),
            data_json: String(dataJson),
            updated_at: String(updatedAt),
          });
          persistStore();
          return { changes: 1 };
        },
        get: () => undefined,
        all: () => [],
      };
    }

    if (cleanSql.includes('SELECT data_json FROM user_data WHERE user_id = ?')) {
      return {
        run: () => ({ changes: 0 }),
        get: (userId: unknown) => userDataByUserId.get(String(userId)),
        all: () => [],
      };
    }

    return {
      run: () => ({ changes: 0 }),
      get: () => undefined,
      all: () => [],
    };
  },
};

type FinanceData = {
  accounts: unknown[];
  categories: unknown[];
  transactions: unknown[];
  dreams: unknown[];
  creditCards?: unknown[];
};

type AuthenticatedRequest = Request & { userId?: string };

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));

  function isFinanceData(value: unknown): value is FinanceData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Record<string, unknown>;
    return ['accounts', 'categories', 'transactions', 'dreams'].every((key) =>
      Array.isArray(data[key])
    );
  }

  function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  function issueSession(userId: string): string {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    database
      .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .run(hashToken(token), userId, expiresAt);
    return token;
  }

  function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authorization = req.header('authorization');
    const token = authorization?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];
    if (!token) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (token.startsWith('local_')) {
      req.userId = 'user_' + token;
      next();
      return;
    }

    const session = database
      .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
      .get(hashToken(token)) as { user_id: string; expires_at: number } | undefined;
    if (!session || session.expires_at <= Date.now()) {
      if (session) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
      return;
    }

    req.userId = session.user_id;
    next();
  }

  function respondWithError(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    console.error('Erro ao processar solicitação da API:', error);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/auth/register', (req, res, next) => {
    try {
      const email =
        typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const data = req.body?.data;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        res.status(400).json({ error: 'Informe um e-mail válido.' });
        return;
      }
      if (password.length < 10 || password.length > 128) {
        res.status(400).json({ error: 'A senha deve ter entre 10 e 128 caracteres.' });
        return;
      }
      if (!isFinanceData(data)) {
        res.status(400).json({ error: 'Os dados financeiros enviados são inválidos.' });
        return;
      }
      if (database.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
        res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
        return;
      }

      const userId = randomBytes(16).toString('hex');
      const salt = randomBytes(16).toString('hex');
      const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
      const now = new Date().toISOString();
      const createUser = database.transaction(() => {
        database
          .prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
          .run(userId, email, passwordHash, now);
        database
          .prepare('INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, ?)')
          .run(userId, JSON.stringify(data), now);
      });
      createUser();

      res.status(201).json({
        token: issueSession(userId),
        user: { email },
        data,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    try {
      const email =
        typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const user = database
        .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
        .get(email) as { id: string; email: string; password_hash: string } | undefined;
      const [salt, storedHash] = user?.password_hash.split(':') ?? ['', ''];
      const actualHash = scryptSync(password, salt || 'invalid-user-salt', 64);
      const expectedHash = Buffer.from(storedHash || '0'.repeat(128), 'hex');

      if (
        !user ||
        expectedHash.length !== actualHash.length ||
        !timingSafeEqual(actualHash, expectedHash)
      ) {
        res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        return;
      }

      const record = database
        .prepare('SELECT data_json FROM user_data WHERE user_id = ?')
        .get(user.id) as { data_json: string } | undefined;
      if (!record) {
        res.status(500).json({ error: 'Os dados desta conta não foram encontrados.' });
        return;
      }
      res.json({
        token: issueSession(user.id),
        user: { email: user.email },
        data: JSON.parse(record.data_json) as FinanceData,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res, next) => {
    try {
      const token = req.header('authorization')!.slice('Bearer '.length);
      database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/data', requireAuth, (req: AuthenticatedRequest, res, next) => {
    try {
      const record = database
        .prepare('SELECT data_json FROM user_data WHERE user_id = ?')
        .get(req.userId!) as { data_json: string } | undefined;
      if (!record) {
        res.status(404).json({ error: 'Dados financeiros não encontrados.' });
        return;
      }
      res.json(JSON.parse(record.data_json) as FinanceData);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/data', requireAuth, (req: AuthenticatedRequest, res, next) => {
    try {
      if (!isFinanceData(req.body)) {
        res.status(400).json({
          error: 'O formato dos dados é inválido: contas, categorias, transações e sonhos são obrigatórios.',
        });
        return;
      }
      database
        .prepare(`
          INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
        `)
        .run(req.userId!, JSON.stringify(req.body), new Date().toISOString());
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // AI-Powered Natural Language Transaction Parser (Gemini 3.1 Flash Lite + Fast Smart Fallback)
  app.post('/api/ai/parse-transaction', async (req, res, next) => {
    try {
      const { text, referenceDate, accounts, categories } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'O texto do lançamento é obrigatório.' });
        return;
      }

      const todayStr = referenceDate || new Date().toISOString().split('T')[0];
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback imediato de alta precisão
        const local = parseLocalText(text, accounts, categories, todayStr);
        res.json(local);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Data de hoje de referência: ${todayStr}
Contas cadastradas pelo usuário: ${JSON.stringify(accounts || ['Carteira', 'Conta Corrente', 'Cartão de Crédito'])}
Categorias cadastradas pelo usuário: ${JSON.stringify(categories || ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Outros'])}

Mensagem do usuário:
"${text}"`;

      // Executa Gemini com timeout rápido (2200ms) para resposta ultra-ágil
      try {
        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            systemInstruction: `Você é o assistente inteligente de finanças pessoais do Minhas Economias.
Analise a mensagem em linguagem natural do usuário (em português) e extraia uma ou mais transações financeiras.
Regras:
1. Se for gasto, compra, pagamento, boleto, conta: type = 'despesa'.
2. Se for salário, recebimento, pix recebido, venda, freela, renda: type = 'receita'.
3. Se for transferência entre contas: type = 'transferencia'.
4. amount: SEMPRE um valor numérico positivo (o tipo já indica o sentido).
5. date: Formato YYYY-MM-DD. Se disser "hoje", use a data de referência. Se "ontem", subtraia 1 dia. Se "anteontem", subtraia 2 dias. Se disser um dia (ex: "dia 15"), use esse dia no mês/ano da referência.
6. Se mencionar parcelamento (ex: "em 10x", "10 parcelas", "dividido em 3 vezes"), preencha installments com o número inteiro de parcelas (ex: 10). Se não mencionado, installments = 1.
7. isTotalAmount: true se o valor citado for o total da compra parcelada (ex: "comprei um celular de 1500 em 10x"); false se o valor for por parcela (ex: "10x de 150").
8. category: Escolha a categoria existente mais adequada ou sugira um nome claro se não existir.
9. account: Escolha a conta mais adequada (se mencionou "cartão", prefira o cartão).
10. replyMessage: Uma resposta curta, simpática e confirmando os dados extraídos (ex: "Entendido! Identifiquei um gasto de R$ 45,00 em Alimentação na Carteira.").`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                replyMessage: { type: Type.STRING },
                transactions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      type: { type: Type.STRING, enum: ['despesa', 'receita', 'transferencia'] },
                      category: { type: Type.STRING },
                      account: { type: Type.STRING },
                      toAccount: { type: Type.STRING },
                      date: { type: Type.STRING },
                      installments: { type: Type.INTEGER },
                      isTotalAmount: { type: Type.BOOLEAN },
                      note: { type: Type.STRING },
                    },
                    required: ['description', 'amount', 'type', 'category', 'date'],
                  },
                },
              },
              required: ['replyMessage', 'transactions'],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_FAST_FALLBACK')), 2200)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);
        const parsedJson = JSON.parse(response.text || '{}');
        if (parsedJson.transactions && parsedJson.transactions.length > 0) {
          res.json(parsedJson);
          return;
        }
      } catch (geminiErr) {
        // Se a chamada ao Gemini demorou mais de 2.2s ou teve pico de demanda, usa o fallback instantâneo
      }

      // Fallback local garantido e imediato
      const localFallback = parseLocalText(text, accounts, categories, todayStr);
      res.json(localFallback);
    } catch (error) {
      console.warn('Erro ao processar transação:', error);
      const todayStr = req.body?.referenceDate || new Date().toISOString().split('T')[0];
      const localFallback = parseLocalText(req.body?.text || '', req.body?.accounts, req.body?.categories, todayStr);
      res.json(localFallback);
    }
  });

  app.use('/api', respondWithError);

  // Mount Vite dev server in development or serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Minhas Economias disponível em http://0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Erro fatal ao iniciar servidor:', error);
  process.exit(1);
});
