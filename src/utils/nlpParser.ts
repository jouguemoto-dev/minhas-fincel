import { TransactionType } from '../types';

export interface ParsedTransactionItem {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  toAccount?: string;
  date: string;
  installments?: number;
  isTotalAmount?: boolean;
  note?: string;
}

export interface ParseResult {
  replyMessage: string;
  transactions: ParsedTransactionItem[];
}

// Dicionário semântico e categorização de termos populares no Brasil
const CATEGORY_KEYWORDS: Record<string, { main: string; keywords: string[] }> = {
  alimentacao: {
    main: 'Alimentação',
    keywords: [
      'almoco', 'almoço', 'almocinho', 'almocei', 'janta', 'jantar', 'jantei', 'lanche', 'lanches',
      'cafe', 'café', 'cafezinho', 'padaria', 'restaurante', 'buffet', 'rodizio', 'rodízio',
      'ifood', 'rappi', 'delivery', 'comida', 'marmita', 'marmitex', 'quentinha', 'churrasco',
      'mercado', 'supermercado', 'mercadinho', 'hipermercado', 'atacadão', 'atacadao', 'assai',
      'acougue', 'açougue', 'carnes', 'peixaria', 'hortifruti', 'sacolao', 'sacolão', 'feira',
      'bar', 'boteco', 'cerveja', 'chopp', 'vinho', 'drink', 'petisco', 'tira-gosto',
      'pizza', 'pizzaria', 'hamburguer', 'hambúrguer', 'burger', 'lanchonete', 'mcdonalds',
      'bk', 'burger king', 'subway', 'doce', 'chocolate', 'sorvete', 'acai', 'açaí', 'doceria',
      'pastel', 'coxinha', 'salgado', 'bolo', 'torta', 'cafeteria', 'starbucks', 'refrigerante', 'coca'
    ],
  },
  transporte: {
    main: 'Transporte',
    keywords: [
      'uber', '99', '99pop', 'taxi', 'táxi', 'corrida', 'carona',
      'gasolina', 'etanol', 'alcool', 'álcool', 'combustivel', 'combustível', 'diesel', 'gnv',
      'abastecer', 'abasteci', 'posto', 'shell', 'ipiranga', 'br petrobras',
      'estacionamento', 'rotativo', 'zona azul', 'pedagio', 'pedágio', 'sem parar', 'conectcar', 'veloe',
      'onibus', 'ônibus', 'metro', 'metrô', 'trem', 'cptm', 'passagem', 'bilhete', 'recarga bilhete',
      'aviao', 'avião', 'voo', 'passagem aérea', 'latam', 'gol', 'azul',
      'oficina', 'mecanico', 'mecânico', 'mecanica', 'mecânica', 'oleo', 'óleo', 'troca de oleo',
      'pneu', 'pneus', 'balanceamento', 'alinhamento', 'ipva', 'dpvat', 'licenciamento',
      'seguro auto', 'lava jato', 'lavagem', 'carro', 'moto', 'bicicleta'
    ],
  },
  moradia: {
    main: 'Moradia',
    keywords: [
      'aluguel', 'condominio', 'condomínio', 'iptu', 'taxa condominial',
      'luz', 'energia', 'enel', 'cpfl', 'eletropaulo', 'cemig', 'copel', 'equatorial', 'conta de luz',
      'agua', 'água', 'sabesp', 'copasa', 'sanepar', 'saneamento', 'conta de agua',
      'gas', 'gás', 'botijao', 'botijão', 'ultragaz', 'liquigas', 'compagas',
      'internet', 'wifi', 'banda larga', 'fibra', 'claro', 'vivo', 'tim', 'oi',
      'diarista', 'faxineira', 'faxina', 'limpeza', 'material de limpeza',
      'reforma', 'pedreiro', 'tinta', 'encanador', 'eletricista', 'marceneiro',
      'moveis', 'móveis', 'sofa', 'sofá', 'cama', 'colchao', 'colchão', 'mesa', 'cadeira',
      'geladeira', 'fogao', 'fogão', 'microondas', 'maquina de lavar'
    ],
  },
  saude: {
    main: 'Saúde',
    keywords: [
      'farmacia', 'farmácia', 'drogaria', 'raia', 'drogasil', 'pague menos', 'dpsp', 'panvel',
      'remedio', 'remédio', 'medicamento', 'pomada', 'vitamina', 'antibiotico', 'dorflex', 'dipirona',
      'consulta', 'medico', 'médico', 'medica', 'médica', 'pediatra', 'clinico', 'cardiologista',
      'dentista', 'odonto', 'odontologia', 'dente', 'aparelho', 'limpeza dental',
      'exame', 'laboratorio', 'laboratório', 'fleury', 'delboni', 'lavoisier', 'ressonancia', 'sangue',
      'hospital', 'pronto socorro', 'emergencia', 'upa', 'cirurgia', 'internacao',
      'fisioterapia', 'fisio', 'psicologo', 'psicólogo', 'terapia', 'psiquiatra', 'nutricionista',
      'plano de saude', 'unimed', 'bradesco saude', 'amil', 'sulamerica', 'notredame', 'hapvida', 'otica', 'óculos'
    ],
  },
  lazer: {
    main: 'Lazer',
    keywords: [
      'cinema', 'cinemark', 'cinepolis', 'ingresso', 'filme', 'pipoca',
      'show', 'teatro', 'musical', 'festa', 'balada', 'evento', 'ingresso', 'sympla', 'eventim',
      'viagem', 'pousada', 'hotel', 'booking', 'airbnb', 'praia', 'resort', 'passeio', 'turismo',
      'parque', 'museu', 'exposicao', 'zoologico', 'aquario',
      'jogo', 'jogos', 'videogame', 'game', 'ps5', 'playstation', 'xbox', 'nintendo', 'steam',
      'netflix', 'spotify', 'amazon prime', 'prime video', 'hbo', 'max', 'disney', 'youtube premium',
      'apple tv', 'paramount', 'globoplay', 'deezer', 'clube', 'churrasco'
    ],
  },
  educacao: {
    main: 'Educação',
    keywords: [
      'faculdade', 'universidade', 'graduacao', 'pos', 'pós', 'mba', 'mestrado', 'doutorado',
      'escola', 'colegio', 'colégio', 'mensalidade', 'curso', 'cursinho', 'treinamento',
      'ingles', 'inglês', 'idioma', 'espanhol', 'alura', 'udemy', 'coursera', 'dio',
      'livro', 'livros', 'kindle', 'apostila', 'papelaria', 'caderno', 'mochila', 'estojo', 'lapis', 'caneta'
    ],
  },
  vestuario: {
    main: 'Vestuário',
    keywords: [
      'roupa', 'roupas', 'camisa', 'camiseta', 'calca', 'calça', 'bermuda', 'shorts',
      'vestido', 'saia', 'casaco', 'jaqueta', 'moletom', 'blusa', 'lingerie', 'meia',
      'tenis', 'tênis', 'sapato', 'bota', 'sandalia', 'sandália', 'chinelo', 'havaianas',
      'nike', 'adidas', 'puma', 'zara', 'renner', 'riachuelo', 'c&a', 'shein', 'shopee',
      'perfume', 'maquiagem', 'cosmeticos', 'cosméticos', 'boticario', 'natura', 'sephora',
      'corte de cabelo', 'cabelo', 'barbeiro', 'barbearia', 'cabeleireiro', 'manicure', 'pedicure', 'salao', 'salão'
    ],
  },
  cuidados: {
    main: 'Cuidados Pessoais',
    keywords: [
      'academia', 'smart fit', 'bluefit', 'personal', 'crossfit', 'natacao', 'natação', 'pilates',
      'suplemento', 'whey', 'creatina', 'lavanderia', 'costureira', 'sapateiro',
      'pet', 'petshop', 'veterinario', 'veterinário', 'racao', 'ração', 'banho e tosa', 'vacina pet'
    ],
  },
  salario: {
    main: 'Salário',
    keywords: [
      'salario', 'salário', 'ordenado', 'adiantamento', 'vale', '13o', 'decimo terceiro', 'décimo terceiro',
      'ferias', 'férias', 'plr', 'bonus', 'bônus', 'comissao', 'comissão', 'pro labore', 'pró-labore',
      'freela', 'freelance', 'bico', 'consultoria', 'serviço prestado', 'honorarios', 'honorários',
      'rendimento', 'proventos', 'dividendos', 'juros', 'lucro', 'venda', 'vendi', 'estorno', 'reembolso'
    ],
  },
  investimentos: {
    main: 'Investimentos',
    keywords: [
      'investimento', 'investimentos', 'aporte', 'cdb', 'lci', 'lca', 'tesouro direto', 'tesouro selic',
      'acoes', 'ações', 'fundos', 'fii', 'cripto', 'bitcoin', 'btc', 'ethereum', 'renda fixa'
    ],
  },
  eletronicos: {
    main: 'Eletrônicos',
    keywords: [
      'celular', 'smartphone', 'iphone', 'samsung', 'xiaomi', 'motorola', 'computador', 'notebook',
      'laptop', 'ipad', 'tablet', 'monitor', 'teclado', 'mouse', 'fone', 'headset', 'airpods', 'tv', 'televisao', 'televisão'
    ],
  },
};

