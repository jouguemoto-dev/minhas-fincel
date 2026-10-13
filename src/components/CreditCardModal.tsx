import React, { useState, useEffect } from 'react';
import { CreditCard, CardBrand, Account } from '../types';
import { CARD_BRAND_DETAILS } from '../utils/creditCards';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';
import { Trash2, CreditCard as CardIcon, Check, Sparkles } from 'lucide-react';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: CreditCard | null;
  accounts?: Account[];
  onSaveCard: (card: Omit<CreditCard, 'id'> & { id?: string }) => void;
  onDeleteCard?: (id: string) => void;
}

const PRESET_COLORS = [
  { label: 'Roxo Nubank', value: '#820ad1', gradient: 'from-[#820ad1] to-[#4c057b]' },
  { label: 'Preto Black', value: '#18181b', gradient: 'from-[#27272a] to-[#09090b]' },
  { label: 'Azul Marinho', value: '#1e3a8a', gradient: 'from-[#1e40af] to-[#172554]' },
  { label: 'Laranja Inter', value: '#ea580c', gradient: 'from-[#f97316] to-[#9a3412]' },
  { label: 'Vermelho Santander', value: '#b91c1c', gradient: 'from-[#dc2626] to-[#7f1d1d]' },
  { label: 'Verde Economias', value: '#5a8710', gradient: 'from-[#65a30d] to-[#365314]' },
  { label: 'Dourado Gold', value: '#b45309', gradient: 'from-[#d97706] to-[#78350f]' },
  { label: 'Cinza Grafite', value: '#334155', gradient: 'from-[#475569] to-[#0f172a]' },
];

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  cardToEdit,
  accounts = [],
  onSaveCard,
  onDeleteCard,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CardBrand>('mastercard');
  const [limitStr, setLimitStr] = useState('5.000,00');
  const [closingDay, setClosingDay] = useState(5);
  const [dueDay, setDueDay] = useState(12);
  const [color, setColor] = useState('#820ad1');
  const [last4Digits, setLast4Digits] = useState('');
  const [accountId, setAccountId] = useState('');
  const [formError, setFormError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setFormError('');
    setShowConfirmDelete(false);
    if (cardToEdit) {
      setName(cardToEdit.name);
      setBrand(cardToEdit.brand || 'mastercard');
      setLimitStr(
        (cardToEdit.limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
      setClosingDay(Math.min(31, Math.max(1, Math.round(Number(cardToEdit.closingDay)) || 5)));
      setDueDay(Math.min(31, Math.max(1, Math.round(Number(cardToEdit.dueDay)) || 12)));
      setColor(cardToEdit.color || '#820ad1');
      setLast4Digits(cardToEdit.last4Digits || '');
      setAccountId(cardToEdit.accountId || '');
    } else {
      setName('');
      setBrand('mastercard');
      setLimitStr('5.000,00');
      setClosingDay(5);
      setDueDay(12);
      setColor('#820ad1');
      setLast4Digits('');
      setAccountId('');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const currentLimitNumber = parseCurrencyInput(limitStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Informe o nome do cartão de crédito (Ex: Nubank, Itaú Click).');
      return;
    }

    if (currentLimitNumber <= 0) {
      setFormError('Informe um limite de crédito válido maior que R$ 0,00.');
      return;
    }

    if (closingDay < 1 || closingDay > 31) {
      setFormError('Dia de fechamento inválido (deve ser entre 1 e 31).');
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      setFormError('Dia de vencimento inválido (deve ser entre 1 e 31).');
      return;
    }

    onSaveCard({
      id: cardToEdit?.id,
      name: cleanName.toUpperCase(),
      brand,
      limit: currentLimitNumber,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
      last4Digits: last4Digits.replace(/\D/g, '').slice(0, 4) || undefined,
      accountId: accountId || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!cardToEdit || !onDeleteCard) return;
    onDeleteCard(cardToEdit.id);
    onClose();
  };

  const selectedPreset = PRESET_COLORS.find((p) => p.value === color) || PRESET_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-[530px] text-[14px] text-[#000000] rounded-xs font-sans my-auto">
        {/* Title Bar */}
        <div className="bg-[#eeeeee] border-b border-[#cccccc] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-[#5a8710]" />
            <span className="font-black text-[15px] text-[#000000]">
              {cardToEdit ? `Editar Cartão: ${cardToEdit.name}` : 'Cadastrar Novo Cartão de Crédito'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-[#888] bg-white hover:bg-gray-100 text-[13px] font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live Visual Card Preview */}
        <div className="p-4 bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-200 flex justify-center">
          <div
            className={`w-full max-w-[360px] h-48 rounded-xl p-4 text-white shadow-xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 bg-gradient-to-br ${selectedPreset.gradient}`}
            style={{ backgroundColor: color }}
          >
            {/* Top row: Chip & Card Name */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-7 bg-amber-200/90 rounded border border-amber-400/50 flex flex-col justify-around p-1 shadow-xs">
                  <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                  <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                </div>
                <span className="text-[11px] font-bold tracking-wider opacity-80 uppercase">Crédito</span>
              </div>
              <span className="font-black text-xs sm:text-sm tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded backdrop-blur-xs">
                {CARD_BRAND_DETAILS[brand]?.logoText || brand.toUpperCase()}
              </span>
            </div>

            {/* Middle row: Card Name */}
            <div className="z-10 my-auto">
              <div className="text-[16px] sm:text-[18px] font-black tracking-wide truncate drop-shadow-sm uppercase">
                {name.trim() || 'NOME DO SEU CARTÃO'}
              </div>
              <div className="text-[12px] font-mono tracking-widest text-white/80 mt-1">
                •••• •••• •••• {last4Digits.padStart(4, '•')}
              </div>
            </div>

            {/* Bottom row: Limit and Dates */}
            <div className="flex items-end justify-between z-10 pt-2 border-t border-white/20 text-[11px]">
              <div>
                <span className="text-[9.5px] uppercase tracking-wider text-white/70 block">Limite Total</span>
                <span className="font-black text-sm tracking-tight">{formatCurrency(currentLimitNumber)}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-200 text-[11px] block">
                  Vencimento: Todo Dia {dueDay}
                </span>
                <span className="text-[10px] font-bold text-white/90 block mt-0.5">
                  Melhor Compra (Fecha): Dia {closingDay}
                </span>
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Card Name */}
          <div className="space-y-1">
            <label className="font-black text-[#000000] text-[13px] flex items-center justify-between">
              <span>Nome / Apelido do Cartão:</span>
              <span className="text-xs text-gray-500 font-semibold">Ex: Nubank, Itaú Click, XP</span>
            </label>
            <input
              type="text"
              placeholder="Ex: NUBANK MASTERCARD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] focus:outline-none focus:border-[#73a000] bg-white uppercase"
              autoFocus
              required
            />
          </div>

          {/* Bandeira & Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13px]">Bandeira:</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as CardBrand)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[13.5px] font-bold text-[#000000] focus:outline-none bg-white cursor-pointer"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="hipercard">Hipercard</option>
                <option value="outro">Outra Bandeira</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13px]">Limite Total (R$):</label>
              <div className="flex items-center border border-[#888888] px-2.5 py-1.5 bg-white">
                <span className="text-gray-600 font-black mr-1 text-[13px]">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={limitStr}
                  onChange={(e) => setLimitStr(formatCurrencyInput(e.target.value, limitStr))}
                  className="w-full text-right font-black text-[#000000] focus:outline-none text-[14px]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Ciclo da Fatura: Vencimento e Fechamento / Melhor Compra */}
          <div className="space-y-2 bg-gray-50 p-3 border border-gray-300 rounded-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-black text-[#000000] text-[12px] block">
                  Dia de Vencimento:
                </label>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-[#888888] text-[13px] font-black text-[#000000] focus:outline-none bg-white cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
                <span className="text-[10.5px] text-red-700 font-bold block">Pagamento da fatura</span>
              </div>

              <div className="space-y-1">
                <label className="font-black text-[#000000] text-[12px] block">
                  Melhor Compra (Fecha):
                </label>
                <select
                  value={closingDay}
                  onChange={(e) => setClosingDay(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-[#888888] text-[13px] font-black text-[#000000] focus:outline-none bg-white cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
                <span className="text-[10.5px] text-[#5a8710] font-bold block">Fechamento do ciclo</span>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="font-black text-[#000000] text-[12px] block">Últimos 4 Dígitos:</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ex: 4890"
                  value={last4Digits}
                  onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-2.5 py-1.5 border border-[#888888] text-[13px] font-mono font-bold text-center text-[#000000] focus:outline-none bg-white"
                />
                <span className="text-[10.5px] text-gray-500 font-semibold block">Opcional</span>
              </div>
            </div>

            {/* Ciclo Explicativo Dinâmico */}
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xs text-[11.5px] leading-relaxed">
              <div className="font-bold flex items-center gap-1 text-emerald-900">
                <span>💡</span>
                <span>Ciclo configurado para este cartão:</span>
              </div>
              <div className="mt-0.5 text-gray-700 font-medium">
                • <strong>Vencimento:</strong> Todo <strong>Dia {dueDay}</strong> vence a fatura para pagamento.<br />
                • <strong>Melhor dia de compra:</strong> Todo <strong>Dia {closingDay}</strong> a fatura fecha. Compras feitas a partir do <strong>Dia {closingDay}</strong> entram só no próximo mês (até ~40 dias para pagar).
              </div>
            </div>
          </div>

          {/* Color Pallet */}
          <div className="space-y-1.5">
            <label className="font-black text-[#000000] text-[13px] block">Cor Visual do Cartão:</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_COLORS.map((p) => {
                const isSelected = color === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setColor(p.value)}
                    className={`h-8 rounded-sm relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105 border ${
                      isSelected ? 'ring-2 ring-[#5a8710] ring-offset-1 border-black scale-105' : 'border-gray-400'
                    }`}
                    style={{ backgroundColor: p.value }}
                    title={p.label}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conta bancária vinculada opcional */}
          {accounts.length > 0 && (
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13px] flex items-center justify-between">
                <span>Conta Vinculada (Débito da Fatura):</span>
                <span className="text-xs text-gray-500 font-normal">Opcional</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[13.5px] font-bold text-[#000000] focus:outline-none bg-white cursor-pointer"
              >
                <option value="">Nenhuma / Pagamento avulso</option>
                {accounts
                  .filter((a) => a.type !== 'cartao')
                  .map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {formError && (
            <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-[13px] font-bold rounded-xs">
              ⚠️ {formError}
            </div>
          )}

          {showConfirmDelete && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xs flex items-center justify-between">
              <span className="text-red-900 font-bold text-[13px]">Excluir o cartão "{cardToEdit?.name}"?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs font-bold border border-gray-400 bg-white cursor-pointer"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#cccccc]">
            {cardToEdit && onDeleteCard ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-black border border-red-300 rounded-xs text-[13px] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-[#888] bg-gradient-to-b from-[#fff] to-[#e8e8e8] text-[#000000] font-black rounded-xs cursor-pointer text-[13px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black rounded-xs border border-[#446609] cursor-pointer text-[13px] shadow-xs flex items-center gap-1.5"
              >
                <span>{cardToEdit ? 'Atualizar Cartão' : 'Cadastrar Cartão'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
