import { Account, Category, Dream, Transaction, CreditCard } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Carteira', balance: 0, initialBalance: 0, type: 'carteira', isChecked: true },
  { id: '2', name: 'Conta corrente', balance: 0, initialBalance: 0, type: 'corrente', isChecked: true },
  { id: '3', name: 'Cartão de crédito', balance: 0, initialBalance: 0, type: 'cartao', isChecked: true },
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card_default_1',
    name: 'Cartão de crédito',
    brand: 'mastercard',
    limit: 5000,
    closingDay: 5,
    dueDay: 12,
    color: '#820ad1',
    last4Digits: '4890',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'sem_cat', name: 'Sem Categoria', type: 'despesa' },
  { id: 'transf', name: 'Transferência', type: 'despesa' },
  {
    id: 'alim',
    name: 'Alimentação',
    type: 'despesa',
    subcategories: ['Restaurante', 'Mercado', 'Lanches'],
  },
  {
    id: 'casa',
    name: 'Moradia',
    type: 'despesa',
    subcategories: ['Aluguel', 'Energia', 'Água', 'Internet'],
  },
  {
    id: 'educ',
    name: 'Educação',
    type: 'despesa',
    subcategories: ['Cursos', 'Livros'],
  },
  { id: 'lazer', name: 'Lazer', type: 'despesa', subcategories: ['Passeios', 'Streaming'] },
  { id: 'outros', name: 'Outras despesas', type: 'despesa' },
  {
    id: 'rec',
    name: 'Receitas',
    type: 'receita',
    subcategories: ['Salário', 'Freelance', 'Outras receitas'],
  },
  { id: 'saude', name: 'Saúde', type: 'despesa', subcategories: ['Farmácia', 'Consultas'] },
  {
    id: 'transp',
    name: 'Transporte',
    type: 'despesa',
    subcategories: ['Combustível', 'Transporte público'],
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_DREAMS: Dream[] = [];
