import React, { useState, useEffect, useRef } from 'react';
import { Account, Category, Transaction, Dream, CreditCard } from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_DREAMS,
} from './data/initialData';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { SonhosView } from './components/SonhosView';
import { OrcamentoView } from './components/OrcamentoView';
import { AnaliseView } from './components/AnaliseView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { ExportModal } from './components/ExportModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { AccountModal } from './components/AccountModal';
import { CategoryModal } from './components/CategoryModal';
import { CreditCardModal } from './components/CreditCardModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { InstallmentPurchaseModal } from './components/InstallmentPurchaseModal';
import { ChatTransactionModal } from './components/ChatTransactionModal';
import { InstallAndroidModal } from './components/InstallAndroidModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileQuickAddModal } from './components/MobileQuickAddModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthScreen } from './components/AuthScreen';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Wallet, Smartphone, X, Sparkles } from 'lucide-react';
import { formatCurrency } from './utils/formatters';
import { generateInstallmentTransactions } from './utils/installments';
import { AuthResponse, FinanceData, getFinanceData, logout, saveFinanceData } from './lib/api';
import {
  loadUserFinanceData,
  saveUserFinanceData,
  loginWithGoogle,
  logoutFirebase,
  subscribeToAuthState,
  subscribeToUserFinanceData,
  saveAccountInstant,
  deleteAccountInstant,
  saveCreditCardInstant,
  deleteCreditCardInstant,
  saveTransactionInstant,
  saveMultipleTransactionsInstant,
  deleteTransactionInstant,
  saveCategoryInstant,
  deleteCategoryInstant,
  saveDreamInstant,
  deleteDreamInstant,
  resetUserDataToZero,
} from './lib/firebase';

