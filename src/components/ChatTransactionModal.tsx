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
  CornerDownLeft,
  ArrowRight
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
      text: 'Olá! Sou o seu Assistente Financeiro. Você pode digitar ou falar como conversa no WhatsApp para lançar gastos ou receitas rapidamente!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
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
        text: result.replyMessage || 'Entendido! Confira os dados abaixo e confirme para salvar:',
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

  const handleConfirmTransaction = (msgId: string, txItem: ParsedTransactionItem) => {
    const finalAmount = txItem.type === 'despesa' ? -Math.abs(txItem.amount) : Math.abs(txItem.amount);
    const count = txItem.installments && txItem.installments > 1 ? txItem.installments : 1;

    onAddTransaction(
      {
        date: txItem.date,
        description: txItem.description,
        category: txItem.category,
        account: txItem.account,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-2xl rounded-2xl text-[#000000] font-sans flex flex-col h-[90vh] sm:h-[680px] overflow-hidden animate-scaleIn">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#2c4004] via-[#5a8710] to-[#82af07] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-xs relative">
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#5a8710] rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[16px] text-white leading-tight">
                  Lançamento por Chat
                </h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  IA Gemini
                </span>
              </div>
              <p className="text-[12px] text-white/90 font-medium">
                Digite ou fale em linguagem natural para adicionar receitas, despesas e parcelas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white font-black cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Chat Thread Messages */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 bg-gray-50/70">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[14px] shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-br from-[#5a8710] to-[#486b0d] text-white rounded-tr-none font-semibold'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none font-medium'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Parsed Transaction Interactive Confirmation Card */}
                {msg.parsedTransactions && msg.parsedTransactions.length > 0 && (
                  <div className="w-full max-w-[92%] sm:max-w-[85%] space-y-2 mt-1">
                    {msg.parsedTransactions.map((tx, idx) => {
                      const isExpense = tx.type === 'despesa';
                      const isInstallment = tx.installments && tx.installments > 1;

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            msg.isConfirmed
                              ? 'bg-emerald-50 border-emerald-300 opacity-95'
                              : 'bg-white border-gray-300 shadow-md hover:border-[#82af07]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    isExpense
                                      ? 'bg-red-100 text-red-700'
                                      : tx.type === 'receita'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {tx.type}
                                </span>
                                {isInstallment && (
                                  <span className="text-[10.5px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    {tx.installments}x de aprox.{' '}
                                    {formatCurrency(tx.amount / (tx.installments || 1))}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-black text-[15px] text-gray-950 mt-1">
                                {tx.description}
                              </h4>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[17px] font-black tabular-nums block ${
                                  isExpense ? 'text-red-600' : 'text-emerald-700'
                                }`}
                              >
                                {isExpense ? '-' : '+'} {formatCurrency(tx.amount)}
                              </span>
                              {isInstallment && (
                                <span className="text-[11px] font-bold text-gray-500">
                                  Total da compra
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Metadata row */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-[11.5px] text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-bold">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              {formatDateWithWeekday(tx.date)}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-bold">
                              <Tag className="w-3 h-3 text-gray-500" />
                              {tx.category}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-bold">
                              <Wallet className="w-3 h-3 text-gray-500" />
                              {tx.account}
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                            {msg.isConfirmed ? (
                              <span className="text-emerald-700 font-black text-xs flex items-center gap-1 bg-emerald-100 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                Salvo nas Transações
                              </span>
                            ) : (
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
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white p-3 rounded-2xl w-fit border border-gray-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#82af07] animate-ping"></span>
              <span>Interpretando seu lançamento com IA...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestions chips */}
        <div className="px-4 py-2 bg-white border-t border-gray-200 overflow-x-auto shrink-0 flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 shrink-0">Exemplos:</span>
          {quickExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(ex)}
              className="text-[11.5px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors"
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
        </div>

      </div>
    </div>
  );
};