const ACCOUNT_PATTERNS = [
  { match: /nu(?:bank)?|roxinho/i, preferredKey: 'nubank' },
  { match: /inter(?:medium)?/i, preferredKey: 'inter' },
  { match: /ita[uú]|itaucard/i, preferredKey: 'itaú' },
  { match: /bradesco/i, preferredKey: 'bradesco' },
  { match: /santander/i, preferredKey: 'santander' },
  { match: /bb|banco do brasil/i, preferredKey: 'banco do brasil' },
  { match: /caixa|cef/i, preferredKey: 'caixa' },
  { match: /c6(?:\s*bank)?/i, preferredKey: 'c6' },
  { match: /mercado\s*pago|mp/i, preferredKey: 'mercado pago' },
  { match: /picpay/i, preferredKey: 'picpay' },
  { match: /carteira|dinheiro|especie|espécie|cash/i, preferredKey: 'carteira' },
  { match: /poupan[çc]a/i, preferredKey: 'poupança' },
  { match: /corrente|cc/i, preferredKey: 'conta corrente' },
  { match: /cart[aã]o|cr[eé]dito/i, preferredKey: 'cartão de crédito' },
];

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extrai parcelamento e valor de forma inteligente sem colisão
 */
function extractInstallmentsAndAmount(text: string): {
  installments: number;
  isTotalAmount: boolean;
  amount: number;
  textWithoutInstallments: string;
} {
  let installments = 1;
  let isTotalAmount = true;
  let textWithoutInstallments = text;

  // 1. Detecta padrões explícitos como '3x de 150', '5 parcelas de 50', '10x de R$ 120,00'
  const perParcelMatch = text.match(
    /(?:em\s+)?(\d{1,2})\s*(?:x|vezes|parcelas?)\s+de\s+(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d+)?)/i
  );
  if (perParcelMatch) {
    installments = Math.max(1, parseInt(perParcelMatch[1], 10));
    isTotalAmount = false;
    const rawVal = perParcelMatch[2];
    let parcelVal = 0;
    if (rawVal.includes(',') && rawVal.includes('.')) {
      parcelVal = parseFloat(rawVal.replace(/\./g, '').replace(',', '.'));
    } else if (rawVal.includes(',')) {
      parcelVal = parseFloat(rawVal.replace(',', '.'));
    } else {
      parcelVal = parseFloat(rawVal);
    }
    textWithoutInstallments = text.replace(perParcelMatch[0], ' ');
    return { installments, isTotalAmount, amount: parcelVal, textWithoutInstallments };
  }

  // 2. Detecta parcelamento com valor total (ex: 'celular 1500 em 10x' ou 'tv de 2000 em 12 parcelas')
  const instMatch = text.match(/(?:em\s+)?(\d{1,2})\s*x\b/i) || text.match(/(?:em\s+)?(\d{1,2})\s*(?:parcelas?|vezes)\b/i);
  if (instMatch) {
    installments = Math.max(1, parseInt(instMatch[1], 10));
    isTotalAmount = true;
    textWithoutInstallments = text.replace(instMatch[0], ' ');
  }

  // 3. Shorthand notation (10k, 1.5k)
  const kMatch = textWithoutInstallments.match(/(?:R\$\s*)?(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
    return { installments, isTotalAmount, amount: val, textWithoutInstallments };
  }

  // 4. Notação monetária comum (R$ 1.500,50 ou 1500,50 ou 45,90 ou 150)
  const moneyMatch = textWithoutInstallments.match(
    /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d+)?)(?:\s*(?:reais?|conto|pila|bar[aã]o))?/i
  );
  if (moneyMatch) {
    const raw = moneyMatch[1];
    let val = 0;
    if (raw.includes(',') && raw.includes('.')) {
      val = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    } else if (raw.includes(',')) {
      val = parseFloat(raw.replace(',', '.'));
    } else {
      val = parseFloat(raw);
    }
    if (!isNaN(val) && val > 0) {
      return { installments, isTotalAmount, amount: val, textWithoutInstallments };
    }
  }

  return { installments: 1, isTotalAmount: true, amount: 0, textWithoutInstallments };
}

