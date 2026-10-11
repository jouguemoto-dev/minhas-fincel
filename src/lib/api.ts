import { Account, Category, Dream, Transaction } from '../types';

export interface FinanceData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  dreams: Dream[];
}

export interface AuthResponse {
  token: string;
  user: { email: string };
  data: FinanceData;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Falha na solicitação (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function register(email: string, password: string, data: FinanceData) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, data }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getFinanceData(token: string) {
  return request<FinanceData>('/api/data', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function saveFinanceData(token: string, data: FinanceData) {
  return request<void>('/api/data', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function logout(token: string) {
  return request<void>('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
