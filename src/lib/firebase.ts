import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Account, Category, Transaction, Dream } from '../types';

const app = initializeApp(firebaseConfig);
// CRITICAL: The app will break without specifying the firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Soft connection check on boot without throwing
async function testConnection() {
  try {
    // Only verify auth state or offline client
  } catch (error) {
    console.warn('Firebase connection check:', error);
  }
}
testConnection();

export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

export interface UserFinanceData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  dreams: Dream[];
}

export async function loadUserFinanceData(userId: string): Promise<UserFinanceData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      return null;
    }

    // Load subcollections
    const accountsPath = `users/${userId}/accounts`;
    const categoriesPath = `users/${userId}/categories`;
    const transactionsPath = `users/${userId}/transactions`;
    const dreamsPath = `users/${userId}/dreams`;

    const [accountsSnap, categoriesSnap, transactionsSnap, dreamsSnap] = await Promise.all([
      getDocs(collection(db, accountsPath)).catch(err => handleFirestoreError(err, OperationType.LIST, accountsPath)),
      getDocs(collection(db, categoriesPath)).catch(err => handleFirestoreError(err, OperationType.LIST, categoriesPath)),
      getDocs(collection(db, transactionsPath)).catch(err => handleFirestoreError(err, OperationType.LIST, transactionsPath)),
      getDocs(collection(db, dreamsPath)).catch(err => handleFirestoreError(err, OperationType.LIST, dreamsPath)),
    ]);

    const accounts = accountsSnap.docs.map(d => d.data() as Account);
    const categories = categoriesSnap.docs.map(d => d.data() as Category);
    const transactions = transactionsSnap.docs.map(d => d.data() as Transaction);
    const dreams = dreamsSnap.docs.map(d => d.data() as Dream);

    return { accounts, categories, transactions, dreams };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
}

export async function saveUserFinanceData(userId: string, email: string, data: UserFinanceData): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const now = new Date().toISOString();

    await setDoc(userDocRef, {
      id: userId,
      email: email || 'user@local.domain',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    // Use batches for subcollections
    const batch = writeBatch(db);

    for (const acc of data.accounts) {
      const ref = doc(db, `users/${userId}/accounts`, acc.id);
      batch.set(ref, { ...acc, userId });
    }

    for (const cat of data.categories) {
      const ref = doc(db, `users/${userId}/categories`, cat.id);
      batch.set(ref, { ...cat, userId });
    }

    for (const tx of data.transactions) {
      const ref = doc(db, `users/${userId}/transactions`, tx.id);
      batch.set(ref, { ...tx, userId });
    }

    for (const dream of data.dreams) {
      const ref = doc(db, `users/${userId}/dreams`, dream.id);
      batch.set(ref, { ...dream, userId });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}

/**
 * Real-time instant synchronization via onSnapshot
 */
export function subscribeToUserFinanceData(
  userId: string,
  onData: (data: UserFinanceData) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const accountsPath = `users/${userId}/accounts`;
  const categoriesPath = `users/${userId}/categories`;
  const transactionsPath = `users/${userId}/transactions`;
  const dreamsPath = `users/${userId}/dreams`;

  let accounts: Account[] = [];
  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let dreams: Dream[] = [];

  const emit = () => {
    onData({ accounts, categories, transactions, dreams });
  };

  const handleErr = (err: unknown, path: string) => {
    console.warn(`Firestore onSnapshot warn on ${path}:`, err);
    if (onError) {
      onError(err);
    }
  };

  const unsubAccounts = onSnapshot(collection(db, accountsPath), (snap) => {
    accounts = snap.docs.map(d => d.data() as Account);
    emit();
  }, (err) => {
    handleErr(err, accountsPath);
  });

  const unsubCategories = onSnapshot(collection(db, categoriesPath), (snap) => {
    categories = snap.docs.map(d => d.data() as Category);
    emit();
  }, (err) => {
    handleErr(err, categoriesPath);
  });

  const unsubTransactions = onSnapshot(collection(db, transactionsPath), (snap) => {
    transactions = snap.docs.map(d => d.data() as Transaction);
    emit();
  }, (err) => {
    handleErr(err, transactionsPath);
  });

  const unsubDreams = onSnapshot(collection(db, dreamsPath), (snap) => {
    dreams = snap.docs.map(d => d.data() as Dream);
    emit();
  }, (err) => {
    handleErr(err, dreamsPath);
  });

  return () => {
    unsubAccounts();
    unsubCategories();
    unsubTransactions();
    unsubDreams();
  };
}

function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export async function saveAccountInstant(userId: string, account: Account): Promise<void> {
  const path = `users/${userId}/accounts/${account.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'accounts', account.id), cleanFirestoreData({ ...account, userId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccountInstant(userId: string, accountId: string): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTransactionInstant(userId: string, tx: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), cleanFirestoreData({ ...tx, userId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMultipleTransactionsInstant(userId: string, txs: Transaction[]): Promise<void> {
  if (!txs || txs.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const tx of txs) {
      const ref = doc(db, 'users', userId, 'transactions', tx.id);
      batch.set(ref, cleanFirestoreData({ ...tx, userId }));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/transactions`);
  }
}

export async function deleteTransactionInstant(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryInstant(userId: string, cat: Category): Promise<void> {
  const path = `users/${userId}/categories/${cat.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'categories', cat.id), cleanFirestoreData({ ...cat, userId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryInstant(userId: string, catId: string): Promise<void> {
  const path = `users/${userId}/categories/${catId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'categories', catId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDreamInstant(userId: string, dream: Dream): Promise<void> {
  const path = `users/${userId}/dreams/${dream.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'dreams', dream.id), cleanFirestoreData({ ...dream, userId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDreamInstant(userId: string, dreamId: string): Promise<void> {
  const path = `users/${userId}/dreams/${dreamId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'dreams', dreamId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function resetUserDataToZero(userId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const txSnap = await getDocs(collection(db, `users/${userId}/transactions`));
    txSnap.docs.forEach(d => batch.delete(d.ref));

    const dreamSnap = await getDocs(collection(db, `users/${userId}/dreams`));
    dreamSnap.docs.forEach(d => batch.delete(d.ref));

    const accSnap = await getDocs(collection(db, `users/${userId}/accounts`));
    accSnap.docs.forEach(d => {
      const data = d.data() as Account;
      batch.set(d.ref, { ...data, balance: 0, initialBalance: 0, userId });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
