import { CreditCard, Transaction } from '../types';
import { formatCurrency, MONTH_NAMES_PT } from './formatters';

export interface CardInvoiceSummary {
  card: CreditCard;
  currentInvoiceAmount: number;
  futureInstallmentsAmount: number;
  totalCommittedAmount: number;
  availableLimit: number;
  limitUsedPercent: number;
  closingDateStr: string; // YYYY-MM-DD
  dueDateStr: string; // YYYY-MM-DD
  bestDayToBuy: number;
  isOpen: boolean; // true if invoice not yet closed
  statusText: string;
  invoiceTransactions: Transaction[];
  upcomingTransactions: Transaction[];
}

export interface ActiveInstallmentPurchase {
  id: string; // groupId or fallback
  description: string;
  account: string;
  category: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  currentInstallmentIndex: number;
  installmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  finalDate: string;
  finalMonthYear: string; // e.g. "Dezembro/2026"
  finalMonthYearShort: string; // e.g. "Dez/26"
  timeRemainingText: string; // e.g. "Faltam 5 meses (Dez/26)" ou "Última parcela este mês!"
  progressPercent: number;
  isCompleted: boolean;
  transactions: Transaction[];
}

export interface InstallmentsOverallSummary {
  totalPurchasesCount: number;
  activePurchasesCount: number;
  monthlyInstallmentTotal: number;
  totalRemainingDebt: number;
  totalOriginalDebt: number;
  overallFinalDate: string | null;
  overallFinalMonthYear: string | null;
}

/**
 * Returns whether a transaction belongs to a given credit card
 */
export function isTransactionOfCard(t: Transaction, card: CreditCard, allCards: CreditCard[] = []): boolean {
  if (!t.account) return false;
  const accLower = t.account.trim().toLowerCase();
  const cardNameLower = card.name.trim().toLowerCase();

  if (accLower === cardNameLower) return true;
  if (accLower.includes(cardNameLower) || cardNameLower.includes(accLower)) return true;

  // If there's only 1 card and account is 'Cartão de crédito' or 'Cartão'
  if (allCards.length === 1 && (accLower.includes('cartão') || accLower.includes('cartao'))) {
    return true;
  }

  return false;
}

/**
 * Calculates current invoice and limit details for a credit card
 */
