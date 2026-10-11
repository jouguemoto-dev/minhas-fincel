import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { formatCurrency, MONTH_NAMES_PT } from '../utils/formatters';

interface OrcamentoViewProps {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
}

export const OrcamentoView: React.FC<OrcamentoViewProps> = ({
  categories,
  transactions,
  selectedMonth,
  selectedYear,
}) => {
  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES_PT[selectedMonth]}/${selectedYear}`;

  // Default budgeted amounts per category
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({
    'Alimentação': 1200,
    'Casa': 1500,
    'Educação': 800,
    'Saúde': 600,
    'Transporte': 500,
    'Lazer': 400,
    'Gastos Pessoais': 300,
  });

  // Calculate actual expenses for month
  const spentMap: Record<string, number> = {};
  transactions
    .filter(t => t.date.startsWith(monthKey) && t.amount < 0 && t.type !== 'transferencia')
    .forEach(t => {
      spentMap[t.category] = (spentMap[t.category] || 0) + Math.abs(t.amount);
    });

  const expenseCategories = categories.filter(c => c.type === 'despesa' && c.name !== 'Sem Categoria' && c.name !== 'Transferência');

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none space-y-4 text-[#000000]">
      <div className="flex items-center justify-between pb-2 border-b border-[#bbbbbb]">
        <div>
          <h2 className="text-[16px] font-black text-[#000000]">Orçamento Mensal - {monthLabel}</h2>
          <p className="text-[13px] text-[#000000] font-bold">
            Defina limites de gastos para cada categoria e evite surpresas no fim do mês.
          </p>
        </div>
      </div>

      {/* Mobile Budget Cards Feed (Visible on md:hidden) */}
      <div className="md:hidden space-y-3">
        {/* Month Summary Card */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold mb-1">
            <span>Orçamento Geral</span>
            <span>{monthLabel}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-xs text-gray-400 block">Total Gasto</span>
              <span className="text-xl font-black text-rose-300">
                {formatCurrency(Object.values(spentMap).reduce((a, b) => a + b, 0))}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Planejado</span>
              <span className="text-xl font-black text-white">
                {formatCurrency(Object.values(budgetMap).reduce((a, b) => a + b, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Category Budget Cards */}
        {expenseCategories.map(cat => {
          const budgeted = budgetMap[cat.name] || 0;
          const spent = spentMap[cat.name] || 0;
          const diff = budgeted - spent;
          const percent = budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : (spent > 0 ? 100 : 0);
          const isOver = spent > budgeted && budgeted > 0;

          return (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-gray-950 truncate">{cat.name}</span>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  isOver ? 'bg-red-100 text-red-800' : percent > 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {percent}% {isOver ? 'Excedido' : 'Utilizado'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-[#82af07]'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Numbers grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-[10.5px] font-bold text-gray-400 block">Planejado</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-bold text-gray-500 text-[11px]">R$</span>
                    <input
                      type="number"
                      value={budgetMap[cat.name] || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBudgetMap(prev => ({ ...prev, [cat.name]: val }));
                      }}
                      className="w-full font-black text-gray-900 border border-gray-200 rounded px-1 py-0.5 text-xs bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-gray-400 block">Gasto</span>
                  <span className="font-black text-gray-950 text-xs mt-1 block tabular-nums">
                    {formatCurrency(spent)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10.5px] font-bold text-gray-400 block">{diff < 0 ? 'Excedente' : 'Restante'}</span>
                  <span className={`font-black text-xs mt-1 block tabular-nums ${diff < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatCurrency(Math.abs(diff))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Budget Table (Visible on md: screens and above) */}
      <div className="hidden md:block border border-[#b8b8b8] bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left text-[14px] border-collapse">
          <thead>
            <tr className="bg-[#e8e8e8] border-b border-[#b8b8b8] font-black text-[#000000]">
              <th className="p-2.5 font-black">Categoria</th>
              <th className="p-2.5 text-right font-black">Planejado (R$)</th>
              <th className="p-2.5 text-right font-black">Realizado (R$)</th>
              <th className="p-2.5 text-right font-black">Diferença (R$)</th>
              <th className="p-2.5 w-48 text-center font-black">% Utilizado</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map(cat => {
              const budgeted = budgetMap[cat.name] || 0;
              const spent = spentMap[cat.name] || 0;
              const diff = budgeted - spent;
              const percent = budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : (spent > 0 ? 100 : 0);
              const isOver = spent > budgeted && budgeted > 0;

              return (
                <tr key={cat.id} className="border-b border-gray-200 hover:bg-[#f9fdf2]">
                  <td className="p-2.5 font-bold text-[#000000]">{cat.name}</td>
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      value={budgetMap[cat.name] || ''}
                      placeholder="0,00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBudgetMap(prev => ({ ...prev, [cat.name]: val }));
                      }}
                      className="w-28 text-right border border-[#888888] px-1.5 py-1 text-[13.5px] font-black text-[#000000] rounded-xs"
                    />
                  </td>
                  <td className="p-2.5 text-right font-black text-[#000000] tabular-nums">
                    {formatCurrency(spent)}
                  </td>
                  <td className={`p-2.5 text-right font-black tabular-nums ${diff < 0 ? 'text-red-700' : 'text-green-800'}`}>
                    {formatCurrency(diff)}
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isOver ? 'bg-red-600' : 'bg-[#82af07]'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[12px] text-[#000000] font-black">{percent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