export default function App() {
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    const token = localStorage.getItem('me_auth_token_v1');
    if (token === 'local_session_julio' || token === 'local_julio') {
      localStorage.removeItem('me_auth_token_v1');
      localStorage.removeItem('me_auth_email_v1');
      return null;
    }
    return token;
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    const token = localStorage.getItem('me_auth_token_v1');
    if (token === 'local_session_julio' || token === 'local_julio') {
      return '';
    }
    const email = localStorage.getItem('me_auth_email_v1');
    if (email === 'julio@cbcenergiasrenovaveis.com' && !token) {
      return '';
    }
    return email || '';
  });
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  // Privacy Mode (Hide/Show balances) & Mobile Quick Add
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('me_privacy_mode_v1') === 'true';
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'despesa' | 'receita' | 'transferencia'>('despesa');

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('me_privacy_mode_v1', String(next));
      return next;
    });
  };

  const handleOpenQuickAdd = (type: 'despesa' | 'receita' | 'transferencia' = 'despesa') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Month and year state (Defaults dynamically to current real month & year)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Core Data States with localStorage persistence (clearing any old sample/dummy data)
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('me_accounts_v1');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('me_categories_v1');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('me_transactions_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((t: Transaction) => t.id === 'tx-1' || t.description === 'Compra no mercado')) {
          localStorage.removeItem('me_transactions_v1');
          return INITIAL_TRANSACTIONS;
        }
        return parsed;
      } catch {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [dreams, setDreams] = useState<Dream[]>(() => {
    const saved = localStorage.getItem('me_dreams_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((d: Dream) => d.title === 'Fundo para imprevistos')) {
          localStorage.removeItem('me_dreams_v1');
          return INITIAL_DREAMS;
        }
        return parsed;
      } catch {
        return INITIAL_DREAMS;
      }
    }
    return INITIAL_DREAMS;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('me_credit_cards_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_CREDIT_CARDS;
      }
    }
    return INITIAL_CREDIT_CARDS;
  });

  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);

  // Filters state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() =>
    INITIAL_ACCOUNTS.map((a) => a.id)
  );
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Listen for real Firebase auth session changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((fbUser) => {
      setAuthChecking(false);
      if (fbUser) {
        const token = `fb_${fbUser.uid}`;
        const email = fbUser.email || '';
        setSessionToken(token);
        setUserEmail(email);
        localStorage.setItem('me_auth_token_v1', token);
        localStorage.setItem('me_auth_email_v1', email);
      } else {
        setSessionToken((prev) => {
          if (prev && prev.startsWith('fb_')) {
            localStorage.removeItem('me_auth_token_v1');
            localStorage.removeItem('me_auth_email_v1');
            return null;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionToken || sessionToken.startsWith('local_')) {
      setAuthLoading(false);
      setDataLoaded(true);
      return;
    }

    if (sessionToken.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setAuthLoading(true);

      const safetyTimer = setTimeout(() => {
        setAuthLoading(false);
      }, 1500);

      // Real-time automatic instant synchronization with Firestore
      const unsubscribe = subscribeToUserFinanceData(
        uid,
        (data) => {
          clearTimeout(safetyTimer);

          // Only perform new user initialization once all 5 collections have responded
          if (data.isInitialLoadComplete === false) {
            return;
          }

          const isBrandNewUser =
            data.accounts.length === 0 &&
            (!data.creditCards || data.creditCards.length === 0) &&
            data.categories.length === 0 &&
            data.transactions.length === 0;

          if (isBrandNewUser) {
            const cleanInitialData = {
              accounts: INITIAL_ACCOUNTS,
              categories: INITIAL_CATEGORIES,
              transactions: [],
              dreams: [],
              creditCards: INITIAL_CREDIT_CARDS,
            };
            saveUserFinanceData(uid, userEmail || 'usuario@local.domain', cleanInitialData).catch(console.error);
            setAccounts(INITIAL_ACCOUNTS);
            setCategories(INITIAL_CATEGORIES);
            setTransactions([]);
            setDreams([]);
            setCreditCards(INITIAL_CREDIT_CARDS);
            setSelectedAccountIds(INITIAL_ACCOUNTS.map((a) => a.id));
          } else {
            setAccounts(data.accounts);
            setCategories(data.categories.length > 0 ? data.categories : INITIAL_CATEGORIES);
            setTransactions(data.transactions);
            setDreams(data.dreams);
            setCreditCards(data.creditCards || []);
            setSelectedAccountIds((prev) =>
              prev.length > 0 ? prev : data.accounts.map((a) => a.id)
            );
          }
          setDataLoaded(true);
          setAuthLoading(false);
          setAuthError('');
        },
        (err) => {
          clearTimeout(safetyTimer);
          console.warn('Firestore subscription fallback:', err);
          setAuthLoading(false);
        }
      );

      return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
      };
    } else {
      let active = true;
      getFinanceData(sessionToken)
        .then((data) => {
          if (!active) return;
          setAccounts(data.accounts);
          setCategories(data.categories);
          setTransactions(data.transactions);
          setDreams(data.dreams);
          if (data.creditCards && data.creditCards.length > 0) {
            setCreditCards(data.creditCards);
          }
          setSelectedAccountIds(data.accounts.map((account) => account.id));
          setDataLoaded(true);
          setAuthError('');
        })
        .catch((error: unknown) => {
          if (!active) return;
          console.warn('Backend sync fallback to local mode:', error);
          setSessionToken('local_guest');
          setDataLoaded(true);
        })
        .finally(() => {
          if (active) setAuthLoading(false);
        });

      return () => {
        active = false;
      };
    }
  }, [sessionToken]);

  // Persist local state whenever changes happen
  useEffect(() => {
    localStorage.setItem('me_accounts_v1', JSON.stringify(accounts));
    localStorage.setItem('me_categories_v1', JSON.stringify(categories));
    localStorage.setItem('me_transactions_v1', JSON.stringify(transactions));
    localStorage.setItem('me_dreams_v1', JSON.stringify(dreams));
    localStorage.setItem('me_credit_cards_v1', JSON.stringify(creditCards));
  }, [accounts, categories, transactions, dreams, creditCards]);

  useEffect(() => {
    if (!sessionToken || !dataLoaded) return;
    if (sessionToken.startsWith('fb_')) return; // Real-time mutations handle Firebase instantly

    const timeout = window.setTimeout(() => {
      const data: FinanceData = { accounts, categories, transactions, dreams, creditCards };
      setSyncError('');
      setIsSyncing(true);
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveFinanceData(sessionToken, data))
        .catch((error: unknown) => {
          console.warn('Sync status notice:', error);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [accounts, categories, transactions, dreams, creditCards, sessionToken, dataLoaded]);

  const handleAuthenticated = (response: AuthResponse) => {
    localStorage.setItem('me_auth_token_v1', response.token);
    localStorage.setItem('me_auth_email_v1', response.user.email);
    for (const key of [
      'me_accounts_v1',
      'me_categories_v1',
      'me_transactions_v1',
      'me_dreams_v1',
    ]) {
      localStorage.removeItem(key);
    }
    setAccounts(response.data.accounts);
    setCategories(response.data.categories);
    setTransactions(response.data.transactions);
    setDreams(response.data.dreams);
    setSelectedAccountIds(response.data.accounts.map((account) => account.id));
    setUserEmail(response.user.email);
    setSessionToken(response.token);
    setDataLoaded(true);
    setAuthError('');
    setSyncError('');
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      if (sessionToken && !sessionToken.startsWith('local_') && !sessionToken.startsWith('fb_')) {
        await logout(sessionToken);
      }
    } catch (error) {
      console.warn('Logout notice:', error);
    }

    localStorage.removeItem('me_auth_token_v1');
    localStorage.removeItem('me_auth_email_v1');
    localStorage.removeItem('me_accounts_v1');
    localStorage.removeItem('me_categories_v1');
    localStorage.removeItem('me_transactions_v1');
    localStorage.removeItem('me_dreams_v1');
    localStorage.removeItem('me_credit_cards_v1');

    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions([]);
    setDreams([]);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setSelectedAccountIds(INITIAL_ACCOUNTS.map((a) => a.id));

    setSessionToken(null);
    setUserEmail('');
    setDataLoaded(true);
    setAuthLoading(false);
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  const handleSwitchGoogleAccount = async () => {
    try {
      await logoutFirebase();
      if (sessionToken && !sessionToken.startsWith('local_') && !sessionToken.startsWith('fb_')) {
        await logout(sessionToken);
      }
    } catch (error) {
      console.warn('Logout notice:', error);
    }

    localStorage.removeItem('me_auth_token_v1');
    localStorage.removeItem('me_auth_email_v1');
    setSessionToken(null);
    setUserEmail('');

    try {
      setAuthLoading(true);
      const user = await loginWithGoogle();
      let data = await loadUserFinanceData(user.uid);
      if (!data) {
        data = {
          accounts: INITIAL_ACCOUNTS,
          categories: INITIAL_CATEGORIES,
          transactions: [],
          dreams: [],
          creditCards: INITIAL_CREDIT_CARDS,
        };
        await saveUserFinanceData(user.uid, user.email ?? '', data);
      }
      handleAuthenticated({
        token: `fb_${user.uid}`,
        user: { email: user.email ?? '' },
        data,
      });
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err instanceof Error ? err.message : 'Falha ao conectar com conta Google.');
      }
      setIsAuthModalOpen(true);
    } finally {
      setAuthLoading(false);
    }
  };

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    orientation: 'portrait' as 'portrait' | 'landscape',
  });

  // Account Modal (Create & Edit)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  // Category Modal (Create & Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Transaction Edit Modal
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  // Installment Purchase Modal (Divisão de Compras Parceladas Automática)
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

  // Chat Transaction Modal (Lançamento por Chat com IA)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // PWA Install State & Hook for Android and mobile devices
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Switch tab, ensuring Transações opens in the current month
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'transacoes') {
      const now = new Date();
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleSelectMonthYear = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Compute calculated balances for each account
  const accountsWithBalances: Account[] = accounts.map((acc) => {
    const accTxs = transactions.filter(
      (t) => t.account === acc.name && t.isConsolidated
    );
    const sum = accTxs.reduce((total, t) => total + t.amount, 0);
    return {
      ...acc,
      balance: acc.initialBalance + sum,
    };
  });

  // Total current balance across selected accounts
  const totalCurrentBalance = accountsWithBalances
    .filter((a) => selectedAccountIds.includes(a.id))
    .reduce((total, a) => total + a.balance, 0);

  // Left sidebar account selection
  const handleToggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleClearAccounts = () => setSelectedAccountIds([]);
  const handleSelectAllAccounts = () =>
    setSelectedAccountIds(accounts.map((a) => a.id));

  // Category filter selection
  const handleToggleCategory = (catName: string) => {
    setSelectedCategoryNames((prev) =>
      prev.includes(catName)
        ? prev.filter((x) => x !== catName)
        : [...prev, catName]
    );
  };

  // ==========================================
  // CRUD LANÇAMENTOS (TRANSACTIONS)
  // ==========================================
  const handleAddTransaction = (
    txData: Omit<Transaction, 'id'>,
    installmentsCount = 1,
    options?: { isTotalAmount?: boolean }
  ) => {
    let newTxs: Transaction[] = [];

    if (installmentsCount > 1) {
      const generated = generateInstallmentTransactions({
        date: txData.date,
        description: txData.description,
        category: txData.category,
        account: txData.account,
        amount: txData.amount,
        type: txData.type,
        installmentsCount,
        isTotalAmount: options?.isTotalAmount ?? true,
        isConsolidated: txData.isConsolidated,
        consolidateFirstOnly: true,
        note: txData.note,
        reminder: txData.reminder,
        toAccount: txData.toAccount,
      });

      newTxs = generated.map((t, idx) => ({
        ...t,
        id: `tx-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      }));
    } else {
      newTxs.push({
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      });
    }

    setTransactions((prev) => [...newTxs, ...prev]);

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveMultipleTransactionsInstant(uid, newTxs)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleAddMultipleTransactions = (
    txsData: Omit<Transaction, 'id'>[]
  ) => {
    const newTxs: Transaction[] = txsData.map((t, idx) => ({
      ...t,
      id: `tx-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    setTransactions((prev) => [...newTxs, ...prev]);

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveMultipleTransactionsInstant(uid, newTxs)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteInstallmentSeries = (
    groupId: string,
    mode: 'all' | 'future' = 'all',
    fromNumber?: number
  ) => {
    const toDelete = transactions.filter((t) => {
      if (t.installmentGroupId !== groupId) return false;
      if (mode === 'all') return true;
      if (mode === 'future' && fromNumber !== undefined) {
        return (t.installmentNumber || 0) >= fromNumber;
      }
      return true;
    });
    handleDeleteTransactions(toDelete.map((t) => t.id));
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsEditTxModalOpen(true);
  };

  const handleSaveEditedTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    setIsEditTxModalOpen(false);
    setTxToEdit(null);

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveTransactionInstant(uid, updatedTx)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      deleteTransactionInstant(uid, id)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteTransactions = (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      Promise.all(ids.map((id) => deleteTransactionInstant(uid, id)))
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleToggleConsolidate = (id: string) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, isConsolidated: !t.isConsolidated } : t
    );
    setTransactions(updated);
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      const found = updated.find((t) => t.id === id);
      if (found) {
        setIsSyncing(true);
        saveTransactionInstant(uid, found)
          .catch((err) => setSyncError(err.message))
          .finally(() => setIsSyncing(false));
      }
    }
  };

  const handleBatchConsolidate = (ids: string[], status: boolean) => {
    const updated = transactions.map((t) =>
      ids.includes(t.id) ? { ...t, isConsolidated: status } : t
    );
    setTransactions(updated);
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      const toSync = updated.filter((t) => ids.includes(t.id));
      Promise.all(toSync.map((t) => saveTransactionInstant(uid, t)))
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleBatchChangeCategory = (ids: string[], newCat: string) => {
    const updated = transactions.map((t) =>
      ids.includes(t.id) ? { ...t, category: newCat } : t
    );
    setTransactions(updated);
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      const toSync = updated.filter((t) => ids.includes(t.id));
      Promise.all(toSync.map((t) => saveTransactionInstant(uid, t)))
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  // ==========================================
  // CRUD CONTAS (ACCOUNTS)
  // ==========================================
  const handleOpenNewAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    if (acc.type === 'cartao') {
      const matchingCard = creditCards.find(
        (c) => c.name.toLowerCase() === acc.name.toLowerCase() || c.id === acc.id
      );
      if (matchingCard) {
        handleEditCard(matchingCard);
        return;
      }
    }
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (accountData: {
    id?: string;
    name: string;
    type: Account['type'];
    initialBalance: number;
  }) => {
    let savedAcc: Account;
    if (accountData.id) {
      // Edit existing account
      const oldAccount = accounts.find((a) => a.id === accountData.id);
      savedAcc = {
        id: accountData.id,
        name: accountData.name,
        type: accountData.type,
        initialBalance: accountData.initialBalance,
        balance: accountData.initialBalance,
        isChecked: true,
      };
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountData.id ? { ...a, ...savedAcc } : a))
      );

      // If name changed, rename in associated transactions
      if (oldAccount && oldAccount.name !== accountData.name) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.account === oldAccount.name
              ? { ...t, account: accountData.name }
              : t
          )
        );
      }
    } else {
      // Create new account
      savedAcc = {
        id: `acc-${Date.now()}`,
        name: accountData.name,
        type: accountData.type,
        initialBalance: accountData.initialBalance,
        balance: accountData.initialBalance,
        isChecked: true,
      };
      setAccounts((prev) => [...prev, savedAcc]);
      setSelectedAccountIds((prev) => [...prev, savedAcc.id]);
    }

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveAccountInstant(uid, savedAcc)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteAccount = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setSelectedAccountIds((prev) => prev.filter((accId) => accId !== id));

    // Remove or detach from transactions
    if (acc) {
      setTransactions((prev) =>
        prev.map((t) => (t.account === acc.name ? { ...t, account: 'Sem Conta' } : t))
      );
    }

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      deleteAccountInstant(uid, id)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  // ==========================================
  // CRUD CARTÕES DE CRÉDITO (CREDIT CARDS)
  // ==========================================
  const handleOpenNewCardModal = () => {
    setCardToEdit(null);
    setIsCreditCardModalOpen(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setCardToEdit(card);
    setIsCreditCardModalOpen(true);
  };

  const handleSaveCard = (cardData: Omit<CreditCard, 'id'> & { id?: string }) => {
    let savedCard: CreditCard;
    const cleanClosing = Math.min(31, Math.max(1, Math.round(Number(cardData.closingDay)) || 5));
    const cleanDue = Math.min(31, Math.max(1, Math.round(Number(cardData.dueDay)) || 12));
    const cleanLimit = Math.max(0, Number(cardData.limit) || 0);

    if (cardData.id) {
      const oldCard = creditCards.find((c) => c.id === cardData.id);
      savedCard = {
        ...cardData,
        id: cardData.id,
        closingDay: cleanClosing,
        dueDay: cleanDue,
        limit: cleanLimit,
      } as CreditCard;
      setCreditCards((prev) => {
        const updated = prev.map((c) => (c.id === cardData.id ? savedCard : c));
        localStorage.setItem('me_credit_cards_v1', JSON.stringify(updated));
        return updated;
      });

      // If card name changed, rename in associated transactions
      if (oldCard && oldCard.name !== cardData.name) {
        setTransactions((prev) =>
          prev.map((t) => (t.account === oldCard.name ? { ...t, account: cardData.name } : t))
        );
      }
    } else {
      savedCard = {
        ...cardData,
        id: `card-${Date.now()}`,
        closingDay: cleanClosing,
        dueDay: cleanDue,
        limit: cleanLimit,
      } as CreditCard;
      setCreditCards((prev) => {
        const updated = [...prev, savedCard];
        localStorage.setItem('me_credit_cards_v1', JSON.stringify(updated));
        return updated;
      });
    }

    // Ensure corresponding account exists in accounts with type 'cartao'
    setAccounts((prevAccs) => {
      const existing = prevAccs.find(
        (a) => a.name.toLowerCase() === savedCard.name.toLowerCase() || a.id === savedCard.id
      );
      if (existing) {
        const updatedAcc: Account = {
          ...existing,
          name: savedCard.name,
          type: 'cartao',
          color: savedCard.color,
        };
        if (sessionToken?.startsWith('fb_')) {
          saveAccountInstant(sessionToken.slice(3), updatedAcc).catch(console.error);
        }
        return prevAccs.map((a) => (a.id === existing.id ? updatedAcc : a));
      } else {
        const newAcc: Account = {
          id: savedCard.id,
          name: savedCard.name,
          balance: 0,
          initialBalance: 0,
          type: 'cartao',
          isChecked: true,
          color: savedCard.color,
        };
        if (sessionToken?.startsWith('fb_')) {
          saveAccountInstant(sessionToken.slice(3), newAcc).catch(console.error);
        }
        return [...prevAccs, newAcc];
      }
    });

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveCreditCardInstant(uid, savedCard)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = creditCards.find((c) => c.id === cardId);
    setCreditCards((prev) => {
      const updated = prev.filter((c) => c.id !== cardId);
      localStorage.setItem('me_credit_cards_v1', JSON.stringify(updated));
      return updated;
    });

    if (cardToDelete) {
      setAccounts((prev) =>
        prev.filter((a) => a.id !== cardId && a.name.toLowerCase() !== cardToDelete.name.toLowerCase())
      );
    }

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      deleteCreditCardInstant(uid, cardId)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
      if (cardToDelete) {
        deleteAccountInstant(uid, cardToDelete.id).catch(() => undefined);
      }
    }
  };

  // ==========================================
  // CRUD CATEGORIAS (CATEGORIES)
  // ==========================================
  const handleOpenNewCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (catData: {
    id?: string;
    name: string;
    type: 'despesa' | 'receita';
    parentCategoryName?: string;
  }) => {
    let savedCategory: Category;
    if (catData.id) {
      // Edit existing category
      const oldCat = categories.find((c) => c.id === catData.id);
      savedCategory = {
        id: catData.id,
        name: catData.name,
        type: catData.type,
        subcategories: oldCat?.subcategories,
      };
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catData.id
            ? { ...c, name: catData.name, type: catData.type }
            : c
        )
      );

      // If name changed, rename in transactions
      if (oldCat && oldCat.name !== catData.name) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.category === oldCat.name ? { ...t, category: catData.name } : t
          )
        );
      }
    } else if (catData.parentCategoryName) {
      // Add as subcategory to existing parent
      const parent = categories.find((c) => c.name === catData.parentCategoryName);
      const subs = parent?.subcategories || [];
      savedCategory = {
        id: parent?.id || `cat-${Date.now()}`,
        name: parent?.name || catData.parentCategoryName,
        type: parent?.type || catData.type,
        subcategories: subs.includes(catData.name) ? subs : [...subs, catData.name],
      };
      setCategories((prev) =>
        prev.map((c) => (c.name === catData.parentCategoryName ? savedCategory : c))
      );
    } else {
      // Create top-level category
      savedCategory = {
        id: `cat-${Date.now()}`,
        name: catData.name,
        type: catData.type,
      };
      setCategories((prev) => [...prev, savedCategory]);
    }

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveCategoryInstant(uid, savedCategory)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (cat) {
      setSelectedCategoryNames((prev) => prev.filter((cn) => cn !== cat.name));
      // Point affected transactions to 'Sem Categoria'
      setTransactions((prev) =>
        prev.map((t) =>
          t.category === cat.name ? { ...t, category: 'Sem Categoria' } : t
        )
      );
    }

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      deleteCategoryInstant(uid, id)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  // ==========================================
  // CRUD SONHOS (DREAMS)
  // ==========================================
  const handleAddDream = (newDream: Omit<Dream, 'id'>) => {
    const dream: Dream = { ...newDream, id: `dr-${Date.now()}` };
    setDreams((prev) => [...prev, dream]);
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      setIsSyncing(true);
      saveDreamInstant(uid, dream)
        .catch((err) => setSyncError(err.message))
        .finally(() => setIsSyncing(false));
    }
  };

  const handleUpdateDream = (id: string, amount: number) => {
    const updated = dreams.map((d) => (d.id === id ? { ...d, currentAmount: amount } : d));
    setDreams(updated);
    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      const found = updated.find((d) => d.id === id);
      if (found) {
        setIsSyncing(true);
        saveDreamInstant(uid, found)
          .catch((err) => setSyncError(err.message))
          .finally(() => setIsSyncing(false));
      }
    }
  };

  // ==========================================
  // ZERAR DADOS DO SISTEMA (RESET TO ZERO)
  // ==========================================
  const handleResetAllDataToZero = async () => {
    setIsResetModalOpen(false);
    setIsSyncing(true);

    const zeroedAccounts = accounts.map((a) => ({
      ...a,
      balance: 0,
      initialBalance: 0,
    }));
    setTransactions([]);
    setDreams([]);
    setAccounts(zeroedAccounts);
    setCreditCards(INITIAL_CREDIT_CARDS);

    localStorage.removeItem('me_transactions_v1');
    localStorage.removeItem('me_dreams_v1');
    localStorage.setItem('me_accounts_v1', JSON.stringify(zeroedAccounts));
    localStorage.setItem('me_credit_cards_v1', JSON.stringify(INITIAL_CREDIT_CARDS));

    if (sessionToken?.startsWith('fb_')) {
      const uid = sessionToken.slice(3);
      try {
        await resetUserDataToZero(uid);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Erro ao zerar dados no Firestore');
      }
    } else if (sessionToken) {
      try {
        await saveFinanceData(sessionToken, {
          accounts: zeroedAccounts,
          categories,
          transactions: [],
          dreams: [],
        });
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Erro ao zerar dados no servidor');
      }
    }

    setIsSyncing(false);
    setResetFeedback('Todos os lançamentos, sonhos e saldos foram zerados com sucesso!');
    setTimeout(() => setResetFeedback(''), 4500);
  };

  // Export Modal Confirm
  const handleConfirmExport = (config: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'xls';
    orientation: 'portrait' | 'landscape';
  }) => {
    setIsExportModalOpen(false);
    if (config.format === 'pdf') {
      setPdfConfig({
        startDate: config.startDate,
        endDate: config.endDate,
        orientation: config.orientation,
      });
      setIsPdfPreviewOpen(true);
    } else {
      // Direct XLS/CSV download
      const filtered = transactions.filter(
        (t) => t.date >= config.startDate && t.date <= config.endDate
      );
      const csv =
        '\uFEFFData;Descricao;Categoria;Conta;Valor (R$)\n' +
        filtered
          .map(
            (t) =>
              `${t.date};"${t.description}";"${t.category}";"${t.account}";"${t.amount
                .toFixed(2)
                .replace('.', ',')}"`
          )
          .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Extrato_${config.startDate}_${config.endDate}.xls`;
      a.click();
    }
  };

  const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthKey));
  const currentMonthlyIncome = currentMonthTxs.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const currentMonthlyExpense = currentMonthTxs.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);

  if (authChecking && !sessionToken) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#82af07] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-gray-700">Carregando Minhas Economias...</span>
      </div>
    );
  }

  if (isAuthModalOpen || (!sessionToken && !authLoading)) {
    const localData: FinanceData = { accounts, categories, transactions, dreams };
    return (
      <div className="relative">
        <AuthScreen
          initialData={localData}
          initialError={authError}
          onClose={sessionToken ? () => setIsAuthModalOpen(false) : undefined}
          onAuthenticated={(resp) => {
            setIsAuthModalOpen(false);
            handleAuthenticated(resp);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#000000] flex flex-col font-sans text-[14.5px] antialiased">
      {/* 1. TOP HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userEmail={userEmail}
        onLogout={handleLogout}
        onSwitchGoogleAccount={handleSwitchGoogleAccount}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onResetDataToZero={() => setIsResetModalOpen(true)}
        isInstalled={isInstalled}
        isSyncing={isSyncing}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={togglePrivacyMode}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCreditCardModal={handleOpenNewCardModal}
      />

      {resetFeedback && (
        <div role="status" className="bg-emerald-50 border-b border-emerald-300 px-4 py-2 text-center text-[13.5px] font-bold text-emerald-900 shadow-2xs">
          ✓ {resetFeedback}
        </div>
      )}

      {syncError && (
        <div role="alert" className="bg-red-50 border-b border-red-300 px-4 py-2 text-sm text-red-800">
          Erro de sincronização: {syncError}
        </div>
      )}

      {/* 2. MAIN CONTAINER (Responsive for Mobile, Android, Tablets and Desktop) */}
      <main className="flex-1 max-w-[1340px] w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-start pb-24 lg:pb-6">
        {/* Mobile Filter / Accounts Bar Toggle (Visible on < lg screens) */}
        <div className="lg:hidden w-full bg-white border border-[#b8b8b8] rounded-xl p-2.5 shadow-xs mb-1">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="w-full flex items-center justify-between text-[13px] font-bold text-[#000000] cursor-pointer"
          >
            <div className="flex items-center gap-2 text-left truncate">
              <Wallet className="w-4 h-4 text-[#82af07] shrink-0" />
              <span className="truncate">Contas & Filtros ({selectedAccountIds.length > 0 ? `${selectedAccountIds.length} selecionada(s)` : 'Todas as contas'})</span>
            </div>
            <span className="text-[11.5px] bg-[#f1f6df] text-[#577708] border border-[#c8e278] px-2.5 py-0.5 rounded-full shrink-0 ml-2 font-black">
              {isMobileSidebarOpen ? 'Fechar ▲' : 'Ver Contas ▼'}
            </span>
          </button>
        </div>

        {/* Left Sidebar (Contas / Busca Rápida / Categorias) */}
        <div className={`${isMobileSidebarOpen ? 'block' : 'hidden lg:block'} w-full lg:w-[268px] shrink-0`}>
          <LeftSidebar
            activeTab={activeTab}
            accounts={accountsWithBalances}
            categories={categories}
            selectedAccountIds={selectedAccountIds}
            onToggleAccount={handleToggleAccount}
            onSelectIndividualAccount={(id) => setSelectedAccountIds([id])}
            onClearAccounts={handleClearAccounts}
            onSelectAllAccounts={handleSelectAllAccounts}
            onOpenNewAccountModal={handleOpenNewAccount}
            onOpenNewCreditCardModal={handleOpenNewCardModal}
            onEditAccount={handleOpenEditAccount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategoryNames}
            onToggleCategory={handleToggleCategory}
            onOpenNewCategoryModal={handleOpenNewCategory}
            onEditCategory={handleOpenEditCategory}
            totalCurrentBalance={totalCurrentBalance}
          />
        </div>

        {/* Dynamic Center / Right Content based on active tab */}
        <div className="flex-1 min-w-0 bg-white border border-[#cccccc] p-2.5 sm:p-3 shadow-xs w-full">
          {activeTab === 'inicio' && (
            <DashboardView
              transactions={transactions}
              accounts={accountsWithBalances}
              categories={categories}
              creditCards={creditCards}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectMonthYear={handleSelectMonthYear}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleOpenEditTransaction}
              onNavigateToTransactions={() => handleTabChange('transacoes')}
              onNavigateToAnalise={(type) => handleTabChange(`analise-${type}`)}
              onOpenInstallmentModal={() => setIsInstallmentModalOpen(true)}
              onOpenChatModal={() => setIsChatModalOpen(true)}
              onOpenNewCardModal={handleOpenNewCardModal}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
            />
          )}

          {activeTab === 'transacoes' && (
            <TransactionsView
              transactions={transactions}
              accounts={accountsWithBalances}
              categories={categories}
              selectedAccountIds={selectedAccountIds}
              selectedCategoryNames={selectedCategoryNames}
              searchQuery={searchQuery}
              onSetSearchQuery={setSearchQuery}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectMonthYear={handleSelectMonthYear}
              onAddTransaction={handleAddTransaction}
              onDeleteTransactions={handleDeleteTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={handleOpenEditTransaction}
              onToggleConsolidate={handleToggleConsolidate}
              onBatchConsolidate={handleBatchConsolidate}
              onBatchChangeCategory={handleBatchChangeCategory}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onSelectAllAccounts={handleSelectAllAccounts}
              onOpenInstallmentModal={() => setIsInstallmentModalOpen(true)}
              onOpenChatModal={() => setIsChatModalOpen(true)}
            />
          )}

          {activeTab === 'sonhos' && (
            <SonhosView
              dreams={dreams}
              onAddDream={handleAddDream}
              onUpdateDream={handleUpdateDream}
            />
          )}

          {activeTab === 'orcamento' && (
            <OrcamentoView
              categories={categories}
              transactions={transactions}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}

          {activeTab.startsWith('analise') && (
            <AnaliseView
              transactions={transactions}
              categories={categories}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              subType={activeTab === 'analise-evolucao' ? 'evolucao' : activeTab === 'analise-fluxo' ? 'fluxo' : 'categorias'}
              onSelectSubType={(type) => handleTabChange(`analise-${type}`)}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectMonthYear={handleSelectMonthYear}
            />
          )}

          {activeTab.startsWith('config') && (
            <ConfiguracoesView
              accounts={accountsWithBalances}
              categories={categories}
              creditCards={creditCards}
              initialSubTab={
                activeTab === 'config-cartoes'
                  ? 'cartoes'
                  : activeTab === 'config-categorias'
                  ? 'categorias'
                  : 'contas'
              }
              onAddCategory={(cat) => setCategories((prev) => [...prev, cat])}
              onEditCategory={handleOpenEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onOpenNewAccountModal={handleOpenNewAccount}
              onEditAccount={handleOpenEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onOpenNewCreditCardModal={handleOpenNewCardModal}
              onEditCreditCard={handleEditCard}
              onDeleteCreditCard={handleDeleteCard}
              onResetDataToZero={() => setIsResetModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* 3. MODALS */}
      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditTxModalOpen}
        onClose={() => {
          setIsEditTxModalOpen(false);
          setTxToEdit(null);
        }}
        transaction={txToEdit}
        accounts={accountsWithBalances}
        categories={categories}
        onSave={handleSaveEditedTransaction}
        onDelete={handleDeleteTransaction}
        onDeleteInstallmentSeries={handleDeleteInstallmentSeries}
      />

      {/* Modal de Compra Parcelada Automática */}
      <InstallmentPurchaseModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        accounts={accountsWithBalances}
        categories={categories}
        currentDateStr={(() => {
          const now = new Date();
          const day = now.getFullYear() === selectedYear && now.getMonth() === selectedMonth
            ? String(now.getDate()).padStart(2, '0')
            : '01';
          return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${day}`;
        })()}
        onSaveInstallments={handleAddMultipleTransactions}
      />

      {/* Account Creation & Edit Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Credit Card Creation & Edit Modal */}
      <CreditCardModal
        isOpen={isCreditCardModalOpen}
        onClose={() => {
          setIsCreditCardModalOpen(false);
          setCardToEdit(null);
        }}
        cardToEdit={cardToEdit}
        accounts={accountsWithBalances}
        onSaveCard={handleSaveCard}
        onDeleteCard={handleDeleteCard}
      />

      {/* Category Creation & Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        allCategories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Export Options Modal (Image 5) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={handleConfirmExport}
        defaultStartDate="2026-11-01"
        defaultEndDate="2026-11-30"
      />

      {/* Authentic PDF Viewer / Print Preview Modal (Images 6 & 7) */}
      <PdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        transactions={transactions}
        startDate={pdfConfig.startDate}
        endDate={pdfConfig.endDate}
        orientation={pdfConfig.orientation}
      />

      {/* PWA Install Modal for Android & All Devices */}
      <InstallAndroidModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={install}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isAndroid={isAndroid}
        isIOS={isIOS}
      />

      {/* Mobile Bottom Navigation Bar (Android & Smartphone view) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenQuickAdd={() => handleOpenQuickAdd('despesa')}
        onOpenChatModal={() => setIsChatModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Mobile Quick Add Floating Bottom Sheet Modal */}
      <MobileQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        accounts={accountsWithBalances}
        categories={categories}
        initialType={quickAddType}
        onAddTransaction={handleAddTransaction}
        onOpenChatModal={() => {
          setIsQuickAddOpen(false);
          setIsChatModalOpen(true);
        }}
      />

      {/* Chat Transaction Modal (Lançamento por Chat com IA) */}
      <ChatTransactionModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        accounts={accountsWithBalances}
        categories={categories}
        currentDateStr={(() => {
          const now = new Date();
          const day = now.getFullYear() === selectedYear && now.getMonth() === selectedMonth
            ? String(now.getDate()).padStart(2, '0')
            : '01';
          return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${day}`;
        })()}
        onAddTransaction={handleAddTransaction}
      />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />

      {/* 4. FOOTER */}
      <footer className="border-t border-[#e0e0e0] bg-[#f9f9f9] py-2 px-4 text-center text-[10.5px] text-[#777] mt-auto select-none">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>Minhas Economias © 2026 - Todos os direitos reservados</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="text-red-700 hover:underline cursor-pointer font-bold"
            >
              🗑️ Zerar dados do sistema
            </button>
            <span>•</span>
            <button onClick={() => setIsPdfPreviewOpen(true)} className="hover:underline cursor-pointer">
              Visualizar Extrato PDF
            </button>
          </div>
        </div>
      </footer>

      {/* Modal para Zerar Dados */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-gray-400 p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-2.5 text-red-700">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-black text-black">Zerar Todos os Dados?</h3>
            </div>
            <p className="text-[13.5px] text-gray-800 leading-relaxed font-medium">
              Esta ação irá remover todos os lançamentos de receitas, despesas e objetivos cadastrados, e redefinirá os saldos de todas as contas para <strong>R$ 0,00</strong>.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold rounded">
              A sincronização instantânea atualizará o banco de dados e todos os dispositivos conectados imediatamente.
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-gray-400 bg-gray-100 hover:bg-gray-200 text-black font-bold text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetAllDataToZero}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-sm cursor-pointer"
              >
                Sim, Zerar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
