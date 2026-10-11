import React, { useState, useMemo } from 'react';
import { Account, Category, Transaction } from '../types';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check, Calendar, Tag, Wallet, CreditCard, Sparkles } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';
import { calculateInstallmentValues } from '../utils/installments';

interface MobileQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialType?: 'despesa' | 'receita' | 'transferencia';
  onAddTransaction: (
    tx: Omit<Transaction, 'id'>,
    count?: number,
    options?: { isTotalAmount?: boolean }
  ) => void;
}

export const MobileQuickAddModal: React.FC<MobileQuickAddModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  initialType = 'despesa',
  onAddTransaction,
}) => {
  const [type, setType] = useState<'despesa' | 'receita' | 'transferencia'>(initialType);
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState(accounts[0]?.name || 'Carteira');
  const [destinationAccount, setDestinationAccount] = useState(accounts[1]?.name || accounts[0]?.name || 'Conta Corrente');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isConsolidated, setIsConsolidated] = useState(true);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Installment purchase states
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [isTotalAmount, setIsTotalAmount] = useState(true);

  // Parse numeric amount
  const numericAmount = useMemo(() => {
    return parseCurrencyInput(amountInput);
  }, [amountInput]);

  // Live calculation
  const installmentCalc = useMemo(() => {
    return calculateInstallmentValues(numericAmount, installmentsCount, isTotalAmount);
  }, [numericAmount, installmentsCount, isTotalAmount]);

  // Suggestions chips based on type
  const suggestions = type === 'despesa'
    ? ['Almoço', 'Supermercado', 'Combustível', 'Farmácia', 'Uber', 'Padaria', 'Lanche', 'Internet']
    : type === 'receita'
    ? ['Salário', 'Pix Recebido', 'Rendimento', 'Venda', 'Adiantamento', 'Freelance']
    : ['Transferência', 'Poupança', 'Investimento', 'Aporte'];

  // Categories matching current type
  const availableCategories = categories.filter(c => {
    if (type === 'despesa') return c.type === 'despesa';
    if (type === 'receita') return c.type === 'receita';
    return true;
  });

  // Sync initialType when modal opens or initialType changes
  React.useEffect(() => {
    if (isOpen && initialType) {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  // Set default category if none or invalid
  React.useEffect(() => {
    if (type === 'transferencia') {
      setCategory('Transferência');
    } else {
      const firstCat = availableCategories[0]?.name || (type === 'despesa' ? 'Alimentação' : 'Salário');
      setCategory(firstCat);
    }
    setFormError('');
  }, [type]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value, amountInput);
    setAmountInput(formatted);
    setFormError('');
  };

  const handleQuickAddValue = (extra: number) => {
    const currentNum = parseCurrencyInput(amountInput);
    const newNum = currentNum + extra;
    setAmountInput(newNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numericAmount = parseCurrencyInput(amountInput);

    if (numericAmount <= 0) {
      setFormError('Informe um valor maior que R$ 0,00');
      return;
    }

    const desc = description.trim() || (type === 'transferencia' ? `Transferência para ${destinationAccount}` : (type === 'despesa' ? 'Despesa' : 'Receita'));

    if (type === 'transferencia') {
      if (account === destinationAccount) {
        setFormError('Escolha contas de origem e destino diferentes');
        return;
      }

      // Saída da conta de origem
      onAddTransaction({
        date,
        description: `Transf. p/ ${destinationAccount}`,
        category: 'Transferência',
        account,
        amount: -numericAmount,
        type: 'transferencia',
        toAccount: destinationAccount,
        isConsolidated,
        note: note || `Transferência enviada para ${destinationAccount}`,
      });

      // Entrada na conta de destino
      onAddTransaction({
        date,
        description: `Transf. de ${account}`,
        category: 'Transferência',
        account: destinationAccount,
        amount: numericAmount,
        type: 'transferencia',
        toAccount: account,
        isConsolidated,
        note: note || `Transferência recebida de ${account}`,
      });
    } else {
      const finalAmount = type === 'despesa' ? -numericAmount : numericAmount;
      onAddTransaction(
        {
          date,
          description: desc,
          category: category || (type === 'despesa' ? 'Outros' : 'Outras Receitas'),
          account,
          amount: finalAmount,
          type,
          isConsolidated,
          note,
        },
        isInstallment ? installmentsCount : 1,
        { isTotalAmount }
      );
    }

    // Reset form & close
    setAmountInput('');
    setDescription('');
    setNote('');
    setIsInstallment(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs select-none animate-fadeIn p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t-4 sm:border-2 border-[#82af07] max-h-[92vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Top Header Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#82af07] animate-pulse"></span>
            <h3 className="font-black text-[16px] text-[#111111]">
              Novo Lançamento Rápido
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-black cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Segmented Type Toggle (Despesa / Receita / Transferência) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('despesa')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[13px] transition-all cursor-pointer ${
                type === 'despesa'
                  ? 'bg-red-600 text-white shadow-md scale-[1.02]'
                  : 'text-gray-600 hover:text-black font-bold'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 stroke-[3]" />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => setType('receita')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[13px] transition-all cursor-pointer ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                  : 'text-gray-600 hover:text-black font-bold'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>Receita</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transferencia')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[13px] transition-all cursor-pointer ${
                type === 'transferencia'
                  ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                  : 'text-gray-600 hover:text-black font-bold'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 stroke-[3]" />
              <span>Transf.</span>
            </button>
          </div>

          {/* Big Amount Keypad Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <label className="text-[11.5px] font-black uppercase tracking-wider text-gray-500 block mb-1">
              Valor da {type === 'despesa' ? 'Despesa' : type === 'receita' ? 'Receita' : 'Transferência'}
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className={`text-[20px] font-black ${
                type === 'despesa' ? 'text-red-600' : type === 'receita' ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0,00"
                value={amountInput}
                onChange={handleAmountChange}
                className={`text-[34px] sm:text-[38px] font-black bg-transparent text-center focus:outline-none w-56 tabular-nums ${
                  type === 'despesa' ? 'text-red-600' : type === 'receita' ? 'text-emerald-600' : 'text-blue-600'
                }`}
              />
            </div>

            {/* Quick add increment pills (+10, +50, +100, +500) */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-200/70">
              {[10, 50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddValue(val)}
                  className="px-2.5 py-1 text-[11.5px] font-black bg-white border border-gray-300 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Description Input + Suggestions Chips */}
          <div>
            <label className="text-[12.5px] font-black text-gray-700 block mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder={type === 'despesa' ? 'Ex: Supermercado do mês' : type === 'receita' ? 'Ex: Salário empresa' : 'Ex: Reserva de emergência'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] font-bold text-black focus:border-[#82af07] focus:ring-2 focus:ring-[#82af07]/20 outline-none transition-all"
            />
            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDescription(sug)}
                  className="shrink-0 px-2.5 py-1 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full cursor-pointer transition-colors active:scale-95"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Account & Category Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account Selector */}
            <div>
              <label className="text-[12px] font-black text-gray-700 block mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#82af07]" />
                <span>{type === 'transferencia' ? 'Conta de Origem' : 'Conta'}</span>
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-[13.5px] font-bold text-black bg-white focus:border-[#82af07] outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account for transfers OR Category for normal transactions */}
            {type === 'transferencia' ? (
              <div>
                <label className="text-[12px] font-black text-gray-700 block mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Conta de Destino</span>
                </label>
                <select
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-[13.5px] font-bold text-black bg-white focus:border-[#82af07] outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[12px] font-black text-gray-700 block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#82af07]" />
                  <span>Categoria</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-[13.5px] font-bold text-black bg-white focus:border-[#82af07] outline-none"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Card de Compra Parcelada Automática (Padrão do Sistema) */}
          {type !== 'transferencia' && (
            <div className="bg-[#f5f5f5] border border-[#cccccc] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-black text-[13.5px] text-[#111111]">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                  />
                  <CreditCard className="w-4 h-4 text-[#111111]" />
                  <span>Parcelar compra (Automático)</span>
                </label>
                {isInstallment && (
                  <span className="text-[11px] font-black bg-[#e0e0e0] text-[#111111] border border-[#999999] px-2 py-0.5 rounded-full">
                    {installmentsCount}x
                  </span>
                )}
              </div>

              {isInstallment && (
                <div className="space-y-2 pt-1 border-t border-[#dddddd]">
                  {/* Divisão total vs valor da parcela */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-lg border border-[#cccccc] text-center">
                    <button
                      type="button"
                      onClick={() => setIsTotalAmount(true)}
                      className={`py-1 text-[11.5px] font-black rounded cursor-pointer transition-colors ${
                        isTotalAmount ? 'bg-[#111111] text-white shadow-xs' : 'text-[#333333] hover:bg-gray-100'
                      }`}
                    >
                      Dividir Total
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTotalAmount(false)}
                      className={`py-1 text-[11.5px] font-black rounded cursor-pointer transition-colors ${
                        !isTotalAmount ? 'bg-[#111111] text-white shadow-xs' : 'text-[#333333] hover:bg-gray-100'
                      }`}
                    >
                      Valor por Parcela
                    </button>
                  </div>

                  {/* Chips rápidos de parcelas */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setInstallmentsCount(num)}
                        className={`flex-1 min-w-[38px] py-1 text-[12px] font-black rounded-lg border cursor-pointer transition-all ${
                          installmentsCount === num
                            ? 'bg-[#111111] text-white border-[#000000] shadow-xs'
                            : 'bg-white text-[#222222] border-[#cccccc] hover:bg-gray-50'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>

                  {/* Preview do cálculo */}
                  {numericAmount > 0 && (
                    <div className="bg-white border border-[#cccccc] rounded-lg p-2.5 text-xs text-[#111111] flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-[#111111] text-[13px]">
                          {installmentCalc.summaryText}
                        </div>
                        <div className="text-[11px] text-[#555555] font-semibold mt-0.5">
                          Gera {installmentsCount} lançamentos mensais com arredondamento exato de centavos.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date & Consolidation Check */}
          <div className="grid grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="text-[12px] font-black text-gray-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                <span>Data</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-[13px] font-bold text-black bg-white focus:border-[#82af07] outline-none"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isConsolidated}
                  onChange={(e) => setIsConsolidated(e.target.checked)}
                  className="w-4 h-4 accent-[#82af07] cursor-pointer"
                />
                <span className="text-[12.5px] font-black text-gray-800">
                  {isConsolidated ? '✓ Já liquidado' : '⏳ Pendente'}
                </span>
              </label>
            </div>
          </div>

          {/* Inline Error Message */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-[12.5px] font-black rounded-xl">
              ⚠️ {formError}
            </div>
          )}

          {/* Bottom Save Action Button */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl font-black text-[15px] text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'despesa'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/20'
                  : type === 'receita'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/20'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Salvar {type === 'despesa' ? 'Despesa' : type === 'receita' ? 'Receita' : 'Transferência'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
