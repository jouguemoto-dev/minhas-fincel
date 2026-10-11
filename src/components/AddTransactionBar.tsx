import React, { useState, useEffect, useMemo } from 'react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { HelpCircle, X, Check, Calendar as CalendarIcon, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { calculateInstallmentValues } from '../utils/installments';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';

interface AddTransactionBarProps {
  accounts: Account[];
  categories: Category[];
  currentDateStr: string; // e.g. '2026-10-09'
  onSave: (
    transaction: Omit<Transaction, 'id'>,
    installmentsCount?: number,
    options?: { isTotalAmount?: boolean }
  ) => void;
  onCancel: () => void;
  initialMode?: 'normal' | 'parcelamento';
}

export const AddTransactionBar: React.FC<AddTransactionBarProps> = ({
  accounts,
  categories,
  currentDateStr,
  onSave,
  onCancel,
  initialMode = 'normal',
}) => {
  const [type, setType] = useState<TransactionType>('despesa');
  const [createRule, setCreateRule] = useState(false);
  const [date, setDate] = useState(() => currentDateStr || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (currentDateStr) {
      setDate(currentDateStr);
    }
  }, [currentDateStr]);
  const [category, setCategory] = useState('Sem Categoria');
  const [account, setAccount] = useState(accounts[0]?.name || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.name || '');
  const [amountStr, setAmountStr] = useState('');
  
  // More options
  const [showMoreOptions, setShowMoreOptions] = useState(initialMode === 'parcelamento');
  const [reminder, setReminder] = useState('Nenhum');
  const [repeatMode, setRepeatMode] = useState<'none' | 'parcelamento' | 'avancado'>(
    initialMode === 'parcelamento' ? 'parcelamento' : 'none'
  );
  const [installments, setInstallments] = useState(3);
  const [isTotalAmount, setIsTotalAmount] = useState(true);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Update repeatMode if initialMode changes
  useEffect(() => {
    if (initialMode === 'parcelamento') {
      setRepeatMode('parcelamento');
      setShowMoreOptions(true);
    }
  }, [initialMode]);

  const numericAmount = useMemo(() => {
    return parseCurrencyInput(amountStr);
  }, [amountStr]);

  const installmentCalc = useMemo(() => {
    return calculateInstallmentValues(numericAmount, installments, isTotalAmount);
  }, [numericAmount, installments, isTotalAmount]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');
    if (!description.trim() && !amountStr) {
      setFormError('Por favor informe a descrição e o valor da transação.');
      return;
    }
    const cleanAmount = parseCurrencyInput(amountStr);
    if (cleanAmount <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }

    const finalAmount = type === 'despesa' ? -Math.abs(cleanAmount) : Math.abs(cleanAmount);
    
    onSave({
      date,
      description: description.trim() || (type === 'transferencia' ? `Transferência para ${toAccount}` : 'Nova Transação'),
      category: type === 'transferencia' ? 'Transferência' : category,
      account: account || accounts[0]?.name || 'CARTEIRA *****',
      amount: finalAmount,
      type,
      isConsolidated: false,
      isRecurring: repeatMode !== 'none',
      recurrenceText: repeatMode === 'parcelamento' ? `1 / ${installments}` : undefined,
      reminder,
      note: note.trim() || undefined,
      toAccount: type === 'transferencia' ? toAccount : undefined,
    }, repeatMode === 'parcelamento' ? installments : 1, { isTotalAmount });
  };

  // Flattened categories for select
  const allCategoryOptions: string[] = ['Sem Categoria'];
  categories.forEach(cat => {
    if (cat.name !== 'Sem Categoria') {
      allCategoryOptions.push(cat.name);
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => allCategoryOptions.push(sub));
      }
    }
  });

  return (
    <div className="bg-[#f2f2f2] border-2 border-[#666666] rounded-xs shadow-md mb-3 text-[14px] select-none text-[#000000]">
      {/* Top Bar with Type Radios */}
      <div className="bg-[#555555] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-[13.5px] sm:text-[14px] flex-wrap gap-2">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-bold text-white">
            <input
              type="radio"
              name="txType"
              value="despesa"
              checked={type === 'despesa'}
              onChange={() => setType('despesa')}
              className="accent-[#0078d7] cursor-pointer w-4 h-4"
            />
            Despesa
          </label>
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-bold text-white">
            <input
              type="radio"
              name="txType"
              value="receita"
              checked={type === 'receita'}
              onChange={() => setType('receita')}
              className="accent-[#0078d7] cursor-pointer w-4 h-4"
            />
            Receita
          </label>
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-bold text-white">
            <input
              type="radio"
              name="txType"
              value="transferencia"
              checked={type === 'transferencia'}
              onChange={() => setType('transferencia')}
              className="accent-[#0078d7] cursor-pointer w-4 h-4"
            />
            Transferência
          </label>

          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer opacity-95 font-bold text-white">
            <input
              type="checkbox"
              checked={createRule}
              onChange={(e) => setCreateRule(e.target.checked)}
              className="accent-[#73a000] cursor-pointer w-4 h-4"
            />
            Criar regra
          </label>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span
            className="w-5 h-5 border border-white/80 bg-transparent flex items-center justify-center text-[12px] font-black cursor-help"
            title="Preencha os campos para adicionar uma nova transação. Clique em Mais opções para parcelamento, notas ou lembretes."
          >
            ?
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="w-5 h-5 border border-white/80 bg-transparent flex items-center justify-center text-[12px] cursor-pointer hover:bg-white/20 font-black"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      {formError && (
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-between">
          <span>⚠️ {formError}</span>
          <button type="button" onClick={() => setFormError('')} className="text-white hover:text-gray-200 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Row Inputs */}
      <div className="bg-[#b5b5b5] p-2.5 flex items-center gap-2.5 flex-wrap lg:flex-nowrap">
        {/* Date Input with calendar icon */}
        <div className="flex items-center bg-white border border-[#777] px-2.5 py-1 w-full sm:w-[145px] shrink-0 h-9">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-[13.5px] font-bold focus:outline-none text-[#000000]"
          />
        </div>

        {/* Description Input */}
        <input
          type="text"
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 w-full sm:w-auto min-w-[140px] bg-white border border-[#777] px-3 py-1 text-[14px] font-bold text-[#000000] focus:outline-none focus:border-[#73a000] h-9"
          autoFocus
        />

        {/* Category Dropdown */}
        {type !== 'transferencia' ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-[160px] bg-white border border-[#777] px-2.5 py-1 text-[13.5px] font-bold text-[#000000] focus:outline-none shrink-0 h-9 cursor-pointer"
          >
            {allCategoryOptions.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full sm:w-[160px] px-2.5 py-1.5 text-[13.5px] font-bold text-[#000000] bg-gray-100 border border-[#777] h-9 flex items-center">
            Transferência
          </div>
        )}

        {/* Account Dropdown */}
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full sm:w-[160px] bg-white border border-[#777] px-2.5 py-1 text-[13.5px] font-bold text-[#000000] focus:outline-none shrink-0 h-9 cursor-pointer"
        >
          <option value="">Selecione a conta</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.name}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* If Transfer, Destination Account */}
        {type === 'transferencia' && (
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="w-full sm:w-[150px] bg-white border border-[#777] px-2.5 py-1 text-[13.5px] font-bold text-[#000000] focus:outline-none shrink-0 h-9 cursor-pointer"
          >
            <option value="">Conta Destino</option>
            {accounts.filter(a => a.name !== account).map((acc) => (
              <option key={acc.id} value={acc.name}>
                Para: {acc.name}
              </option>
            ))}
          </select>
        )}

        {/* Amount Input with automatic comma formatting */}
        <div className="relative w-full sm:w-[130px] shrink-0 h-9">
          <input
            type="text"
            placeholder="0,00"
            value={amountStr}
            onChange={(e) => {
              const formatted = formatCurrencyInput(e.target.value, amountStr);
              setAmountStr(formatted);
            }}
            className="w-full h-full bg-white border border-[#777] px-3 py-1 text-[14.5px] text-right font-black text-[#000000] focus:outline-none focus:border-[#000000]"
          />
        </div>

        {/* Quick Checkmark Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          className="w-full sm:w-9 h-9 bg-[#111111] hover:bg-[#000000] text-white flex items-center justify-center border border-[#000000] rounded-xs cursor-pointer shrink-0 font-bold"
          title="Confirmar transação"
        >
          <Check className="w-5 h-5 stroke-[3] inline sm:block" />
          <span className="sm:hidden ml-2 font-black">Salvar Lançamento</span>
        </button>
      </div>

      {/* "Mais opções ▾" Toggle Tab */}
      <div className="flex justify-center -mb-2 relative z-10">
        <button
          type="button"
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="bg-[#777777] hover:bg-[#666666] text-white px-4 py-1 text-[11.5px] rounded-b cursor-pointer shadow-xs font-bold"
        >
          {showMoreOptions ? 'Menos opções ▴' : 'Mais opções ▾'}
        </button>
      </div>

      {/* Expanded "Mais opções" section */}
      {showMoreOptions && (
        <div className="bg-white p-4 pt-5 border-t border-[#bbbbbb] mt-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Lembrete & Repetir */}
            <div className="space-y-4">
              {/* Lembrete */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#000000] text-[13.5px]">
                  <Clock className="w-4 h-4 text-black" />
                  <span>Lembrete</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className="text-[#000000] font-bold text-[13px]">e-mail</span>
                  <select
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="border border-[#888] px-2.5 py-1 text-[13px] font-semibold text-[#000000] focus:outline-none"
                  >
                    <option value="Nenhum">Nenhum</option>
                    <option value="No dia da transação">No dia da transação</option>
                    <option value="1 dia antes">1 dia antes</option>
                    <option value="3 dias antes">3 dias antes</option>
                  </select>
                </div>
              </div>

              {/* Repetir transação */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#000000] text-[13.5px]">
                  <RotateCcw className="w-4 h-4 text-black" />
                  <span>Repetir transação</span>
                </div>
                <div className="flex items-center gap-4 pl-4 pt-1 flex-wrap text-[13px]">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#000000]">
                    <input
                      type="radio"
                      name="repeat"
                      value="none"
                      checked={repeatMode === 'none'}
                      onChange={() => setRepeatMode('none')}
                      className="accent-[#0078d7]"
                    />
                    Sem repetição
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#000000]">
                    <input
                      type="radio"
                      name="repeat"
                      value="parcelamento"
                      checked={repeatMode === 'parcelamento'}
                      onChange={() => setRepeatMode('parcelamento')}
                      className="accent-[#0078d7]"
                    />
                    Parcelamento (Mensal)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#000000]">
                    <input
                      type="radio"
                      name="repeat"
                      value="avancado"
                      checked={repeatMode === 'avancado'}
                      onChange={() => setRepeatMode('avancado')}
                      className="accent-[#0078d7]"
                    />
                    Avançado
                  </label>
                </div>

                {repeatMode === 'parcelamento' && (
                  <div className="pl-2 pt-2.5 space-y-2.5 border-t border-[#ccc] mt-2">
                    {/* Divisão automática toggle */}
                    <div className="flex items-center gap-4 text-[12.5px] font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[#000000]">
                        <input
                          type="radio"
                          name="splitModeBar"
                          checked={isTotalAmount}
                          onChange={() => setIsTotalAmount(true)}
                          className="accent-[#0078d7] cursor-pointer"
                        />
                        Dividir valor total nas parcelas
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[#000000]">
                        <input
                          type="radio"
                          name="splitModeBar"
                          checked={!isTotalAmount}
                          onChange={() => setIsTotalAmount(false)}
                          className="accent-[#0078d7] cursor-pointer"
                        />
                        Valor informado é de cada parcela
                      </label>
                    </div>

                    {/* Parcelas Selector & Quick Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#000000] font-black text-[13px]">Parcelas:</span>
                      <input
                        type="number"
                        min={2}
                        max={72}
                        value={installments}
                        onChange={(e) => setInstallments(Math.max(2, Math.min(72, parseInt(e.target.value) || 2)))}
                        className="w-14 px-1.5 py-0.5 border border-[#888] text-[13px] font-black text-[#000000] text-center bg-white"
                      />
                      
                      {/* Chips */}
                      {[2, 3, 4, 5, 6, 10, 12, 18, 24].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setInstallments(count)}
                          className={`px-2 py-0.5 text-[11.5px] font-black border rounded-xs cursor-pointer transition-colors ${
                            installments === count
                              ? 'bg-[#111111] text-white border-[#000000]'
                              : 'bg-white hover:bg-gray-100 text-[#000000] border-[#999]'
                          }`}
                        >
                          {count}x
                        </button>
                      ))}
                    </div>

                    {/* Live Calculation Preview Banner */}
                    {numericAmount > 0 && (
                      <div className="bg-[#f0f0f0] border border-[#a0a0a0] p-2 text-[12px] font-bold text-[#111111] flex items-center gap-2 rounded-xs">
                        <RotateCcw className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                        <span>
                          <strong>Divisão Automática:</strong> {installmentCalc.summaryText}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Nota */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-[#000000] text-[13.5px]">Nota</span>
                <button
                  type="button"
                  className="w-4 h-4 border border-[#888] flex items-center justify-center text-[10px] text-[#000000] font-bold"
                  title="Observações internas sobre a transação"
                >
                  ?
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observações adicionais..."
                className="w-full h-20 p-2.5 border border-[#888] text-[13px] font-semibold text-[#000000] focus:outline-none focus:border-[#555555] resize-none"
              />
            </div>
          </div>

          {/* Action Buttons: Cancelar & Salvar */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ddd]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 border border-[#999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#dadada] text-[#000000] font-bold rounded-xs cursor-pointer text-[12.5px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-6 py-1.5 bg-[#111111] hover:bg-[#000000] text-white font-black rounded-xs border border-[#000000] cursor-pointer text-[12.5px] shadow-xs active:translate-y-px"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
