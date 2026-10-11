import React, { useState, useEffect } from 'react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { Trash2, X, Check, Calendar, Clock } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSave: (updatedTx: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteInstallmentSeries?: (groupId: string, mode: 'all' | 'future', fromNumber?: number) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onSave,
  onDelete,
  onDeleteInstallmentSeries,
}) => {
  if (!isOpen || !transaction) return null;

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(transaction.category);
  const [account, setAccount] = useState(transaction.account);
  const [toAccount, setToAccount] = useState(transaction.toAccount || '');
  const [amountStr, setAmountStr] = useState(
    Math.abs(transaction.amount).toFixed(2).replace('.', ',')
  );
  const [isConsolidated, setIsConsolidated] = useState(transaction.isConsolidated);
  const [note, setNote] = useState(transaction.note || '');
  const [reminder, setReminder] = useState(transaction.reminder || 'Nenhum');
  const [formError, setFormError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setDescription(transaction.description);
      setCategory(transaction.category);
      setAccount(transaction.account);
      setToAccount(transaction.toAccount || '');
      setAmountStr(Math.abs(transaction.amount).toFixed(2).replace('.', ','));
      setIsConsolidated(transaction.isConsolidated);
      setNote(transaction.note || '');
      setReminder(transaction.reminder || 'Nenhum');
      setFormError('');
      setShowConfirmDelete(false);
    }
  }, [transaction]);

  // Flattened categories
  const allCategoryOptions: string[] = ['Sem Categoria'];
  categories.forEach((cat) => {
    if (cat.name !== 'Sem Categoria') {
      allCategoryOptions.push(cat.name);
      if (cat.subcategories) {
        cat.subcategories.forEach((sub) => allCategoryOptions.push(sub));
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!description.trim()) {
      setFormError('A descrição é obrigatória.');
      return;
    }
    const cleanAmount = parseCurrencyInput(amountStr);
    if (cleanAmount <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }

    const finalAmount = type === 'despesa' ? -Math.abs(cleanAmount) : Math.abs(cleanAmount);

    onSave({
      ...transaction,
      date,
      description: description.trim(),
      category: type === 'transferencia' ? 'Transferência' : category,
      account,
      toAccount: type === 'transferencia' ? toAccount : undefined,
      amount: finalAmount,
      type,
      isConsolidated,
      note: note.trim() || undefined,
      reminder,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    onClose();
  };

  const handleDeleteAllInSeries = () => {
    if (transaction.installmentGroupId && onDeleteInstallmentSeries) {
      onDeleteInstallmentSeries(transaction.installmentGroupId, 'all');
      onClose();
    } else {
      handleDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-[540px] text-[14.5px] text-[#000000] rounded-xs font-sans">
        {/* Title Bar */}
        <div className="bg-[#eeeeee] border-b border-[#cccccc] px-4 py-2.5 flex items-center justify-between">
          <span className="font-black text-[15.5px] text-[#000000]">Editar Transação</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-[#888] bg-white hover:bg-gray-100 text-[13px] font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4.5 space-y-4">
          {/* Installment Badge Banner */}
          {(transaction.installmentGroupId || transaction.recurrenceText) && (
            <div className="bg-[#e9f3d3] border border-[#a6ce39] rounded-xs p-2 text-xs font-bold text-[#2e4d00] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                💳 <span>Compra Parcelada:</span>
                <strong className="font-black text-[#1f3500]">
                  {transaction.installmentNumber && transaction.totalInstallments
                    ? `Parcela ${transaction.installmentNumber} de ${transaction.totalInstallments}`
                    : `(${transaction.recurrenceText})`}
                </strong>
              </span>
              <span className="text-[11px] text-[#4d7207] font-semibold">
                Série vinculada
              </span>
            </div>
          )}

          {/* Transaction Type Radio Selector */}
          <div className="flex items-center gap-6 bg-[#f5f5f5] p-3 border border-[#cccccc] rounded-xs text-[14px]">
            <label className="flex items-center gap-2 cursor-pointer font-black text-[#000000]">
              <input
                type="radio"
                name="editTxType"
                value="despesa"
                checked={type === 'despesa'}
                onChange={() => setType('despesa')}
                className="accent-[#0078d7] w-4 h-4"
              />
              Despesa
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-black text-[#000000]">
              <input
                type="radio"
                name="editTxType"
                value="receita"
                checked={type === 'receita'}
                onChange={() => setType('receita')}
                className="accent-[#0078d7] w-4 h-4"
              />
              Receita
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-black text-[#000000]">
              <input
                type="radio"
                name="editTxType"
                value="transferencia"
                checked={type === 'transferencia'}
                onChange={() => setType('transferencia')}
                className="accent-[#0078d7] w-4 h-4"
              />
              Transferência
            </label>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] bg-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">Valor (R$):</label>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(formatCurrencyInput(e.target.value, amountStr))}
                className="w-full px-3 py-1.5 border border-[#888888] text-[14.5px] font-black text-right text-[#000000] bg-white focus:outline-none focus:border-[#000000]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-black text-[#000000] text-[13.5px]">Descrição:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] bg-white"
              required
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">Categoria:</label>
              {type !== 'transferencia' ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#888888] text-[13.5px] font-bold text-[#000000] bg-white cursor-pointer"
                >
                  {allCategoryOptions.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-1.5 border border-[#888888] bg-gray-100 text-[13.5px] font-bold text-[#000000]">
                  Transferência
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">Conta:</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[13.5px] font-bold text-[#000000] bg-white cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If Transfer: Destination Account */}
          {type === 'transferencia' && (
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">Conta Destino:</label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[13.5px] font-bold text-[#000000] bg-white cursor-pointer"
              >
                <option value="">Selecione...</option>
                {accounts
                  .filter((a) => a.name !== account)
                  .map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Consolidated checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#000000] text-[14px]">
              <input
                type="checkbox"
                checked={isConsolidated}
                onChange={(e) => setIsConsolidated(e.target.checked)}
                className="w-4 h-4 accent-[#73a000] cursor-pointer"
              />
              <span>Transação consolidada (efetivada)</span>
            </label>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="font-black text-[#000000] text-[13.5px]">Observações / Nota:</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-18 p-2.5 border border-[#888888] text-[13.5px] font-semibold text-[#000000] bg-white resize-none"
              placeholder="Anotações internas..."
            />
          </div>

          {formError && (
            <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-[13px] font-bold rounded-xs">
              ⚠️ {formError}
            </div>
          )}

          {showConfirmDelete && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-xs space-y-2">
              <span className="text-red-900 font-bold text-[13px] block">
                {transaction.installmentGroupId
                  ? 'Esta transação é uma parcela. Como deseja excluir?'
                  : 'Confirmar exclusão desta transação?'}
              </span>
              <div className="flex gap-2 flex-wrap items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-400 bg-white cursor-pointer rounded-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer rounded-xs"
                >
                  {transaction.installmentGroupId ? 'Excluir Apenas Esta Parcela' : 'Sim, Excluir'}
                </button>
                {transaction.installmentGroupId && (
                  <button
                    type="button"
                    onClick={handleDeleteAllInSeries}
                    className="px-3 py-1.5 text-xs font-bold bg-red-800 hover:bg-red-900 text-white cursor-pointer rounded-xs"
                  >
                    Excluir Todas as Parcelas ({transaction.totalInstallments}x)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#cccccc]">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-black border border-red-300 rounded-xs text-[13px] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-[#888] bg-gradient-to-b from-[#fff] to-[#e8e8e8] hover:to-[#dadada] font-black text-[#000000] rounded-xs cursor-pointer text-[13px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black rounded-xs border border-[#446609] cursor-pointer text-[13px] shadow-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
