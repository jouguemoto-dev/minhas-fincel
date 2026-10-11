import React, { useState, useMemo } from 'react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateWithWeekday, formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';
import {
  calculateInstallmentValues,
  generateInstallmentTransactions,
} from '../utils/installments';
import { CreditCard, Calendar as CalendarIcon, Check } from 'lucide-react';

interface InstallmentPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  currentDateStr?: string;
  onSaveInstallments: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const InstallmentPurchaseModal: React.FC<InstallmentPurchaseModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  currentDateStr,
  onSaveInstallments,
}) => {
  if (!isOpen) return null;

  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('despesa');
  const [amountStr, setAmountStr] = useState('');
  const [isTotalAmount, setIsTotalAmount] = useState(true);
  const [installmentsCount, setInstallmentsCount] = useState(10);
  const [category, setCategory] = useState(categories[0]?.name || 'Sem Categoria');
  const [account, setAccount] = useState(
    accounts.find((a) => a.type === 'cartao')?.name || accounts[0]?.name || 'Carteira'
  );
  const [startDate, setStartDate] = useState(() => {
    return currentDateStr || new Date().toISOString().split('T')[0];
  });
  const [consolidateFirst, setConsolidateFirst] = useState(false);
  const [note, setNote] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [formError, setFormError] = useState('');

  const quickOptions = [2, 3, 4, 5, 6, 10, 12, 18, 24];

  // Parse amount
  const numericAmount = useMemo(() => {
    return parseCurrencyInput(amountStr);
  }, [amountStr]);

  // Live calculation values
  const calculation = useMemo(() => {
    return calculateInstallmentValues(numericAmount, installmentsCount, isTotalAmount);
  }, [numericAmount, installmentsCount, isTotalAmount]);

  // Generate preview schedule
  const schedulePreview = useMemo(() => {
    if (numericAmount <= 0) return [];
    return generateInstallmentTransactions({
      date: startDate,
      description: description || 'Compra Parcelada',
      category,
      account,
      amount: calculation.totalAmount,
      type,
      installmentsCount,
      isTotalAmount: true,
      isConsolidated: consolidateFirst,
      consolidateFirstOnly: true,
      note: note.trim() || undefined,
    });
  }, [numericAmount, startDate, description, category, account, calculation.totalAmount, type, installmentsCount, consolidateFirst, note]);

  // Flattened categories for select
  const allCategoryOptions: string[] = ['Sem Categoria'];
  categories.forEach((cat) => {
    if (cat.name !== 'Sem Categoria') {
      allCategoryOptions.push(cat.name);
      if (cat.subcategories) {
        cat.subcategories.forEach((sub) => allCategoryOptions.push(sub));
      }
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Por favor, informe a descrição da compra.');
      return;
    }

    if (numericAmount <= 0) {
      setFormError('Informe um valor válido maior que R$ 0,00.');
      return;
    }

    if (installmentsCount < 2 || installmentsCount > 72) {
      setFormError('O número de parcelas deve ser entre 2 e 72 vezes.');
      return;
    }

    const txsToCreate = generateInstallmentTransactions({
      date: startDate,
      description: description.trim(),
      category: category || 'Outros',
      account: account || 'Carteira',
      amount: isTotalAmount ? calculation.totalAmount : numericAmount,
      type,
      installmentsCount,
      isTotalAmount,
      isConsolidated: consolidateFirst,
      consolidateFirstOnly: true,
      note: note.trim() || undefined,
    });

    onSaveInstallments(txsToCreate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 select-none animate-fadeIn font-sans">
      <div className="bg-[#f2f2f2] border-2 border-[#666666] rounded-xs shadow-2xl w-full max-w-3xl text-[14px] text-[#000000] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Header Bar - Identical to AddTransactionBar header */}
        <div className="bg-[#555555] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-[13.5px] sm:text-[14px] flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <span className="font-black text-white text-[14.5px] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-white" />
              Parcelar Compra
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white">
              <input
                type="radio"
                name="instType"
                value="despesa"
                checked={type === 'despesa'}
                onChange={() => setType('despesa')}
                className="accent-[#0078d7] cursor-pointer w-4 h-4"
              />
              Despesa
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white">
              <input
                type="radio"
                name="instType"
                value="receita"
                checked={type === 'receita'}
                onChange={() => setType('receita')}
                className="accent-[#0078d7] cursor-pointer w-4 h-4"
              />
              Receita
            </label>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span
              className="w-5 h-5 border border-white/80 bg-transparent flex items-center justify-center text-[12px] font-black cursor-help"
              title="Informe os dados da compra e selecione a quantidade de parcelas para divisão automática de valores e datas."
            >
              ?
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 border border-white/80 bg-transparent flex items-center justify-center text-[12px] cursor-pointer hover:bg-white/20 font-black"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {formError && (
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-between shrink-0">
            <span>⚠️ {formError}</span>
            <button
              type="button"
              onClick={() => setFormError('')}
              className="text-white hover:text-gray-200 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto">
          {/* Main Row Inputs Bar - Identical to AddTransactionBar input row */}
          <div className="bg-[#b5b5b5] p-2.5 flex items-center gap-2 flex-wrap">
            {/* Date Input */}
            <div className="flex items-center bg-white border border-[#777] px-2 py-1 w-full sm:w-[140px] shrink-0 h-9">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-[13px] font-bold text-[#000000] focus:outline-none cursor-pointer bg-transparent"
                title="Data da 1ª parcela"
              />
            </div>

            {/* Description */}
            <div className="flex items-center bg-white border border-[#777] px-2.5 py-1 flex-1 min-w-[180px] h-9">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da compra (ex: Notebook, Pneu...)"
                required
                className="w-full text-[13px] font-bold text-[#000000] focus:outline-none placeholder-gray-500 bg-transparent"
              />
            </div>

            {/* Category Select */}
            <div className="flex items-center bg-white border border-[#777] px-2 py-1 w-full sm:w-[150px] shrink-0 h-9">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-[13px] font-bold text-[#000000] focus:outline-none bg-transparent cursor-pointer"
              >
                {allCategoryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Select */}
            <div className="flex items-center bg-white border border-[#777] px-2 py-1 w-full sm:w-[150px] shrink-0 h-9">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full text-[13px] font-bold text-[#000000] focus:outline-none bg-transparent cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.type === 'cartao' ? '💳 ' : '🏦 '}
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="flex items-center bg-white border border-[#777] px-2.5 py-1 w-full sm:w-[130px] shrink-0 h-9">
              <span className="text-gray-500 font-black mr-1 text-[13px]">R$</span>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value, amountStr);
                  setAmountStr(formatted);
                }}
                placeholder="0,00"
                className="w-full text-[14px] font-black text-[#000000] focus:outline-none text-right placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>

          {/* Configuração de Parcelamento (Estilo Clássico Minhas Economias) */}
          <div className="bg-[#ebebeb] p-3 sm:p-4 space-y-3 border-t border-[#ccc]">
            
            {/* Como dividir */}
            <div className="space-y-1">
              <span className="text-[#000000] font-black text-[13.5px] block">
                Forma de Cálculo do Parcelamento:
              </span>
              <div className="flex items-center gap-4 text-[13px] font-bold flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#000000]">
                  <input
                    type="radio"
                    name="splitModeModal"
                    checked={isTotalAmount}
                    onChange={() => setIsTotalAmount(true)}
                    className="accent-[#0078d7] w-4 h-4 cursor-pointer"
                  />
                  Dividir valor total informado nas parcelas (Padrão)
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[#000000]">
                  <input
                    type="radio"
                    name="splitModeModal"
                    checked={!isTotalAmount}
                    onChange={() => setIsTotalAmount(false)}
                    className="accent-[#0078d7] w-4 h-4 cursor-pointer"
                  />
                  Valor digitado é de cada parcela (Multiplicar)
                </label>
              </div>
            </div>

            {/* Seletor de Parcelas com Botões Rápidos */}
            <div className="space-y-1.5 pt-1 border-t border-[#d5d5d5]">
              <div className="flex items-center justify-between">
                <span className="text-[#000000] font-black text-[13.5px]">
                  Quantidade de Parcelas: <strong className="text-[#111111] font-black text-base">{installmentsCount}x</strong>
                </span>
                <div className="flex items-center gap-1 text-[12px] font-bold text-[#000000]">
                  <span>Outro:</span>
                  <input
                    type="number"
                    min={2}
                    max={72}
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Math.min(72, Math.max(2, parseInt(e.target.value) || 2)))}
                    className="w-14 px-1.5 py-0.5 border border-[#888] rounded-xs text-center font-black text-sm bg-white"
                  />
                </div>
              </div>

              {/* Botões Rápidos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setInstallmentsCount(opt)}
                    className={`px-3 py-1 text-[12.5px] font-black border rounded-xs cursor-pointer transition-all ${
                      installmentsCount === opt
                        ? 'bg-[#111111] text-white border-[#000000] shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-[#000000] border-[#999]'
                    }`}
                  >
                    {opt}x
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo da Divisão Automática (Caixa Neutra Padrão do Sistema) */}
            {numericAmount > 0 && (
              <div className="bg-[#f0f0f0] border border-[#a0a0a0] p-3 text-[#111111] rounded-xs text-[13px] font-bold space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-[14.5px]">
                    {calculation.summaryText}
                  </span>
                  <span className="text-[12px] text-[#555555]">
                    Término previsto: {schedulePreview[schedulePreview.length - 1]?.date}
                  </span>
                </div>
                <div className="text-[12px] text-[#555555] font-semibold">
                  Divisão exata de centavos distribuída nas primeiras parcelas. Vencimentos mensais calculados com proteção de fim de mês.
                </div>
              </div>
            )}

            {/* Checkbox de 1ª Parcela Liquidada & Observação */}
            <div className="space-y-2 pt-1 border-t border-[#d5d5d5]">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#000000] text-[13px]">
                <input
                  type="checkbox"
                  checked={consolidateFirst}
                  onChange={(e) => setConsolidateFirst(e.target.checked)}
                  className="w-4 h-4 accent-[#0078d7] cursor-pointer"
                />
                Marcar a 1ª parcela como já liquidada / paga (as demais ficam pendentes)
              </label>

              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nota / Observações adicionais..."
                  className="w-full px-2.5 py-1.5 border border-[#888] rounded-xs text-[13px] text-[#000000] bg-white focus:outline-none focus:border-[#555555]"
                />
              </div>
            </div>

            {/* Cronograma Previsto Alternável */}
            {schedulePreview.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[#000000] font-black text-[12.5px]">
                    Cronograma das {installmentsCount} parcelas:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="text-[12px] text-[#111111] font-black hover:underline cursor-pointer"
                  >
                    {showSchedule ? 'Ocultar cronograma ▲' : 'Visualizar todas as datas ▼'}
                  </button>
                </div>

                {showSchedule && (
                  <div className="border border-[#cccccc] bg-white max-h-44 overflow-y-auto divide-y divide-[#eeeeee] text-[12px]">
                    {schedulePreview.map((item, idx) => (
                      <div key={idx} className="px-3 py-1.5 flex items-center justify-between hover:bg-[#f5f5f5]">
                        <span className="font-bold text-[#000000]">
                          Parcela {idx + 1} de {installmentsCount}
                          {idx === 0 && consolidateFirst && (
                            <span className="ml-2 text-[10.5px] bg-[#e4e4e4] text-[#111111] border border-[#999999] px-1.5 py-0.2 rounded-xs font-black">
                              Liquidada (✓)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-[#555555] font-semibold">{formatDateWithWeekday(item.date)}</span>
                          <span className="font-black text-[#000000] tabular-nums">
                            {formatCurrency(Math.abs(item.amount))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Buttons - Identical to AddTransactionBar / EditTransactionModal */}
        <div className="bg-[#f2f2f2] px-4 py-2.5 border-t border-[#cccccc] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#dadada] text-[#000000] font-bold rounded-xs cursor-pointer text-[13px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-6 py-1.5 bg-[#111111] hover:bg-[#000000] text-white font-black rounded-xs border border-[#000000] cursor-pointer text-[13px] shadow-xs active:translate-y-px"
          >
            Salvar {installmentsCount} Parcelas
          </button>
        </div>

      </div>
    </div>
  );
};
