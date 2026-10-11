export type TransactionType = 'despesa' | 'receita' | 'transferencia';

export interface Account {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  type: 'carteira' | 'corrente' | 'cartao' | 'poupanca' | 'investimento';
  isChecked: boolean;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'despesa' | 'receita';
  subcategories?: string[];
  isOpen?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  account: string;
  amount: number; // positive for income, negative for expense
  type: TransactionType;
  isConsolidated: boolean;
  isRecurring?: boolean;
  recurrenceText?: string;
  reminder?: string;
  note?: string;
  toAccount?: string; // for transfer
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
}

export interface Dream {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
}

export interface BudgetCategory {
  category: string;
  budgeted: number;
}