/**
 * Identifica a melhor categoria para o lançamento
 */
function matchCategory(text: string, categories: string[], defaultCategory: string): string {
  const norm = normalizeText(text);

  // 1. Match direto com categoria existente do usuário
  for (const cat of categories) {
    const normCat = normalizeText(cat);
    if (normCat.length >= 3 && norm.includes(normCat)) {
      return cat;
    }
  }

  // 2. Match através do dicionário
  for (const catKey of Object.keys(CATEGORY_KEYWORDS)) {
    const entry = CATEGORY_KEYWORDS[catKey];
    for (const kw of entry.keywords) {
      const normKw = normalizeText(kw);
      const regex = new RegExp(`(?<=^|\\s)${normKw}(?=\\s|$)`, 'i');
      if (regex.test(norm)) {
        const userMatched = categories.find((c) => {
          const nc = normalizeText(c);
          return (
            nc.includes(normalizeText(entry.main)) ||
            normalizeText(entry.main).includes(nc) ||
            nc.includes(normKw)
          );
        });
        return userMatched || entry.main;
      }
    }
  }

  return defaultCategory;
}

/**
 * Identifica a conta bancária ou cartão
 */
function matchAccount(
  text: string,
  accounts: string[],
  defaultAccount: string
): { account: string; toAccount?: string } {
  const norm = normalizeText(text);

  // Transferência com 'da conta X para conta Y' ou 'do X pro Y'
  const transferMatch = text.match(
    /(?:da|do)\s+([a-zA-Z0-9\s]+?)\s+(?:para|pro|pra|ao)\s+(?:o|a)?\s*([a-zA-Z0-9\s]+)/i
  );
  if (transferMatch) {
    const fromStr = normalizeText(transferMatch[1]);
    const toStr = normalizeText(transferMatch[2]);

    const findAcc = (query: string) => {
      return (
        accounts.find((a) => normalizeText(a).includes(query) || query.includes(normalizeText(a))) ||
        accounts.find((a) => {
          const pat = ACCOUNT_PATTERNS.find((p) => p.match.test(query));
          return pat && normalizeText(a).includes(pat.preferredKey);
        })
      );
    };

    const fromAcc = findAcc(fromStr);
    const toAcc = findAcc(toStr);

    if (fromAcc && toAcc && fromAcc !== toAcc) {
      return { account: fromAcc, toAccount: toAcc };
    }
  }

  // Busca conta citada no texto
  for (const acc of accounts) {
    const normAcc = normalizeText(acc);
    if (normAcc.length >= 3 && norm.includes(normAcc)) {
      return { account: acc };
    }
  }

  // Busca por apelidos de bancos
  for (const pat of ACCOUNT_PATTERNS) {
    if (pat.match.test(norm)) {
      const userAcc = accounts.find((a) => {
        const na = normalizeText(a);
        return na.includes(pat.preferredKey) || pat.match.test(na);
      });
      if (userAcc) return { account: userAcc };
    }
  }

  // Menções a formas de pagamento
  if (/no\s+cart[aã]o|cr[eé]dito/i.test(norm)) {
    const cardAcc = accounts.find((a) => /cart[aã]o|cr[eé]dito/i.test(a));
    if (cardAcc) return { account: cardAcc };
  } else if (/dinheiro|em\s+m[aã]o|na\s+carteira/i.test(norm)) {
    const walletAcc = accounts.find((a) => /carteira|dinheiro/i.test(a));
    if (walletAcc) return { account: walletAcc };
  } else if (/no\s+d[eé]bito|na\s+conta|no\s+pix/i.test(norm)) {
    const checkingAcc = accounts.find((a) => /corrente|banco|inter|nubank/i.test(a));
    if (checkingAcc) return { account: checkingAcc };
  }

  return { account: defaultAccount };
}

