import React, { useState } from 'react';
import { Dream } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { Plus, Target, CheckCircle2 } from 'lucide-react';

interface SonhosViewProps {
  dreams: Dream[];
  onAddDream: (dream: Omit<Dream, 'id'>) => void;
  onUpdateDream: (id: string, currentAmount: number) => void;
}

export const SonhosView: React.FC<SonhosViewProps> = ({
  dreams,
  onAddDream,
  onUpdateDream,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [category, setCategory] = useState('Geral');
  const [aporteDream, setAporteDream] = useState<Dream | null>(null);
  const [aporteAmount, setAporteAmount] = useState('100,00');

  const handleSaveAporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aporteDream) return;
    const num = parseFloat(aporteAmount.replace(/\./g, '').replace(',', '.')) || 0;
    if (num > 0) {
      onUpdateDream(aporteDream.id, aporteDream.currentAmount + num);
    }
    setAporteDream(null);
    setAporteAmount('100,00');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    const targetNum = parseFloat(targetAmount.replace(/\./g, '').replace(',', '.')) || 0;
    const currentNum = parseFloat(currentAmount.replace(/\./g, '').replace(',', '.')) || 0;
    onAddDream({
      title,
      targetAmount: targetNum,
      currentAmount: currentNum,
      targetDate,
      category,
    });
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none space-y-4 text-[#000000]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#bbbbbb] flex-wrap gap-2">
        <div>
          <h2 className="text-[16px] font-black text-[#000000]">Meus Sonhos & Objetivos Financeiros</h2>
          <p className="text-[13.5px] text-[#000000] font-bold">
            Planeje suas metas de curto, médio e longo prazo e acompanhe o progresso.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-2 font-black rounded-xs shadow-xs cursor-pointer text-[13px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Sonho</span>
        </button>
      </div>

      {/* Dreams Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dreams.map((d) => {
          const percent = Math.min(100, Math.round((d.currentAmount / d.targetAmount) * 100)) || 0;
          return (
            <div key={d.id} className="border-2 border-[#b8b8b8] bg-[#fafafa] p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-[14.5px] text-[#000000]">{d.title}</h3>
                  <span className="text-[11.5px] text-[#000000] font-bold uppercase">{d.category}</span>
                </div>
                <div className="text-[13px] font-black text-[#73a000]">{percent}%</div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#82af07] h-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Numbers */}
              <div className="flex justify-between text-[13px] text-[#000000] pt-1">
                <div>
                  <div className="text-[11.5px] text-[#000000] font-semibold">Acumulado</div>
                  <div className="font-black text-[13.5px]">{formatCurrency(d.currentAmount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11.5px] text-[#000000] font-semibold">Objetivo</div>
                  <div className="font-black text-[13.5px]">{formatCurrency(d.targetAmount)}</div>
                </div>
              </div>

              <div className="text-[12px] text-[#000000] font-bold pt-1.5 border-t border-gray-300 flex justify-between items-center">
                <span>Prazo: {formatDateBR(d.targetDate)}</span>
                <button
                  onClick={() => {
                    setAporteDream(d);
                    setAporteAmount('100,00');
                  }}
                  className="px-2.5 py-1 bg-[#82af07]/15 text-[#577708] font-black rounded-lg hover:bg-[#82af07]/25 active:scale-95 transition-all cursor-pointer"
                >
                  + Aportar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-[440px] text-[14px] p-4.5 space-y-3.5 font-sans">
            <h3 className="font-black text-[15px] border-b pb-1 text-[#000000]">Adicionar Sonho</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[13px] font-black text-[#000000]">Nome do Sonho:</label>
                <input
                  type="text"
                  placeholder="Ex: Carro Novo, Casa Própria"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[#888] p-1.5 text-[13.5px] font-bold text-[#000000]"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-black text-[#000000]">Valor Alvo (R$):</label>
                <input
                  type="text"
                  placeholder="10.000,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border border-[#888] p-1.5 text-[13.5px] font-black text-[#000000]"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-black text-[#000000]">Valor Já Poupado (R$):</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full border border-[#888] p-1.5 text-[13.5px] font-bold text-[#000000]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-black text-[#000000]">Data Limite:</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full border border-[#888] p-1.5 text-[13.5px] font-bold text-[#000000]"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2.5 border-t border-[#cccccc]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-[#888] text-[#000000] font-black rounded-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black rounded-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aporte Modal (Mobile & Touch Friendly) */}
      {aporteDream && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] p-5 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-gray-900">Aportar no Sonho</h3>
                <p className="text-xs text-gray-500 font-bold truncate max-w-[220px]">{aporteDream.title}</p>
              </div>
              <button
                onClick={() => setAporteDream(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAporte} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                  Valor do Aporte (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                  <input
                    type="text"
                    value={aporteAmount}
                    onChange={(e) => setAporteAmount(e.target.value)}
                    placeholder="100,00"
                    autoFocus
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#82af07]"
                    required
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAporteAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}
                    className="flex-1 py-1.5 px-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-black text-gray-700 cursor-pointer active:scale-95 transition-all"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAporteDream(null)}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-xl font-black text-sm text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#82af07] hover:bg-[#6e9406] active:scale-95 text-white rounded-xl font-black text-sm shadow-md cursor-pointer transition-all"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
