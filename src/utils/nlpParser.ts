import { TransactionType } from '../types';

export interface ParsedTransactionItem {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  date: string;
  installments?: number;
  isTotalAmount?: boolean;
  note?: string;
}

export interface ParseResult {
  replyMessage: string;
  transactions: ParsedTransactionItem[];
}

/**
 * Heurística local rápida caso a API do Gemini esteja offline ou sem chave configurada.
 */
export function parseLocalText(
  text: string,
  accounts: string[] = [],
  categories: string[] = []
): ParseResult {
  const lower = text.toLowerCase();
  const today = new Date();
  
  // 1. Detecta data
  let targetDate = today.toISOString().split('T')[0];
  if (lower.includes('ontem')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    targetDate = d.toISOString().split('T')[0];
  } else if (lower.includes('anteontem')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    targetDate = d.toISOString().split('T')[0];
  } else {
    const dayMatch = lower.match(/dia\s+(\d{1,2})/);
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }
    }
  }

  // 2. Detecta parcelamento
  let installments = 1;
  let isTotalAmount = true;
  const installmentMatch = lower.match(/(?:em\s+)?(\d{1,2})x/i) || lower.match(/(\d{1,2})\s*parcelas/i);
  if (installmentMatch) {
    installments = Math.max(2, parseInt(installmentMatch[1], 10));
    if (lower.includes('cada parcela') || lower.includes('por mês') || lower.includes('mensais')) {
      isTotalAmount = false;
    }
  }

  // 3. Detecta valor numérico
  // Ex: R$ 150,50 ou 150.50 ou 45,90 ou 1200
  let amount = 0;
  const valueMatch = text.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d+)?)/i);
  if (valueMatch) {
    const cleanStr = valueMatch[1].replace(/\./g, '').replace(',', '.');
    amount = Math.abs(parseFloat(cleanStr)) || 0;
  }

  // 4. Detecta tipo
  let type: TransactionType = 'despesa';
  const isIncome = /\b(recebi|ganhei|salario|salário|venda|rendimento|freela|freelance|adicional|pix recebido)\b/i.test(lower);
  const isTransfer = /\b(transferi|transferencia|transferência|transf|ted|doc)\b/i.test(lower);

  if (isIncome) {
    type = 'receita';
  } else if (isTransfer) {
    type = 'transferencia';
  }

  // 5. Detecta categoria
  let category = type === 'receita' ? 'Salário' : 'Outros';
  if (/almo[çc]o|jantar|lanche|comida|restaurante|ifood|padaria|mercado|supermercado|a[çc]ougue/i.test(lower)) {
    category = categories.find(c => /alimenta/i.test(c)) || 'Alimentação';
  } else if (/uber|gasolina|combust[ií]vel|estacionamento|ped[aá]gio|ônibus|onibus|passagem|metr[oô]/i.test(lower)) {
    category = categories.find(c => /transporte/i.test(c)) || 'Transporte';
  } else if (/farm[aá]cia|rem[eé]dio|m[eé]dico|dentista|exame|consulta/i.test(lower)) {
    category = categories.find(c => /sa[uú]de/i.test(c)) || 'Saúde';
  } else if (/aluguel|condom[ií]nio|luz|energia|água|agua|internet|g[aá]s/i.test(lower)) {
    category = categories.find(c => /moradia|casa/i.test(c)) || 'Moradia';
  } else if (/cinema|show|festa|bar|viagem|passeio|jogo/i.test(lower)) {
    category = categories.find(c => /lazer/i.test(c)) || 'Lazer';
  } else if (/curso|faculdade|livro|escola/i.test(lower)) {
    category = categories.find(c => /educa/i.test(c)) || 'Educação';
  } else if (type === 'receita') {
    category = categories.find(c => /sal[aá]rio|renda/i.test(c)) || 'Salário';
  }

  // 6. Detecta conta
  let account = accounts[0] || 'Carteira';
  if (/cart[aã]o|nubank|visa|mastercard|cr[eé]dito/i.test(lower)) {
    const cardAcc = accounts.find(a => /cart[aã]o|credito|crédito/i.test(a));
    if (cardAcc) account = cardAcc;
  } else if (/corrente|banco|ita[uú]|bradesco|inter|santander/i.test(lower)) {
    const bankAcc = accounts.find(a => /corrente|banco/i.test(a));
    if (bankAcc) account = bankAcc;
  }

  // 7. Descrição limpa
  let description = text
    .replace(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d+)?)/gi, '')
    .replace(/\b(hoje|ontem|anteontem|em\s+\d+x|\d+x|\d+\s+parcelas|no\s+cartao|no\s+cartão|na\s+carteira|no\s+banco|de\s+hoje)\b/gi, '')
    .replace(/\b(gastei|paguei|comprei|recebi|ganhei|com)\b/gi, '')
    .trim();

  // Limpa caracteres especiais soltos
  description = description.replace(/^[-–—,.\s]+|[-–—,.\s]+$/g, '').trim();

  if (!description) {
    description = type === 'receita' ? 'Receita Recebida' : 'Despesa';
  } else {
    // Primeira letra maiúscula
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  const reply = installments > 1
    ? `Entendido! Identifiquei uma compra parcelada de "${description}" em ${installments}x no valor de R$ ${amount.toFixed(2).replace('.', ',')}.`
    : `Entendido! Identifiquei um lançamento de "${description}" no valor de R$ ${amount.toFixed(2).replace('.', ',')}.`;

  return {
    replyMessage: reply,
    transactions: [
      {
        description,
        amount,
        type,
        category,
        account,
        date: targetDate,
        installments: installments > 1 ? installments : undefined,
        isTotalAmount,
        note: `Criado via Chat Inteligente`,
      },
    ],
  };
}

/**
 * Função principal que consulta a API Gemini ou realiza fallback inteligente
 */
export async function parseTransactionWithAI(
  text: string,
  accounts: string[],
  categories: string[],
  referenceDate?: string
): Promise<ParseResult> {
  try {
    const res = await fetch('/api/ai/parse-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        accounts,
        categories,
        referenceDate: referenceDate || new Date().toISOString().split('T')[0],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
        return data as ParseResult;
      }
    }
  } catch (err) {
    console.info('Conexão com API remota falhou, usando parser local:', err);
  }

  // Fallback para o interpretador local inteligente
  return parseLocalText(text, accounts, categories);
}
