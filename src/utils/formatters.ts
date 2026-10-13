export function formatCurrency(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}R$ ${formatted}`;
}

export function formatSimpleAmount(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted;
}

export function formatSignedAmount(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < 0) {
    return `- ${formatted}`;
  } else if (value > 0) {
    return `+ ${formatted}`;
  }
  return formatted;
}

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DAYS_OF_WEEK_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export function getMonthYearLabel(year: number, monthIndex: number): string {
  return `${MONTH_NAMES_PT[monthIndex]}/${year}`;
}

/**
 * Retorna a data local no formato YYYY-MM-DD sem distorção de fuso horário UTC (evita pular dia após as 21h no Brasil).
 */
export function getTodayDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateShortYear(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
}

export function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAYS_OF_WEEK_PT[date.getDay()];
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${dd}/${mm}/${y}, ${dayName}`;
}

/**
 * Formata um valor monetário durante a digitação no padrão brasileiro (R$ 1.250,00).
 * Faz a separação de vírgula e milhar automaticamente enquanto o usuário digita.
 * Ex: '1' -> '0,01', '12' -> '0,12', '120' -> '1,20', '1200' -> '12,00', '120000' -> '1.200,00'
 */
export function formatCurrencyInput(rawValue: string, prevValue?: string): string {
  if (!rawValue) return '';

  // Se o usuário digitou explicitamente vírgula ou ponto no final após ter dígitos inteiros
  if (rawValue.endsWith(',') || rawValue.endsWith('.')) {
    const onlyDigits = rawValue.replace(/\D/g, '');
    if (!onlyDigits) return '0,00';
    const num = parseInt(onlyDigits, 10);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Extrai apenas os dígitos digitados
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';

  const cents = parseInt(digits, 10);
  if (isNaN(cents) || cents === 0) return '0,00';

  const val = cents / 100;
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte o valor monetário formatado (ex: "1.250,50") para número float puro (ex: 1250.50).
 */
export function parseCurrencyInput(formattedStr: string): number {
  if (!formattedStr) return 0;
  const clean = formattedStr.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