/**
 * Identifica a data
 */
function extractDate(text: string, referenceDateStr?: string): string {
  const norm = normalizeText(text);
  const baseDate = referenceDateStr ? new Date(`${referenceDateStr}T12:00:00`) : new Date();

  if (norm.includes('ontem')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (norm.includes('anteontem')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }
  if (norm.includes('amanha') || norm.includes('amanhã')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // Dia da semana mais recente
  const daysOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    if (new RegExp(`\\b${dayName}(?:-feira)?\\b`).test(norm)) {
      const currentDay = baseDate.getDay();
      let diff = currentDay - i;
      if (diff <= 0) diff += 7;
      const d = new Date(baseDate);
      d.setDate(d.getDate() - diff);
      return d.toISOString().split('T')[0];
    }
  }

  // "dia 15", "dia 5"
  const dayMatch = text.match(/\bdia\s+(\d{1,2})\b/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // dd/mm ou dd/mm/aaaa
  const dateSlashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateSlashMatch) {
    const day = String(parseInt(dateSlashMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(dateSlashMatch[2], 10)).padStart(2, '0');
    let year = baseDate.getFullYear();
    if (dateSlashMatch[3]) {
      const rawYear = parseInt(dateSlashMatch[3], 10);
      year = rawYear < 100 ? 2000 + rawYear : rawYear;
    }
    return `${year}-${month}-${day}`;
  }

  return baseDate.toISOString().split('T')[0];
}

/**
 * Divide o texto quando há múltiplos lançamentos sem corromper vírgulas decimais
 */
function splitMultiplePhrases(text: string): string[] {
  // Se contiver quebras de linha
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
  if (lines.length > 1) {
    return lines;
  }

  // Protege decimais como 26,50 ou 1.500,50
  const placeholder = text.replace(/(\d+),(\d+)/g, '$1___DEC___$2');

  // Divide por ';' ou ' e ' ou '+' ou ',' quando seguido de valor
  const parts = placeholder.split(/(?:;|\s+(?:e|\+)\s+|,\s*)(?=[a-zA-ZÀ-ÿ\s]*\b(?:\d+|R\$))/i);
  const restored = parts
    .map((p) => p.replace(/___DEC___/g, ',').trim())
    .filter((p) => /\d/.test(p));

  if (restored.length > 1) {
    return restored;
  }

  return [text.trim()];
}

/**
 * Cria uma descrição limpa, concisa e elegante
 */
function cleanDescription(
  rawText: string,
  fallbackDesc: string,
  isTransfer?: boolean,
  toAccount?: string
): string {
  if (isTransfer) {
    return toAccount ? `Transferência para ${toAccount}` : 'Transferência entre Contas';
  }

  // Preserva termos compostos chave antes de limpar
  const lower = rawText.toLowerCase();
  if (/conta\s+de\s+luz|energia\s+el[eé]trica/i.test(lower)) return 'Conta de Luz';
  if (/conta\s+de\s+[aá]gua/i.test(lower)) return 'Conta de Água';
  if (/fatura\s+do\s+cart[aã]o/i.test(lower)) return 'Fatura do Cartão';
  if (/troca\s+de\s+[oó]leo/i.test(lower)) return 'Troca de Óleo';
  if (/plano\s+de\s+sa[uú]de/i.test(lower)) return 'Plano de Saúde';

  let cleaned = rawText
    // Remove datas relativas e dias PRIMEIRO para não perder o número do dia
    .replace(/\b(hoje|ontem|anteontem|amanh[aã]|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/gi, '')
    // Remove menções de parcelas primeiro para não deixar o 'x' solto
    .replace(/(?:em\s+)?\d{1,2}\s*x\b/gi, '')
    .replace(/(?:em\s+)?\d{1,2}\s*(?:parcelas?|vezes)\b/gi, '')
    // Remove shorthand 10k
    .replace(/(?:R\$\s*)?\d+(?:[.,]\d+)?\s*k\b/gi, '')
    // Remove valores monetários
    .replace(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d+)?)(?:\s*(?:reais?|conto|pila|bar[aã]o))?/gi, '')
    // Remove formas de pagamento
    .replace(/\b(no\s+cart[aã]o|no\s+cr[eé]dito|no\s+d[eé]bito|na\s+carteira|no\s+banco|no\s+pix|em\s+dinheiro)\b/gi, '')
    // Remove stop words brasileiras seguras para Unicode (não quebra 'Almoço')
    .replace(
      /(?<=^|\s)(?:gastei|comprei|paguei|recebi|ganhei|de|com|por|para|pro|pra|o|a|os|as|um|uma|no|na|nos|nas|em|caiu|entrou|veio|fiz|mandei)(?=\s|$)/gi,
      ''
    )
    .trim();

  // Limpa caracteres especiais soltos
  cleaned = cleaned.replace(/^[-–—,.:\s]+|[-–—,.:\s]+$/g, '').trim();

  if (!cleaned || cleaned.length < 2) {
    return fallbackDesc;
  }

  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Heurística instantânea e ultra-inteligente (0ms)
 */
export function parseLocalText(
  text: string,
  accounts: string[] = ['Carteira', 'Conta Corrente', 'Cartão de Crédito'],
  categories: string[] = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Vestuário', 'Outros'],
  referenceDateStr?: string
): ParseResult {
  const phrases = splitMultiplePhrases(text);
  const parsedItems: ParsedTransactionItem[] = [];

  for (const phrase of phrases) {
    const norm = normalizeText(phrase);

    // 1. Extração do valor e parcelamento juntos
    const { installments, isTotalAmount, amount } = extractInstallmentsAndAmount(phrase);
    if (amount <= 0 && phrases.length > 1) {
      continue;
    }

    // 2. Extração do tipo
    let type: TransactionType = 'despesa';
    const isIncome = /\b(recebi|ganhei|salario|salário|rendimento|rendimentos|dividendo|proventos|freela|freelance|bico|venda|vendi|estorno|reembolso|lucro|comissao|comissão|13o|férias|ferias|caiu|entrou|pix recebido|depósito recebido)\b/i.test(
      norm
    );
    const isTransfer = /\b(transferi|transferencia|transferência|transf|ted|doc|passei|mandei|da\s+conta\s+.*?\s+para)\b/i.test(
      norm
    );

    if (isIncome) {
      type = 'receita';
    } else if (isTransfer) {
      type = 'transferencia';
    }

    // 3. Data
    const date = extractDate(phrase, referenceDateStr);

    // 4. Categoria
    const defaultCat = type === 'receita' ? 'Salário' : type === 'transferencia' ? 'Outros' : 'Alimentação';
    const category = matchCategory(phrase, categories, defaultCat);

    // 5. Conta e toAccount
    const defaultAcc = accounts[0] || 'Carteira';
    const { account, toAccount } = matchAccount(phrase, accounts, defaultAcc);

    // 6. Descrição
    let fallbackDesc = 'Despesa';
    if (type === 'receita') fallbackDesc = category === 'Salário' ? 'Salário' : 'Receita';
    else if (type === 'transferencia') fallbackDesc = 'Transferência';
    else if (category) fallbackDesc = category;

    const description = cleanDescription(phrase, fallbackDesc, type === 'transferencia', toAccount);

    parsedItems.push({
      description,
      amount: amount > 0 ? amount : 0,
      type,
      category,
      account,
      toAccount,
      date,
      installments: installments > 1 ? installments : undefined,
      isTotalAmount,
      note: 'Lançado via Chat Inteligente',
    });
  }

  // Gera resposta amigável e clara em português
  let replyMessage = '';
  if (parsedItems.length === 1) {
    const item = parsedItems[0];
    const formattedVal = `R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (item.type === 'transferencia') {
      replyMessage = `Entendido! Identifiquei uma transferência de ${formattedVal} da conta ${item.account}${item.toAccount ? ` para ${item.toAccount}` : ''}.`;
    } else if (item.installments && item.installments > 1) {
      const parcelText = item.isTotalAmount
        ? `${formattedVal} parcelado em ${item.installments}x`
        : `${item.installments}x de ${formattedVal}`;
      replyMessage = `Entendido! Identifiquei uma compra de "${item.description}" (${parcelText}) em ${item.category} na conta ${item.account}.`;
    } else if (item.type === 'receita') {
      replyMessage = `Ótimo! Identifiquei uma receita de "${item.description}" no valor de ${formattedVal} em ${item.account}.`;
    } else {
      replyMessage = `Entendido! Identifiquei um gasto de "${item.description}" no valor de ${formattedVal} em ${item.category} (${item.account}).`;
    }
  } else if (parsedItems.length > 1) {
    replyMessage = `Perfeito! Identifiquei ${parsedItems.length} lançamentos na sua mensagem. Confira os cartões abaixo e confirme para salvar:`;
  } else {
    replyMessage = `Não consegui identificar o valor ou detalhes do lançamento. Você pode digitar por exemplo: "Almoço 42 no cartão" ou "Uber 25 ontem".`;
  }

  return {
    replyMessage,
    transactions: parsedItems,
  };
}

/**
 * Função principal: Executa o parser local com altíssima agilidade (<5ms)
 * e consulta a API se necessário de forma não bloqueante ou com timeout estrito.
 */
export async function parseTransactionWithAI(
  text: string,
  accounts: string[],
  categories: string[],
  referenceDate?: string
): Promise<ParseResult> {
  const localResult = parseLocalText(text, accounts, categories, referenceDate);

  // Se o parser local já obteve dados precisos (todos com valor > 0)
  const isHighConfidence =
    localResult.transactions.length > 0 &&
    localResult.transactions.every((t) => t.amount > 0 && t.description.length > 1);

  if (isHighConfidence) {
    // Retorno instantâneo! Sem qualquer atraso de 10 segundos
    return localResult;
  }

  // Se o texto for ambíguo ou sem valor explícito, tenta a API remota com timeout curto (2500ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/ai/parse-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        accounts,
        categories,
        referenceDate: referenceDate || new Date().toISOString().split('T')[0],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
        return data as ParseResult;
      }
    }
  } catch (err) {
    // Ignora timeout e usa o resultado local
  }

  return localResult;
}
