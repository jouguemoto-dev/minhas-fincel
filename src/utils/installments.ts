import { Transaction, TransactionType } from '../types';
import { formatCurrency } from './formatters';

export interface GenerateInstallmentParams {
  date: string; // YYYY-MM-DD (data da 1ª parcela)
  description: string;
  category: string;
  account: string;
  amount: number; // Valor informado (pode ser total ou por parcela)
  type: TransactionType;
  installmentsCount: number; // 2 a 72
  isTotalAmount: boolean; // Se true, amount é o total e divide; se false, amount é de cada parcela e multiplica
  isConsolidated?: boolean;
  consolidateFirstOnly?: boolean;
  note?: string;
  reminder?: string;
  toAccount?: string;
}

/**
 * Avança uma data no formato YYYY-MM-DD por N meses, respeitando o número máximo de dias do mês de destino.
 * Exemplo: 31/01 + 1 mês = 28/02 (ou 29/02), 31/03 + 1 mês = 30/04.
 */
export function advanceDateByMonths(baseDateStr: string, monthsToAdd: number): string {
  const [yearStr, monthStr, dayStr] = baseDateStr.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonth = parseInt(monthStr, 10) - 1; // 0 a 11
  const baseDay = parseInt(dayStr, 10);

  const totalMonths = baseMonth + monthsToAdd;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12; // 0 a 11

  // Número de dias no mês alvo
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(baseDay, daysInTargetMonth);

  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

/**
 * Calcula o resumo de valores do parcelamento (total e por parcela com centavos).
 */
export function calculateInstallmentValues(
  amount: number,
  installmentsCount: number,
  isTotalAmount: boolean
): {
  totalAmount: number;
  baseInstallmentAmount: number;
  remainderCents: number;
  summaryText: string;
} {
  const safeCount = Math.max(2, installmentsCount || 2);
  const absAmount = Math.abs(amount);

  if (isTotalAmount) {
    const totalCents = Math.round(absAmount * 100);
    const baseCents = Math.floor(totalCents / safeCount);
    const remainderCents = totalCents - baseCents * safeCount;
    const baseInstallmentAmount = baseCents / 100;
    const firstInstallmentAmount = (baseCents + (remainderCents > 0 ? 1 : 0)) / 100;

    const summaryText = remainderCents > 0
      ? `${safeCount}x de aprox. ${formatCurrency(firstInstallmentAmount)} (Total: ${formatCurrency(absAmount)})`
      : `${safeCount}x de ${formatCurrency(baseInstallmentAmount)} (Total: ${formatCurrency(absAmount)})`;

    return {
      totalAmount: absAmount,
      baseInstallmentAmount,
      remainderCents,
      summaryText,
    };
  } else {
    const totalAmount = absAmount * safeCount;
    const summaryText = `${safeCount}x de ${formatCurrency(absAmount)} (Total: ${formatCurrency(totalAmount)})`;

    return {
      totalAmount,
      baseInstallmentAmount: absAmount,
      remainderCents: 0,
      summaryText,
    };
  }
}

/**
 * Gera todas as transações parceladas com divisão exata de centavos e avanço mensal de datas.
 */
export function generateInstallmentTransactions(
  params: GenerateInstallmentParams
): Omit<Transaction, 'id'>[] {
  const {
    date,
    description,
    category,
    account,
    amount,
    type,
    installmentsCount,
    isTotalAmount,
    isConsolidated = false,
    consolidateFirstOnly = false,
    note,
    reminder,
    toAccount,
  } = params;

  const count = Math.max(2, installmentsCount || 2);
  const cleanDescription = description.trim().replace(/\s*\(\d+\s*[\/|\\]\s*\d+\)$/, '') || 'Compra Parcelada';
  const groupId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const { totalAmount, baseInstallmentAmount, remainderCents, summaryText } =
    calculateInstallmentValues(amount, count, isTotalAmount);

  const isExpense = type === 'despesa';
  const transactions: Omit<Transaction, 'id'>[] = [];

  for (let i = 1; i <= count; i++) {
    const installmentDate = advanceDateByMonths(date, i - 1);
    
    // Distribui o resto dos centavos nas primeiras parcelas
    let installmentValue = baseInstallmentAmount;
    if (isTotalAmount && i <= remainderCents) {
      installmentValue = Math.round((baseInstallmentAmount + 0.01) * 100) / 100;
    }

    const finalAmount = isExpense ? -Math.abs(installmentValue) : Math.abs(installmentValue);
    const installmentConsolidated = consolidateFirstOnly ? (i === 1 ? isConsolidated : false) : isConsolidated;

    const installmentNoteParts: string[] = [];
    if (note?.trim()) {
      installmentNoteParts.push(note.trim());
    }
    installmentNoteParts.push(`[Parcelamento: ${i}/${count} | ${summaryText}]`);

    const roundedFinalAmount = Math.round(finalAmount * 100) / 100;

    const txItem: Omit<Transaction, 'id'> = {
      date: installmentDate,
      description: `${cleanDescription} (${i}/${count})`.substring(0, 195),
      category: (category || 'Outros').substring(0, 95),
      account: (account || 'Carteira').substring(0, 95),
      amount: roundedFinalAmount,
      type,
      isConsolidated: installmentConsolidated,
      isRecurring: true,
      recurrenceText: `${i} / ${count}`.substring(0, 95),
      installmentNumber: i,
      totalInstallments: count,
      installmentGroupId: groupId.substring(0, 95),
      note: installmentNoteParts.join(' - ').substring(0, 490),
    };

    if (reminder) {
      txItem.reminder = reminder.substring(0, 95);
    }
    if (type === 'transferencia' && toAccount) {
      txItem.toAccount = toAccount.substring(0, 95);
    }

    transactions.push(txItem);
  }

  return transactions;
}