export function calculateCardInvoice(
  card: CreditCard,
  transactions: Transaction[],
  allCards: CreditCard[] = [],
  referenceDate: Date = new Date()
): CardInvoiceSummary {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-11
  const refDay = referenceDate.getDate();

  const closingDay = Math.min(Math.max(1, Math.round(Number(card.closingDay)) || 5), 31);
  const dueDay = Math.min(Math.max(1, Math.round(Number(card.dueDay)) || 10), 31);

  // Exact cycle calculation
  let closingYear = refYear;
  let closingMonth = refMonth;
  let dueYear = refYear;
  let dueMonth = refMonth;
  let isOpen = true;

  if (closingDay < dueDay) {
    // Both in same calendar month cycle: closes e.g. 5th, due 12th
    if (refDay <= closingDay) {
      // Before closing: current month invoice is open
      closingMonth = refMonth;
      dueMonth = refMonth;
      isOpen = true;
    } else if (refDay <= dueDay) {
      // Between closing and due: current month invoice is closed and awaiting payment
      closingMonth = refMonth;
      dueMonth = refMonth;
      isOpen = false;
    } else {
      // After due date: next month invoice is open
      closingMonth = refMonth + 1;
      dueMonth = refMonth + 1;
      isOpen = true;
    }
  } else {
    // Due date is in next month: closes e.g. 25th, due 5th of next month
    if (refDay <= dueDay) {
      // Days 1 to dueDay (e.g. 1st to 5th): last month's invoice is closed and due this month
      closingMonth = refMonth - 1;
      dueMonth = refMonth;
      isOpen = false;
    } else if (refDay <= closingDay) {
      // Days between dueDay and closingDay (e.g. 6th to 25th): this month's invoice is open
      closingMonth = refMonth;
      dueMonth = refMonth + 1;
      isOpen = true;
    } else {
      // Days after closing (e.g. 26th to 31st): this month's invoice closed on 25th, due next month
      closingMonth = refMonth;
      dueMonth = refMonth + 1;
      isOpen = false;
    }
  }

  // Adjust for month/year rollovers
  const closingObj = new Date(closingYear, closingMonth, 1);
  const actualClosingYear = closingObj.getFullYear();
  const actualClosingMonth = closingObj.getMonth();
  const maxDayInClosingMonth = new Date(actualClosingYear, actualClosingMonth + 1, 0).getDate();
  const actualClosingDay = Math.min(closingDay, maxDayInClosingMonth);
  const closingDateStr = `${actualClosingYear}-${String(actualClosingMonth + 1).padStart(2, '0')}-${String(actualClosingDay).padStart(2, '0')}`;

  const dueObj = new Date(dueYear, dueMonth, 1);
  const actualDueYear = dueObj.getFullYear();
  const actualDueMonth = dueObj.getMonth();
  const maxDayInDueMonth = new Date(actualDueYear, actualDueMonth + 1, 0).getDate();
  const actualDueDay = Math.min(dueDay, maxDayInDueMonth);
  const dueDateStr = `${actualDueYear}-${String(actualDueMonth + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

  // Previous closing date (start of invoice) = 1 month before closingDateStr
  const prevClosingObj = new Date(actualClosingYear, actualClosingMonth - 1, 1);
  const prevClosingYear = prevClosingObj.getFullYear();
  const prevClosingMonth = prevClosingObj.getMonth();
  const maxDayInPrevMonth = new Date(prevClosingYear, prevClosingMonth + 1, 0).getDate();
  const actualPrevClosingDay = Math.min(closingDay, maxDayInPrevMonth);
  const prevClosingDateStr = `${prevClosingYear}-${String(prevClosingMonth + 1).padStart(2, '0')}-${String(actualPrevClosingDay).padStart(2, '0')}`;

  // Filter transactions of this card
  const cardTxs = transactions.filter((t) => isTransactionOfCard(t, card, allCards));

  // Current invoice transactions (between prevClosingDate + 1 day and closingDate)
  const invoiceTransactions = cardTxs.filter(
    (t) => t.date > prevClosingDateStr && t.date <= closingDateStr && t.type !== 'transferencia'
  );

  const currentInvoiceExpenses = invoiceTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const currentInvoiceCredits = invoiceTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentInvoiceAmount = Math.max(0, currentInvoiceExpenses - currentInvoiceCredits);

  // Future installments committed beyond the closing date
  const upcomingTransactions = cardTxs.filter((t) => t.date > closingDateStr && t.amount < 0);
  const futureInstallmentsAmount = upcomingTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalCommittedAmount = currentInvoiceAmount + futureInstallmentsAmount;
  const limit = card.limit || 0;
  const availableLimit = Math.max(0, limit - totalCommittedAmount);
  const limitUsedPercent = limit > 0 ? Math.min(100, Math.round((totalCommittedAmount / limit) * 100)) : 0;

  const statusText = isOpen
    ? `Fatura Aberta (Fecha em ${actualClosingDay}/${String(actualClosingMonth + 1).padStart(2, '0')})`
    : `Fatura Fechada (Vence em ${actualDueDay}/${String(actualDueMonth + 1).padStart(2, '0')})`;

  const bestDayToBuy = actualClosingDay;

  return {
    card,
    currentInvoiceAmount,
    futureInstallmentsAmount,
    totalCommittedAmount,
    availableLimit,
    limitUsedPercent,
    closingDateStr,
    dueDateStr,
    bestDayToBuy,
    isOpen,
    statusText,
    invoiceTransactions,
    upcomingTransactions,
  };
}

/**
 * Extracts and aggregates all installment purchases, calculating when each will end
 */
export function getActiveInstallmentPurchases(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): ActiveInstallmentPurchase[] {
  const todayStr = referenceDate.toISOString().split('T')[0];

  // Group transactions by installment group or by matching pattern
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    // 1. Direct installmentGroupId
    if (tx.installmentGroupId) {
      if (!groups[tx.installmentGroupId]) groups[tx.installmentGroupId] = [];
      groups[tx.installmentGroupId].push(tx);
      return;
    }

    // 2. Pattern matching description like "Celular (3/10)"
    const match = tx.description.match(/^(.+?)\s*\((\d+)\s*[\/|\\]\s*(\d+)\)$/);
    if (match) {
      const baseName = match[1].trim().toLowerCase();
      const totalCount = parseInt(match[3], 10);
      const groupKey = `pattern_${baseName}_${tx.account}_${totalCount}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(tx);
      return;
    }

    // 3. Explicit totalInstallments
    if (tx.totalInstallments && tx.totalInstallments > 1) {
      const baseName = tx.description.replace(/\s*\(\d+\/\d+\)/, '').trim().toLowerCase();
      const groupKey = `field_${baseName}_${tx.account}_${tx.totalInstallments}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(tx);
    }
  });

  const result: ActiveInstallmentPurchase[] = [];

  Object.entries(groups).forEach(([groupId, txList]) => {
    if (txList.length === 0) return;

    // Sort by date ascending
    const sorted = [...txList].sort((a, b) => a.date.localeCompare(b.date));
    const firstTx = sorted[0];
    const lastTx = sorted[sorted.length - 1];

    // Clean description without "(X/Y)"
    const cleanDesc = firstTx.description.replace(/\s*\(\d+\s*[\/|\\]\s*\d+\)$/, '').trim() || 'Compra Parcelada';

    // Total installments count
    const totalInstallments = firstTx.totalInstallments || sorted.length;

    // Installment amounts
    const absAmounts = sorted.map((t) => Math.abs(t.amount));
    const totalAmount = absAmounts.reduce((sum, val) => sum + val, 0);
    const avgInstallmentAmount = sorted.length > 0 ? totalAmount / sorted.length : 0;

    // Determine paid vs remaining:
    // Considered paid if consolidated OR if date <= today
    const paidTxs = sorted.filter((t) => t.isConsolidated || t.date <= todayStr);
    const paidInstallments = paidTxs.length;
    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);

    const paidAmount = paidTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // Current installment index (relative to reference date)
    const currentTx = sorted.find((t) => t.date >= todayStr) || lastTx;
    const currentInstallmentIndex = currentTx.installmentNumber || Math.min(totalInstallments, paidInstallments + 1);

    // Final date details
    const finalDate = lastTx.date;
    const [finalYearStr, finalMonthStr] = finalDate.split('-');
    const finalYear = parseInt(finalYearStr, 10);
    const finalMonthIdx = parseInt(finalMonthStr, 10) - 1;

    const finalMonthName = MONTH_NAMES_PT[finalMonthIdx] || 'Mês';
    const finalMonthYear = `${finalMonthName}/${finalYear}`;
    const finalMonthYearShort = `${finalMonthName.substring(0, 3)}/${String(finalYear).slice(-2)}`;

    // Time remaining text
    let timeRemainingText = '';
    const isCompleted = remainingInstallments === 0 || (paidInstallments >= totalInstallments);

    if (isCompleted) {
      timeRemainingText = 'Quitado 🎉';
    } else if (remainingInstallments === 1) {
      timeRemainingText = `Última parcela este mês! (${finalMonthYearShort})`;
    } else {
      timeRemainingText = `Faltam ${remainingInstallments} parcelas (Termina em ${finalMonthYearShort})`;
    }

    const progressPercent = totalInstallments > 0 ? Math.min(100, Math.round((paidInstallments / totalInstallments) * 100)) : 100;

    result.push({
      id: groupId,
      description: cleanDesc,
      account: firstTx.account,
      category: firstTx.category,
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      currentInstallmentIndex,
      installmentAmount: avgInstallmentAmount,
      totalAmount,
      paidAmount,
      remainingAmount,
      startDate: firstTx.date,
      finalDate,
      finalMonthYear,
      finalMonthYearShort,
      timeRemainingText,
      progressPercent,
      isCompleted,
      transactions: sorted,
    });
  });

  // Sort active first, then by final date descending
  return result.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return a.finalDate.localeCompare(b.finalDate);
  });
}

/**
 * Calculates overall summary of all active installments
 */
export function getInstallmentOverallSummary(
  installments: ActiveInstallmentPurchase[]
): InstallmentsOverallSummary {
  const activeOnly = installments.filter((item) => !item.isCompleted);

  const totalPurchasesCount = installments.length;
  const activePurchasesCount = activeOnly.length;

  const monthlyInstallmentTotal = activeOnly.reduce((sum, item) => sum + item.installmentAmount, 0);
  const totalRemainingDebt = activeOnly.reduce((sum, item) => sum + item.remainingAmount, 0);
  const totalOriginalDebt = installments.reduce((sum, item) => sum + item.totalAmount, 0);

  let overallFinalDate: string | null = null;
  let overallFinalMonthYear: string | null = null;

  if (activeOnly.length > 0) {
    const dates = activeOnly.map((i) => i.finalDate).sort();
    overallFinalDate = dates[dates.length - 1];
    const [yStr, mStr] = overallFinalDate.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    overallFinalMonthYear = `${MONTH_NAMES_PT[mIdx]}/${yStr}`;
  }

  return {
    totalPurchasesCount,
    activePurchasesCount,
    monthlyInstallmentTotal,
    totalRemainingDebt,
    totalOriginalDebt,
    overallFinalDate,
    overallFinalMonthYear,
  };
}

/**
 * Brand visual styling helpers
 */
export const CARD_BRAND_DETAILS: Record<
  CreditCard['brand'],
  { label: string; logoText: string; defaultColor: string; bgGradient: string }
> = {
  mastercard: {
    label: 'Mastercard',
    logoText: '🔴🟠 mastercard',
    defaultColor: '#eb001b',
    bgGradient: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
  },
  visa: {
    label: 'Visa',
    logoText: 'VISA',
    defaultColor: '#1a1f71',
    bgGradient: 'from-[#1e3a8a] via-[#172554] to-[#0f172a]',
  },
  elo: {
    label: 'Elo',
    logoText: 'elo',
    defaultColor: '#00a4e4',
    bgGradient: 'from-[#0369a1] via-[#075985] to-[#0c4a6e]',
  },
  amex: {
    label: 'American Express',
    logoText: 'AMEX',
    defaultColor: '#2e77bc',
    bgGradient: 'from-[#047857] via-[#065f46] to-[#064e3b]',
  },
  hipercard: {
    label: 'Hipercard',
    logoText: 'HIPERCARD',
    defaultColor: '#b91c1c',
    bgGradient: 'from-[#991b1b] via-[#7f1d1d] to-[#450a0a]',
  },
  outro: {
    label: 'Outro',
    logoText: 'CARD',
    defaultColor: '#52525b',
    bgGradient: 'from-[#334155] via-[#1e293b] to-[#0f172a]',
  },
};
