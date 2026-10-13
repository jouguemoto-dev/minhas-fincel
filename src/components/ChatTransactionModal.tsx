import React, { useState, useRef, useEffect } from 'react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateWithWeekday } from '../utils/formatters';
import { parseTransactionWithAI, ParsedTransactionItem } from '../utils/nlpParser';
import {
  MessageSquare,
  Send,
  Sparkles,
  Check,
  CheckCircle2,
  X,
  CreditCard,
  Calendar,
  Tag,
  Wallet,
  Mic,
  MicOff,
  Edit2,
  Save,
  ArrowRightLeft,
  FileText,
  CheckCheck
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  parsedTransactions?: ParsedTransactionItem[];
  isConfirmed?: boolean;
}

interface ChatTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  currentDateStr?: string;
  onAddTransaction: (
    tx: Omit<Transaction, 'id'>,
    count?: number,
    options?: { isTotalAmount?: boolean }
  ) => void;
}

export const ChatTransactionModal: React.FC<ChatTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  currentDateStr,
  onAddTransaction,
}) => {
  if (!isOpen) return null;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o seu Assistente Financeiro. Você pode digitar ou falar como no WhatsApp para lançar gastos, receitas e parcelas rapidamente!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isListening, setIsListening] = useState(false);

  // Editing state for parsed transaction cards: key is `${msgId}-${txIdx}`
  const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ParsedTransactionItem | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const quickExamples = [
    'Almoço 42 na carteira',
    'Uber 26,50 ontem',
    'Celular 1500 em 10x no cartão',
    'Recebi 350 de freela',
    'Supermercado 180 no débito',
  ];

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: rawText.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const accountNames = accounts.map((a) => a.name);
      const categoryNames = categories.map((c) => c.name);

      const result = await parseTransactionWithAI(
        rawText,
        accountNames,
        categoryNames,
        currentDateStr
      );

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: result.replyMessage || 'Entendido! Confira as informações abaixo e confirme para salvar:',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        parsedTransactions: result.transactions,
        isConfirmed: false,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: 'Não consegui identificar todos os detalhes. Poderia reformular? Exemplo: "Almoço 35 no cartão"',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (msgId: string, idx: number, tx: ParsedTransactionItem) => {
    setEditingCardKey(`${msgId}-${idx}`);
    setEditForm({ ...tx });
  };

  const handleCancelEdit = () => {
    setEditingCardKey(null);
    setEditForm(null);
  };

  const handleSaveEdit = (msgId: string, idx: number) => {
    if (!editForm) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.parsedTransactions) return m;
        const newTxs = [...m.parsedTransactions];
        newTxs[idx] = { ...editForm };
        return { ...m, parsedTransactions: newTxs };
      })
    );
    setEditingCardKey(null);
    setEditForm(null);
  };

  const handleConfirmTransaction = (msgId: string, txItem: ParsedTransactionItem) => {
    const finalAmount = txItem.type === 'despesa' ? -Math.abs(txItem.amount) : Math.abs(txItem.amount);
    const count = txItem.installments && txItem.installments > 1 ? txItem.installments : 1;

    onAddTransaction(
      {
        date: txItem.date,
        description: txItem.description,
        category: txItem.category,
        account: txItem.account,
        toAccount: txItem.toAccount,
        amount: finalAmount,
        type: txItem.type,
        isConsolidated: count > 1 ? false : true,
        note: txItem.note,
      },
      count,
      { isTotalAmount: txItem.isTotalAmount ?? true }
    );

    // Update message status
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isConfirmed: true } : m))
    );

    // Bot confirmation acknowledgment
    const ackMsg: ChatMessage = {
      id: `ack-${Date.now()}`,
      sender: 'bot',
      text: `✅ Salvo com sucesso! Registrei "${txItem.description}" de ${formatCurrency(txItem.amount)} em suas movimentações.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, ackMsg]);
  };

  const handleConfirmAllTransactions = (msgId: string, transactions: ParsedTransactionItem[]) => {
    transactions.forEach((txItem) => {
      const finalAmount = txItem.type === 'despesa' ? -Math.abs(txItem.amount) : Math.abs(txItem.amount);
      const count = txItem.installments && txItem.installments > 1 ? txItem.installments : 1;

      onAddTransaction(
        {
          date: txItem.date,
          description: txItem.description,
          category: txItem.category,
          account: txItem.account,
          toAccount: txItem.toAccount,
          amount: finalAmount,
          type: txItem.type,
          isConsolidated: count > 1 ? false : true,
          note: txItem.note,
        },
        count,
        { isTotalAmount: txItem.isTotalAmount ?? true }
      );
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isConfirmed: true } : m))
    );

    const ackMsg: ChatMessage = {
      id: `ack-${Date.now()}`,
      sender: 'bot',
      text: `✅ Todos os ${transactions.length} lançamentos foram salvos com sucesso!`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, ackMsg]);
  };

  // Web Speech API Voice Recognition (browser native)
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Você pode digitar normalmente.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card */}
      <div className="relative bg-white border-2 border-[#555555] shadow-2xl w-full max-w-3xl rounded-2xl text-[#000000] font-sans flex flex-col h-[94dvh] sm:h-[min(690px,calc(100dvh-2.5rem))] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden animate-scaleIn my-auto">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#2c4004] via-[#5a8710] to-[#82af07] text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-xs relative shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#5a8710] rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-[16px] text-white leading-tight">
                  Lançamento por Chat
                </h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  IA Gemini
                </span>
              </div>
              <p className="text-[11.5px] sm:text-[12px] text-white/90 font-medium">
                Digite ou fale em português para lançar despesas, receitas, parcelas e transferências
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white font-black cursor-pointer transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Chat Thread Messages - Must have min-h-0 and overflow-y-auto so it never cuts off or overflows outside */}
        <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto space-y-4 bg-gray-50/70">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Bubble text */}
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-[14px] shadow-sm leading-relaxed break-words whitespace-pre-wrap ${
                    isUser
                      ? 'bg-gradient-to-br from-[#5a8710] to-[#486b0d] text-white rounded-tr-none font-semibold'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none font-medium'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Parsed Transaction Interactive Confirmation Card */}
                {msg.parsedTransactions && msg.parsedTransactions.length > 0 && (
                  <div className="w-full max-w-full sm:max-w-2xl space-y-3 mt-1.5">
                    {/* Header with Confirm All if multiple items */}
                    {msg.parsedTransactions.length > 1 && !msg.isConfirmed && (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs">
                        <span className="font-bold text-emerald-900">
                          {msg.parsedTransactions.length} lançamentos identificados:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConfirmAllTransactions(msg.id, msg.parsedTransactions!)}
                          className="px-3 py-1.5 bg-[#5a8710] hover:bg-[#486b0d] text-white font-black rounded-lg cursor-pointer shadow-sm text-xs flex items-center gap-1 transition-all"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Confirmar Todos
                        </button>
                      </div>
                    )}

                    {msg.parsedTransactions.map((tx, idx) => {
                      const cardKey = `${msg.id}-${idx}`;
                      const isEditing = editingCardKey === cardKey;
                      const isExpense = tx.type === 'despesa';
                      const isTransfer = tx.type === 'transferencia';
                      const isInstallment = tx.installments && tx.installments > 1;

                      if (isEditing && editForm) {
                        return (
                          <div
                            key={cardKey}
                            className="p-4 rounded-xl border-2 border-[#5a8710] bg-white shadow-lg space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                              <span className="text-xs font-black text-[#5a8710] uppercase flex items-center gap-1">
                                <Edit2 className="w-3.5 h-3.5" />
                                Editando Lançamento
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              {/* Descrição */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Descrição
                                </label>
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, description: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none"
                                />
                              </div>

                              {/* Tipo */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Tipo
                                </label>
                                <select
                                  value={editForm.type}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      type: e.target.value as TransactionType,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none bg-white"
                                >
                                  <option value="despesa">Despesa</option>
                                  <option value="receita">Receita</option>
                                  <option value="transferencia">Transferência</option>
                                </select>
                              </div>

                              {/* Valor */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Valor (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.amount}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      amount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none"
                                />
                              </div>

                              {/* Categoria */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Categoria
                                </label>
                                <select
                                  value={editForm.category}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, category: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none bg-white"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Conta Origem */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  {editForm.type === 'transferencia' ? 'Conta de Origem' : 'Conta'}
                                </label>
                                <select
                                  value={editForm.account}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, account: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none bg-white"
                                >
                                  {accounts.map((a) => (
                                    <option key={a.id} value={a.name}>
                                      {a.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Conta Destino (se transferência) */}
                              {editForm.type === 'transferencia' && (
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                    Conta de Destino
                                  </label>
                                  <select
                                    value={editForm.toAccount || ''}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, toAccount: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none bg-white"
                                  >
                                    <option value="">Selecione a conta destino...</option>
                                    {accounts
                                      .filter((a) => a.name !== editForm.account)
                                      .map((a) => (
                                        <option key={a.id} value={a.name}>
                                          {a.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              )}

                              {/* Data */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Data
                                </label>
                                <input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, date: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none"
                                />
                              </div>

                              {/* Parcelas */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Parcelas
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={editForm.installments || 1}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      installments: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none"
                                />
                              </div>

                              {/* Observação */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Observação (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={editForm.note || ''}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, note: e.target.value })
                                  }
                                  placeholder="Detalhes ou anotações..."
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-900 focus:border-[#5a8710] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold rounded-lg cursor-pointer text-xs"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id, idx)}
                                className="px-4 py-1.5 bg-[#5a8710] hover:bg-[#486b0d] text-white font-black rounded-lg cursor-pointer text-xs flex items-center gap-1 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Salvar Alterações
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={cardKey}
                          className={`p-4 rounded-xl border transition-all ${
                            msg.isConfirmed
                              ? 'bg-emerald-50/80 border-emerald-300 opacity-95'
                              : 'bg-white border-gray-300 shadow-md hover:border-[#82af07]'
                          }`}
                        >
                          {/* Card Header: Type Badge, Title, and Big Amount */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    isExpense
                                      ? 'bg-red-100 text-red-700'
                                      : isTransfer
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {tx.type}
                                </span>
                                {isInstallment && (
                                  <span className="text-[11px] font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    {tx.installments}x de aprox.{' '}
                                    {formatCurrency(tx.amount / (tx.installments || 1))}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-black text-[15.5px] sm:text-[16px] text-gray-950 mt-1.5 leading-snug break-words">
                                {tx.description}
                              </h4>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-[17px] sm:text-[19px] font-black tabular-nums block ${
                                  isExpense
                                    ? 'text-red-600'
                                    : isTransfer
                                    ? 'text-blue-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {isExpense ? '-' : isTransfer ? '↔' : '+'} {formatCurrency(tx.amount)}
                              </span>
                              {isInstallment && (
                                <span className="text-[11px] font-bold text-gray-500 block">
                                  Total da compra
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Full Information Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-[12px] text-gray-700">
                            {/* Data */}
                            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-bold leading-tight uppercase">Data</span>
                                <span className="font-bold text-gray-800 break-words">{formatDateWithWeekday(tx.date)}</span>
                              </div>
                            </div>

                            {/* Categoria */}
                            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <Tag className="w-4 h-4 text-gray-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-bold leading-tight uppercase">Categoria</span>
                                <span className="font-bold text-gray-800 break-words">{tx.category}</span>
                              </div>
                            </div>

                            {/* Conta */}
                            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <Wallet className="w-4 h-4 text-gray-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-bold leading-tight uppercase">
                                  {isTransfer ? 'Origem' : 'Conta'}
                                </span>
                                <span className="font-bold text-gray-800 break-words">{tx.account}</span>
                              </div>
                            </div>

                            {/* Conta Destino (se transferência) */}
                            {isTransfer && tx.toAccount && (
                              <div className="flex items-center gap-1.5 bg-blue-50/60 p-2 rounded-lg border border-blue-100 sm:col-span-3">
                                <ArrowRightLeft className="w-4 h-4 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[10px] text-blue-500 block font-bold leading-tight uppercase">Destino</span>
                                  <span className="font-bold text-blue-900 break-words">{tx.toAccount}</span>
                                </div>
                              </div>
                            )}

                            {/* Observação (se houver) */}
                            {tx.note && (
                              <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[10px] text-amber-700 block font-bold leading-tight uppercase">Observação</span>
                                  <span className="font-medium text-amber-950 break-words">{tx.note}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                            {!msg.isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg.id, idx, tx)}
                                className="px-3 py-1.5 text-gray-700 hover:text-gray-950 hover:bg-gray-100 font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 border border-gray-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Editar detalhes</span>
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-black text-xs flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Salvo nas Transações
                              </span>
                            )}

                            {!msg.isConfirmed && (
                              <button
                                type="button"
                                onClick={() => handleConfirmTransaction(msg.id, tx)}
                                className="px-4 py-2 bg-[#5a8710] hover:bg-[#486b0d] text-white font-black text-xs rounded-lg cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Confirmar e Salvar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] text-gray-400 font-medium px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white p-3 rounded-2xl w-fit border border-gray-200 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#82af07] animate-ping"></span>
              <span>Interpretando seu lançamento com IA...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestions chips */}
        <div className="px-3 sm:px-4 py-2 bg-white border-t border-gray-200 overflow-x-auto shrink-0 flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 shrink-0">Exemplos:</span>
          {quickExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(ex)}
              className="text-[11px] sm:text-[11.5px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors shrink-0"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={isListening ? 'Ouvindo... Clique para parar' : 'Gravar por voz'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite aqui (ex: Almoço 35 no cartão, Salário 5000)..."
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-2.5 border-2 border-gray-300 rounded-xl text-[14px] font-bold text-gray-900 focus:outline-none focus:border-[#82af07]"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#5a8710] hover:bg-[#486b0d] disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10.5px] text-gray-400 mt-1.5 hidden sm:block">
            Dica: você pode lançar gastos, recebimentos, parcelas ("10x no cartão") e transferências.
          </p>
        </div>

      </div>
    </div>
  );
};
