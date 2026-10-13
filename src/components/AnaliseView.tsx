import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatSignedAmount, formatDateShortYear, MONTH_NAMES_PT } from '../utils/formatters';
import { PieChart, TrendingUp, BarChart3, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AnaliseViewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: number;
  selectedYear: number;
  subType?: 'categorias' | 'evolucao' | 'fluxo';
  onSelectSubType?: (type: 'categorias' | 'evolucao' | 'fluxo') => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectMonthYear?: (year: number, month: number) => void;
}

const CATEGORY_COLORS = [
  '#82af07', '#00b4a6', '#0078d7', '#8e44ad', '#f39c12',
  '#d35400', '#c0392b', '#16a085', '#27ae60', '#2980b9',
  '#e67e22', '#7f8c8d'
];

export const AnaliseView: React.FC<AnaliseViewProps> = ({
  transactions,
  categories,
  selectedMonth,
  selectedYear,
  subType = 'categorias',
  onSelectSubType,
  onPrevMonth,
  onNextMonth,
  onSelectMonthYear,
}) => {
  const [currentTab, setCurrentTab] = useState<'categorias' | 'evolucao' | 'fluxo'>(subType);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  // Sync prop changes
  React.useEffect(() => {
    if (subType) {
      setCurrentTab(subType);
    }
  }, [subType]);

  const handleTabChange = (tab: 'categorias' | 'evolucao' | 'fluxo') => {
    setCurrentTab(tab);
    if (onSelectSubType) {
      onSelectSubType(tab);
    }
  };

  const now = new Date();
  const currentRealMonth = now.getMonth();
  const currentRealYear = now.getFullYear();
  const isCurrentMonth = selectedMonth === currentRealMonth && selectedYear === currentRealYear;
  const currentMonthLabel = `${MONTH_NAMES_PT[currentRealMonth]}/${currentRealYear}`;

  const availableYears = Array.from(new Set([
    selectedYear,
    currentRealYear - 1,
    currentRealYear,
    currentRealYear + 1,
  ])).sort((a, b) => a - b);

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES_PT[selectedMonth]}/${selectedYear}`;
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Transactions for the month (excluding internal transfers from pure income/expense)
  const currentTxs = transactions.filter(t => t.date.startsWith(monthKey));
  const expenses = currentTxs.filter(t => t.amount < 0 && t.type !== 'transferencia');
  const incomes = currentTxs.filter(t => t.amount > 0 && t.type !== 'transferencia');

  const totalExpense = expenses.reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
  const balanceResult = totalIncome - totalExpense;

  // Previous balance
  const previousTxs = transactions.filter(t => t.date < `${monthKey}-01`);
  const previousBalance = previousTxs.reduce((acc, t) => acc + t.amount, 0);

  // 1. Group by category
  const catExpenses: Record<string, number> = {};
  expenses.forEach(t => {
    catExpenses[t.category] = (catExpenses[t.category] || 0) + Math.abs(t.amount);
  });

  const sortedCategories = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);

  // 2. Daily balance evolution calculation
  let runningBal = previousBalance;
  const dailyEvolution = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayTxs = currentTxs.filter(t => t.date === dayStr);
    const dayInc = dayTxs.filter(t => t.amount > 0 && t.type !== 'transferencia').reduce((s, t) => s + t.amount, 0);
    const dayExp = dayTxs.filter(t => t.amount < 0 && t.type !== 'transferencia').reduce((s, t) => s + Math.abs(t.amount), 0);
    const dayNet = dayTxs.reduce((s, t) => s + t.amount, 0);
    runningBal += dayNet;
    return {
      day,
      dateStr: dayStr,
      balance: runningBal,
      income: dayInc,
      expense: dayExp,
      net: dayNet,
      hasActivity: dayTxs.length > 0,
    };
  });

  const evoBalances = dailyEvolution.map(d => d.balance);
  const minEvoBal = Math.min(...evoBalances, 0);
  const maxEvoBal = Math.max(...evoBalances, 0);
  const evoSpan = maxEvoBal - minEvoBal || 100;

  // Savings rate
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none space-y-4 text-[#000000]">
      {/* 1. Header with Month Navigator & Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#bbbbbb] flex-wrap gap-2">
        <div>
          <h2 className="text-[17px] font-black text-[#000000]">Relatórios e Análises</h2>
          <p className="text-[12.5px] text-[#555555] font-semibold">
            Visualização gráfica detalhada da evolução e distribuição das suas finanças.
          </p>
        </div>

        {/* Month Stepper */}
        {onPrevMonth && onNextMonth && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevMonth}
              className="w-7 h-7 flex items-center justify-center bg-[#f0f0f0] hover:bg-[#e4e4e4] border border-[#999] rounded-xs cursor-pointer text-[#000000] font-black text-[13px]"
              title="Mês anterior"
            >
              ◀
            </button>

            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-[#fbfbfb] hover:bg-white border border-[#888888] font-black text-[13.5px] text-[#000000] rounded-xs cursor-pointer"
              >
                <span>{monthLabel}</span>
                <span className="text-[11px] text-green-700 font-black">▼</span>
              </button>

              {monthDropdownOpen && onSelectMonthYear && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[#888888] shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                  {/* Shortcut to Current Month */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMonthYear(currentRealYear, currentRealMonth);
                      setMonthDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-black text-[#577708] bg-[#f1f6df] hover:bg-[#e4ecc4] border-b border-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ir para Mês Atual</span>
                    </span>
                    <span className="text-[10px] bg-[#82af07] text-white px-1.5 py-0.5 rounded font-bold">
                      {MONTH_NAMES_PT[currentRealMonth]}
                    </span>
                  </button>

                  {availableYears.map(yr => (
                    <div key={yr}>
                      <div className="px-3 py-1 font-bold text-[12px] bg-gray-100 text-[#000000]">{yr}</div>
                      {MONTH_NAMES_PT.map((m, idx) => (
                        <button
                          key={`${yr}-${idx}`}
                          onClick={() => {
                            onSelectMonthYear(yr, idx);
                            setMonthDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f1f6df] cursor-pointer text-[13px] font-bold ${
                            selectedMonth === idx && selectedYear === yr ? 'text-[#73a000] font-black bg-green-50' : 'text-[#000000]'
                          }`}
                        >
                          {m} / {yr}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onNextMonth}
              className="w-7 h-7 flex items-center justify-center bg-[#f0f0f0] hover:bg-[#e4e4e4] border border-[#999] rounded-xs cursor-pointer text-[#000000] font-black text-[13px]"
              title="Próximo mês"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#cccccc] pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleTabChange('categorias')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs font-black text-[13px] cursor-pointer transition-colors ${
            currentTab === 'categorias'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#333333]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Despesas por Categoria</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('evolucao')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs font-black text-[13px] cursor-pointer transition-colors ${
            currentTab === 'evolucao'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#333333]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Evolução do Saldo</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('fluxo')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs font-black text-[13px] cursor-pointer transition-colors ${
            currentTab === 'fluxo'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#333333]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Receitas x Despesas</span>
        </button>
      </div>

      {/* 3. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-[#b8b8b8] p-3 bg-[#fafafa]">
          <div className="text-[#666666] text-[11px] font-black uppercase tracking-wide">Total de Receitas</div>
          <div className="text-[20px] font-black text-green-700 mt-0.5 tabular-nums">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="border border-[#b8b8b8] p-3 bg-[#fafafa]">
          <div className="text-[#666666] text-[11px] font-black uppercase tracking-wide">Total de Despesas</div>
          <div className="text-[20px] font-black text-red-600 mt-0.5 tabular-nums">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="border border-[#b8b8b8] p-3 bg-[#fafafa]">
          <div className="text-[#666666] text-[11px] font-black uppercase tracking-wide">Resultado do Mês</div>
          <div className={`text-[20px] font-black mt-0.5 tabular-nums ${balanceResult >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatCurrency(balanceResult)}
          </div>
        </div>
      </div>

      {/* 4. TAB CONTENT 1: DESPESAS POR CATEGORIA */}
      {currentTab === 'categorias' && (
        <div className="border border-[#b8b8b8] bg-white p-4 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
            <h3 className="font-black text-[14.5px] text-[#000000]">
              Distribuição de Despesas por Categoria ({monthLabel})
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Total gasto: <strong className="text-red-700">{formatCurrency(totalExpense)}</strong>
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-12 text-center text-red-600 font-black text-[14px]">
              Sem dados de despesas durante este período
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart Visual */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                <svg viewBox="0 0 200 200" className="w-52 h-52">
                  {(() => {
                    let cumulativePercent = 0;
                    return sortedCategories.map(([cat, val], idx) => {
                      const percent = totalExpense > 0 ? val / totalExpense : 0;
                      const strokeDasharray = `${percent * 283} 283`;
                      const strokeDashoffset = `-${cumulativePercent * 283}`;
                      cumulativePercent += percent;
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      const isHovered = hoveredSlice === idx;

                      return (
                        <circle
                          key={cat}
                          cx="100"
                          cy="100"
                          r="45"
                          fill="transparent"
                          stroke={color}
                          strokeWidth={isHovered ? 26 : 22}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredSlice(idx)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  {hoveredSlice !== null && sortedCategories[hoveredSlice] ? (
                    <>
                      <span className="text-[11px] font-bold text-gray-600 truncate max-w-[120px]">
                        {sortedCategories[hoveredSlice][0]}
                      </span>
                      <span className="text-[14px] font-black text-black">
                        {formatCurrency(sortedCategories[hoveredSlice][1])}
                      </span>
                      <span className="text-[10px] font-black text-[#82af07]">
                        {Math.round((sortedCategories[hoveredSlice][1] / totalExpense) * 100)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total</span>
                      <span className="text-[13px] font-black text-black">
                        {formatCurrency(totalExpense)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Category Ranking Breakdown */}
              <div className="md:col-span-7 space-y-3">
                {sortedCategories.map(([cat, val], idx) => {
                  const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const isHovered = hoveredSlice === idx;

                  return (
                    <div
                      key={cat}
                      onMouseEnter={() => setHoveredSlice(idx)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isHovered ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex justify-between font-bold text-[13px] mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[#000000] font-black">{cat}</span>
                        </div>
                        <span className="tabular-nums font-black text-[#000000]">
                          {formatCurrency(val)} <span className="text-[#666666] font-bold">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: EVOLUÇÃO DO SALDO */}
      {currentTab === 'evolucao' && (
        <div className="border border-[#b8b8b8] bg-white p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
            <h3 className="font-black text-[14.5px] text-[#000000]">
              Evolução Diária do Saldo Acumulado ({monthLabel})
            </h3>
            <span className="text-xs font-bold text-gray-600">
              Saldo Inicial: {formatCurrency(previousBalance)} | Saldo Final: <strong className="text-black">{formatCurrency(runningBal)}</strong>
            </span>
          </div>

          {/* Interactive Chart Container */}
          <div className="relative pl-16 pr-2 pt-4 pb-8">
            {/* Y-axis markings */}
            <div className="absolute left-0 top-3 text-[11px] text-[#000000] font-black tabular-nums text-right w-14">
              {formatCurrency(maxEvoBal)}
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[11px] text-[#666666] font-bold tabular-nums text-right w-14">
              {formatCurrency((maxEvoBal + minEvoBal) / 2)}
            </div>
            <div className="absolute left-0 bottom-8 text-[11px] text-[#000000] font-black tabular-nums text-right w-14">
              {formatCurrency(minEvoBal)}
            </div>

            <div className="relative h-60 w-full border-l-2 border-b-2 border-[#555555] bg-white">
              {(() => {
                const svgW = 600;
                const svgH = 240;
                const coords = dailyEvolution.map((pt, idx) => {
                  const x = (idx / (daysInMonth - 1)) * svgW;
                  const y = svgH - 16 - ((pt.balance - minEvoBal) / evoSpan) * (svgH - 32);
                  return { ...pt, x, y };
                });

                const lineD = coords.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                const areaD = `${lineD} L ${coords[coords.length - 1].x} ${svgH} L ${coords[0].x} ${svgH} Z`;
                const activePt = hoveredDayIdx !== null ? coords[hoveredDayIdx] : null;

                return (
                  <>
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="w-full h-full overflow-visible cursor-crosshair"
                      preserveAspectRatio="none"
                      onMouseLeave={() => setHoveredDayIdx(null)}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        setHoveredDayIdx(Math.round(frac * (daysInMonth - 1)));
                      }}
                    >
                      <defs>
                        <linearGradient id="evoChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00b4a6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#00b4a6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Day Grid Lines */}
                      {coords
                        .filter((_, idx) => (idx + 1) % 5 === 0 || idx === 0 || idx === daysInMonth - 1)
                        .map((p, idx) => (
                          <line key={idx} x1={p.x} y1="0" x2={p.x} y2={svgH} stroke="#f0f0f0" strokeWidth="1" />
                        ))}
                      <line x1="0" y1={svgH / 2} x2={svgW} y2={svgH / 2} stroke="#f0f0f0" strokeWidth="1" />

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#evoChartGrad)" />

                      {/* Evolution Line */}
                      <path d={lineD} stroke="#00b4a6" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Data Dots */}
                      {coords.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={p.hasActivity ? 4.5 : 2}
                          fill={p.hasActivity ? '#ffffff' : '#00b4a6'}
                          stroke="#00b4a6"
                          strokeWidth="2"
                        />
                      ))}

                      {/* Hover Marker */}
                      {activePt && (
                        <g>
                          <line x1={activePt.x} y1="0" x2={activePt.x} y2={svgH} stroke="#111111" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={activePt.x} cy={activePt.y} r="6.5" fill="#111111" stroke="#ffffff" strokeWidth="3" />
                        </g>
                      )}
                    </svg>

                    {/* Tooltip */}
                    {activePt && (
                      <div
                        className="absolute -top-14 z-20 pointer-events-none bg-black/90 text-white text-[11.5px] px-3 py-2 rounded shadow-2xl whitespace-nowrap transform -translate-x-1/2"
                        style={{ left: `${(activePt.day - 1) / (daysInMonth - 1) * 100}%` }}
                      >
                        <div className="font-black text-amber-300">
                          Dia {activePt.day} ({formatDateShortYear(activePt.dateStr)})
                        </div>
                        <div className="font-bold">
                          Saldo: <span className="tabular-nums font-black text-white">{formatCurrency(activePt.balance)}</span>
                        </div>
                        {activePt.hasActivity && (
                          <div className="text-[10px] text-gray-200 mt-0.5">
                            Movimentação do dia: {formatSignedAmount(activePt.net)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* X-axis */}
            <div className="flex justify-between text-[11px] text-[#555555] font-black pt-1.5">
              <span>Dia 1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>{daysInMonth}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: RECEITAS X DESPESAS (FLUXO) */}
      {currentTab === 'fluxo' && (
        <div className="border border-[#b8b8b8] bg-white p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
            <h3 className="font-black text-[14.5px] text-[#000000]">
              Fluxo Comparativo: Receitas vs Despesas ({monthLabel})
            </h3>
            <span className="text-xs font-bold text-gray-600">
              Taxa de Poupança do Mês: <strong className="text-green-700">{savingsRate}%</strong>
            </span>
          </div>

          {/* Daily Bar Chart Comparison */}
          <div className="relative pt-2 pb-6">
            <div className="flex items-end gap-1.5 h-56 border-b-2 border-[#555555] bg-gray-50/50 p-2 overflow-x-auto">
              {dailyEvolution.map((pt) => {
                const maxBar = Math.max(totalIncome, totalExpense, 100);
                const incHeight = (pt.income / maxBar) * 190;
                const expHeight = (pt.expense / maxBar) * 190;

                return (
                  <div key={pt.day} className="flex-1 flex flex-col items-center justify-end h-full min-w-[12px] group relative">
                    <div className="flex items-end gap-0.5 h-full">
                      {pt.income > 0 && (
                        <div
                          className="w-2.5 bg-green-600 hover:bg-green-700 rounded-t-xs transition-all"
                          style={{ height: `${Math.max(4, incHeight)}px` }}
                          title={`Dia ${pt.day} - Receita: ${formatCurrency(pt.income)}`}
                        />
                      )}
                      {pt.expense > 0 && (
                        <div
                          className="w-2.5 bg-red-600 hover:bg-red-700 rounded-t-xs transition-all"
                          style={{ height: `${Math.max(4, expHeight)}px` }}
                          title={`Dia ${pt.day} - Despesa: ${formatCurrency(pt.expense)}`}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 mt-1">{pt.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-green-600 rounded-xs" />
                <span>Receitas (+ {formatCurrency(totalIncome)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-red-600 rounded-xs" />
                <span>Despesas (- {formatCurrency(totalExpense)})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
