import React, { useState } from 'react';
import { Account, Category, Transaction } from '../types';
import { formatDateWithWeekday, formatCurrency, formatSignedAmount, MONTH_NAMES_PT } from '../utils/formatters';
import { AddTransactionBar } from './AddTransactionBar';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LineChart,
  Plus,
  Trash2,
  Check,
  CheckCheck,
  FileDown,
  HelpCircle,
  Clock,
  Pencil,
  ChevronDown,
  Search,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  selectedAccountIds: string[];
  selectedCategoryNames: string[];
  searchQuery: string;
  onSetSearchQuery?: (query: string) => void;
  selectedMonth: number; // 0-11
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonthYear: (year: number, month: number) => void;
  onAddTransaction: (
    tx: Omit<Transaction, 'id'>,
    count?: number,
    options?: { isTotalAmount?: boolean }
  ) => void;
  onDeleteTransactions: (ids: string[]) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onToggleConsolidate: (id: string) => void;
  onBatchConsolidate: (ids: string[], status: boolean) => void;
  onBatchChangeCategory: (ids: string[], newCat: string) => void;
  onOpenExportModal: () => void;
  onSelectAllAccounts?: () => void;
  onOpenInstallmentModal?: () => void;
  onOpenChatModal?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  selectedAccountIds,
  selectedCategoryNames,
  searchQuery,
  onSetSearchQuery,
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onSelectMonthYear,
  onAddTransaction,
  onDeleteTransactions,
  onDeleteTransaction,
  onEditTransaction,
  onToggleConsolidate,
  onBatchConsolidate,
  onBatchChangeCategory,
  onOpenExportModal,
  onSelectAllAccounts,
  onOpenInstallmentModal,
  onOpenChatModal,
}) => {
  const [showAddBar, setShowAddBar] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'consolidated' | 'pending'>('all');
  const [mobileTypeFilter, setMobileTypeFilter] = useState<'all' | 'despesa' | 'receita'>('all');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [showQuickChart, setShowQuickChart] = useState(false);

  // Filter transactions
  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  
  const filteredTxs = transactions.filter((tx) => {
    // Month filter
    if (!tx.date.startsWith(monthStr)) return false;

    // Mobile type filter
    if (mobileTypeFilter === 'despesa' && tx.amount >= 0) return false;
    if (mobileTypeFilter === 'receita' && tx.amount <= 0) return false;

    // Accounts filter
    if (selectedAccountIds.length > 0) {
      const acc = accounts.find(a => a.name === tx.account);
      if (acc && !selectedAccountIds.includes(acc.id)) {
        return false;
      }
    }

    // Category filter
    if (selectedCategoryNames.length > 0) {
      if (!selectedCategoryNames.includes(tx.category)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'consolidated' && !tx.isConsolidated) return false;
    if (statusFilter === 'pending' && tx.isConsolidated) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchAcc = tx.account.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc && !matchNote) return false;
    }

    return true;
  });

  // Group by date
  const groupedByDate: Record<string, Transaction[]> = {};
  filteredTxs.forEach((tx) => {
    if (!groupedByDate[tx.date]) groupedByDate[tx.date] = [];
    groupedByDate[tx.date].push(tx);
  });

  const dates = Object.keys(groupedByDate).sort();

  // Calculate daily progressive balance
  let runningBalance = 0;
  const dailyBalances: Record<string, number> = {};
  dates.forEach((d) => {
    const dayTotal = groupedByDate[d].reduce((acc, t) => acc + t.amount, 0);
    runningBalance += dayTotal;
    dailyBalances[d] = runningBalance;
  });

  // Selection handlers
  const handleSelectAllTxs = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(filteredTxs.map(t => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleToggleSelectTx = (id: string) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleDayCollapse = (dateStr: string) => {
    setCollapsedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // Flattened categories for batch change
  const flatCategories: string[] = ['Sem Categoria'];
  categories.forEach(cat => {
    if (cat.name !== 'Sem Categoria') {
      flatCategories.push(cat.name);
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => flatCategories.push(sub));
      }
    }
  });

  const monthLabel = `${MONTH_NAMES_PT[selectedMonth]}/${selectedYear}`;

  const getCategoryIcon = (catName: string) => {
    const cat = (catName || '').toLowerCase();
    if (cat.includes('alim') || cat.includes('restaurante') || cat.includes('mercado') || cat.includes('supermercado') || cat.includes('padaria')) return '🍔';
    if (cat.includes('transp') || cat.includes('uber') || cat.includes('combust') || cat.includes('gasolina') || cat.includes('carro')) return '🚗';
    if (cat.includes('morad') || cat.includes('casa') || cat.includes('aluguel') || cat.includes('luz') || cat.includes('água') || cat.includes('condom')) return '🏠';
    if (cat.includes('saúde') || cat.includes('saude') || cat.includes('farm') || cat.includes('médic')) return '💊';
    if (cat.includes('educ') || cat.includes('curso') || cat.includes('escola') || cat.includes('faculd')) return '📚';
    if (cat.includes('lazer') || cat.includes('viagem') || cat.includes('cinema') || cat.includes('festa')) return '🎉';
    if (cat.includes('salário') || cat.includes('salario') || cat.includes('receit') || cat.includes('rend') || cat.includes('pix')) return '💰';
    if (cat.includes('transf')) return '🔁';
    if (cat.includes('invest') || cat.includes('poupança') || cat.includes('poupanca')) return '📈';
    return '🏷️';
  };

  const monthIncome = transactions
    .filter(t => t.date.startsWith(monthStr) && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = transactions
    .filter(t => t.date.startsWith(monthStr) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthNet = monthIncome - monthExpense;

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none text-[#000000]">
      {/* 1. MOBILE APP HEADER (Visible on md:hidden) */}
      <div className="md:hidden space-y-2.5 mb-3">
        {/* Month Stepper & Quick Action */}
        <div className="flex items-center justify-between gap-2 bg-gray-50/90 p-2 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevMonth}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-700 active:scale-95 shadow-2xs cursor-pointer"
              title="Mês anterior"
            >
              ◀
            </button>
            
            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-black text-xs text-gray-900 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>{monthLabel}</span>
                <span className="text-[10px] text-[#82af07]">▼</span>
              </button>
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-1 z-30 max-h-56 overflow-y-auto">
                  {[2026, 2027].map(yr => (
                    <div key={yr}>
                      <div className="px-3 py-1 font-bold text-xs bg-gray-100 text-gray-500">{yr}</div>
                      {MONTH_NAMES_PT.map((m, idx) => (
                        <button
                          key={`${yr}-${idx}`}
                          onClick={() => {
                            onSelectMonthYear(yr, idx);
                            setMonthDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-bold ${
                            selectedMonth === idx && selectedYear === yr ? 'text-[#82af07] bg-green-50' : 'text-gray-800 hover:bg-gray-50'
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
              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-700 active:scale-95 shadow-2xs cursor-pointer"
              title="Próximo mês"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                mobileSearchOpen || searchQuery ? 'bg-[#82af07] text-white border-[#82af07]' : 'bg-white border-gray-300 text-gray-600'
              }`}
              title="Buscar transação"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAddBar(!showAddBar)}
              className="px-3 py-1.5 bg-[#82af07] hover:bg-[#6e9406] active:scale-95 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Lançar</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Collapsible) */}
        {(mobileSearchOpen || searchQuery) && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSetSearchQuery && onSetSearchQuery(e.target.value)}
              placeholder="Buscar por descrição, conta, categoria..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#82af07]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSetSearchQuery && onSetSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Month Summary Bar */}
        <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-3 rounded-2xl shadow-xs">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">Entradas</span>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              +{formatCurrency(monthIncome)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">Saídas</span>
            <span className="text-xs font-black text-rose-400 tabular-nums">
              -{formatCurrency(monthExpense)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold block">Balanço</span>
            <span className={`text-xs font-black tabular-nums ${monthNet >= 0 ? 'text-white' : 'text-rose-300'}`}>
              {formatCurrency(monthNet)}
            </span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => {
              setMobileTypeFilter('all');
              setStatusFilter('all');
            }}
            className={`px-3 py-1 rounded-full font-black shrink-0 transition-colors cursor-pointer ${
              mobileTypeFilter === 'all' && statusFilter === 'all'
                ? 'bg-[#82af07] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({filteredTxs.length})
          </button>

          <button
            onClick={() => setMobileTypeFilter(mobileTypeFilter === 'despesa' ? 'all' : 'despesa')}
            className={`px-3 py-1 rounded-full font-black shrink-0 transition-colors cursor-pointer ${
              mobileTypeFilter === 'despesa'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Despesas
          </button>

          <button
            onClick={() => setMobileTypeFilter(mobileTypeFilter === 'receita' ? 'all' : 'receita')}
            className={`px-3 py-1 rounded-full font-black shrink-0 transition-colors cursor-pointer ${
              mobileTypeFilter === 'receita'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Receitas
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`px-3 py-1 rounded-full font-black shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pendentes
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'consolidated' ? 'all' : 'consolidated')}
            className={`px-3 py-1 rounded-full font-black shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'consolidated'
                ? 'bg-green-700 text-white shadow-2xs'
                : 'bg-green-50 text-green-800 hover:bg-green-100'
            }`}
          >
            Liquidadas
          </button>
        </div>
      </div>

      {/* 2. DESKTOP TOP NAV / DATE CONTROLS BAR (Visible on md: screens and up) */}
      <div className="hidden md:flex items-center justify-between py-2 border-b border-[#bbbbbb] mb-3 flex-wrap gap-2">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 flex items-center justify-center bg-[#f0f0f0] hover:bg-[#e4e4e4] border border-[#999] rounded-xs cursor-pointer text-[#000000] font-black text-[13px]"
            title="Mês anterior"
          >
            ◀
          </button>

          {/* Month Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#fbfbfb] hover:bg-white border border-[#888888] font-black text-[15px] text-[#000000] rounded-xs cursor-pointer"
            >
              <span>{monthLabel}</span>
              <span className="text-[12px] text-green-700 font-black">▼</span>
            </button>

            {monthDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[#888888] shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                {[2026, 2027].map(yr => (
                  <div key={yr}>
                    <div className="px-3 py-1 font-bold text-[12px] bg-gray-100 text-[#000000]">{yr}</div>
                    {MONTH_NAMES_PT.map((m, idx) => (
                      <button
                        key={`${yr}-${idx}`}
                        onClick={() => {
                          onSelectMonthYear(yr, idx);
                          setMonthDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f1f6df] cursor-pointer text-[13.5px] font-bold ${
                          selectedMonth === idx && selectedYear === yr ? 'text-[#73a000]' : 'text-[#000000]'
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

          {/* Filter preset dropdown: "Todas as transações ▾" */}
          <div className="ml-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-1.5 bg-white border border-[#888888] rounded-xs text-[13.5px] font-bold text-[#000000] focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as transações</option>
              <option value="consolidated">Somente consolidadas</option>
              <option value="pending">Somente pendentes</option>
            </select>
          </div>
        </div>

        {/* Right Action Icons (Filter & Chart) */}
        <div className="flex items-center gap-2">
          <span
            className="p-1.5 border border-[#999] bg-[#f9f9f9] rounded-xs text-[#000000] cursor-help"
            title="Filtros avançados: use o painel de Categorias e Contas à esquerda para refinar"
          >
            <Filter className="w-4 h-4" />
          </span>
          <button
            type="button"
            onClick={() => setShowQuickChart(!showQuickChart)}
            className={`p-1.5 border rounded-xs cursor-pointer transition-colors ${
              showQuickChart ? 'bg-[#555555] text-white border-[#333333]' : 'bg-[#f9f9f9] hover:bg-gray-200 text-[#000000] border-[#999]'
            }`}
            title="Visualização gráfica rápida do mês"
          >
            <LineChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Individual Account Active Banner */}
      {selectedAccountIds.length === 1 && (
        <div className="bg-[#f0f6e4] border border-[#a2cf24] px-3.5 py-2 mb-2 flex items-center justify-between text-xs text-[#2e4705] font-bold rounded-xs shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">📁</span>
            <span>
              Filtrando conta individual: <strong className="text-black text-sm">{accounts.find(a => a.id === selectedAccountIds[0])?.name}</strong> (Saldo: {formatCurrency(accounts.find(a => a.id === selectedAccountIds[0])?.balance ?? 0)})
            </span>
          </div>
          {onSelectAllAccounts && (
            <button
              type="button"
              onClick={onSelectAllAccounts}
              className="underline hover:text-black font-extrabold cursor-pointer ml-3 shrink-0"
            >
              Ver todas as contas
            </button>
          )}
        </div>
      )}

      {/* In-table batch delete confirmation */}
      {showBatchDeleteConfirm && selectedTxIds.length > 0 && (
        <div className="bg-red-50 border border-red-300 p-2.5 mb-2 flex items-center justify-between text-xs text-red-900 font-bold rounded-xs">
          <span>Excluir permanentemente {selectedTxIds.length} transação(ões) selecionada(s)?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="px-2.5 py-1 bg-white border border-gray-400 text-black cursor-pointer rounded-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteTransactions(selectedTxIds);
                setSelectedTxIds([]);
                setShowBatchDeleteConfirm(false);
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer rounded-xs"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      )}

      {/* 2. TABLE TOOLBAR (Adicionar, Delete, Consolidate, Export) */}
      <div className="hidden md:flex items-center justify-between bg-[#f5f5f5] p-2.5 border border-[#b0b0b0] mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* "+ Adicionar transação" dark button */}
          <button
            type="button"
            onClick={() => setShowAddBar(!showAddBar)}
            className="flex items-center gap-1.5 bg-[#111111] hover:bg-[#000000] text-white px-4 py-1.5 rounded-xs font-bold text-[13.5px] cursor-pointer shadow-xs active:translate-y-px"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar transação</span>
          </button>

          {/* Delete Selected (✕) */}
          <button
            onClick={() => {
              if (selectedTxIds.length > 0) {
                setShowBatchDeleteConfirm(true);
              }
            }}
            disabled={selectedTxIds.length === 0}
            className={`w-8 h-8 flex items-center justify-center border border-[#999] rounded-xs cursor-pointer text-[14px] font-black ${
              selectedTxIds.length > 0 ? 'bg-white hover:bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Excluir selecionadas"
          >
            ✕
          </button>

          {/* Consolidate Selected (✓) */}
          <button
            onClick={() => {
              if (selectedTxIds.length > 0) {
                onBatchConsolidate(selectedTxIds, true);
              }
            }}
            disabled={selectedTxIds.length === 0}
            className={`w-8 h-8 flex items-center justify-center border border-[#999] rounded-xs cursor-pointer text-[14px] font-black ${
              selectedTxIds.length > 0 ? 'bg-white hover:bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Marcar como consolidadas"
          >
            ✓
          </button>

          {/* Desconsolidar Selected (✓/) */}
          <button
            onClick={() => {
              if (selectedTxIds.length > 0) {
                onBatchConsolidate(selectedTxIds, false);
              }
            }}
            disabled={selectedTxIds.length === 0}
            className={`w-8 h-8 flex items-center justify-center border border-[#999] rounded-xs cursor-pointer text-[14px] font-black ${
              selectedTxIds.length > 0 ? 'bg-white hover:bg-yellow-50 text-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Marcar como não consolidadas"
          >
            <span className="line-through">✓</span>
          </button>

          {/* Alterar Categoria Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              disabled={selectedTxIds.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 border border-[#999] rounded-xs text-[13px] font-bold cursor-pointer ${
                selectedTxIds.length > 0 ? 'bg-white hover:bg-gray-50 text-[#000000]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Alterar categoria</span>
              <span className="text-[11px]">▼</span>
            </button>

            {categoryDropdownOpen && selectedTxIds.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#777] shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                {flatCategories.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onBatchChangeCategory(selectedTxIds, c);
                      setCategoryDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-[#f1f6df] text-[13px] font-bold text-[#000000] cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exportar Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#dadada] text-[#000000] font-black rounded-xs text-[13px] cursor-pointer active:translate-y-px"
          >
            <FileDown className="w-4 h-4 text-black" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Right Help Tooltip */}
        <span
          className="w-7 h-7 flex items-center justify-center border border-[#999] bg-[#fbfbfb] text-[#000000] font-black rounded-xs cursor-help text-[12px] select-none"
          title="Dica: selecione transações para editar em lote ou alterar categoria, ou clique em ✓ para consolidar."
        >
          ?
        </span>
      </div>

      {/* 3. INLINE ADD TRANSACTION BAR */}
      {showAddBar && (
        <AddTransactionBar
          accounts={accounts}
          categories={categories}
          currentDateStr={(() => {
            const now = new Date();
            const day = now.getFullYear() === selectedYear && now.getMonth() === selectedMonth
              ? String(now.getDate()).padStart(2, '0')
              : '01';
            return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${day}`;
          })()}
          onSave={(newTx, count, options) => {
            onAddTransaction(newTx, count, options);
            setShowAddBar(false);
          }}
          onCancel={() => setShowAddBar(false)}
        />
      )}

      {/* Quick Monthly Interactive Chart Panel */}
      {showQuickChart && (
        <div className="bg-[#fafafa] border border-[#b0b0b0] p-3.5 mb-3 rounded-xs shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-[#cccccc] pb-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-[#73a000]" />
              <span className="font-black text-[13.5px] text-[#000000]">
                Evolução do Saldo do Mês ({monthLabel})
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-[#15803d]">Entradas: {formatCurrency(monthIncome)}</span>
              <span className="text-[#dc2626]">Saídas: {formatCurrency(monthExpense)}</span>
              <span className={`font-black ${monthNet >= 0 ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>
                Resultado: {formatCurrency(monthNet)}
              </span>
              <button
                type="button"
                onClick={() => setShowQuickChart(false)}
                className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-black font-black cursor-pointer ml-2"
                title="Fechar gráfico"
              >
                ✕
              </button>
            </div>
          </div>

          {/* SVG Line Evolution */}
          {dates.length === 0 ? (
            <div className="py-6 text-center text-gray-500 font-bold text-xs">
              Sem lançamentos no período para gerar o gráfico de evolução.
            </div>
          ) : (() => {
            const balances = dates.map(d => dailyBalances[d] ?? 0);
            const minBal = Math.min(...balances, 0);
            const maxBal = Math.max(...balances, 0);
            const range = maxBal - minBal || 100;
            const h = 120;
            const w = 800;
            const pts = dates.map((d, idx) => {
              const x = dates.length > 1 ? (idx / (dates.length - 1)) * (w - 40) + 20 : w / 2;
              const y = h - 20 - (((dailyBalances[d] ?? 0) - minBal) / range) * (h - 40);
              return { x, y, date: d, bal: dailyBalances[d] ?? 0 };
            });
            const pathD = pts.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
            const areaD = `${pathD} L ${pts[pts.length - 1].x} ${h - 10} L ${pts[0].x} ${h - 10} Z`;

            return (
              <div className="relative pt-1">
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 overflow-visible">
                  <defs>
                    <linearGradient id="quickChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00b4a6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00b4a6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid line at bottom */}
                  <line x1="20" y1={h - 10} x2={w - 20} y2={h - 10} stroke="#e0e0e0" strokeWidth="1" />
                  {/* Area fill */}
                  <path d={areaD} fill="url(#quickChartGrad)" />
                  {/* Line */}
                  <path d={pathD} stroke="#00b4a6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dot markers */}
                  {pts.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#00b4a6" strokeWidth="2.5" />
                      <text x={p.x} y={h - 1} textAnchor="middle" fontSize="9" fill="#666666" fontWeight="bold">
                        {p.date.split('-')[2]}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className="flex justify-between text-[11px] font-bold text-gray-500 pt-1">
                  <span>Mínimo: {formatCurrency(minBal)}</span>
                  <span>Máximo: {formatCurrency(maxBal)}</span>
                  <span>Saldo Acumulado: {formatCurrency(runningBalance)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. MOBILE TRANSACTIONS FEED (Visible on mobile/tablet < md screens) */}
      <div className="md:hidden space-y-3">
        {dates.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <div className="text-3xl mb-2">🧾</div>
            <div className="text-black font-black text-[15px]">Nenhuma transação encontrada</div>
            <p className="text-gray-500 text-[12.5px] mt-1 mb-3">Nenhum lançamento no período filtrado.</p>
            <button
              onClick={() => setShowAddBar(true)}
              className="px-4 py-2 bg-[#82af07] hover:bg-[#6e9406] text-white font-black text-xs rounded-lg shadow-xs cursor-pointer"
            >
              + Adicionar Transação
            </button>
          </div>
        ) : (
          dates.map((dateStr) => {
            const dayTxs = groupedByDate[dateStr];
            const dayProgressiveBalance = dailyBalances[dateStr] ?? 0;

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Day Header Pill */}
                <div className="bg-gray-100/90 px-3 py-1.5 rounded-xl flex items-center justify-between text-[12px] font-black text-gray-700 shadow-2xs">
                  <span>{formatDateWithWeekday(dateStr)}</span>
                  <span className="text-gray-900 font-extrabold tabular-nums">
                    Saldo: {formatCurrency(dayProgressiveBalance)}
                  </span>
                </div>

                {/* Day Transactions List */}
                <div className="space-y-1.5">
                  {dayTxs.map((tx) => {
                    const isSelected = selectedTxIds.includes(tx.id);
                    const isNegative = tx.amount < 0;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onEditTransaction(tx)}
                        className={`p-3 bg-white rounded-xl border transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                          isSelected ? 'border-[#82af07] bg-[#fbfdf7]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Left: Category Icon Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                          isNegative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {getCategoryIcon(tx.category)}
                        </div>

                        {/* Center: Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[14px] text-gray-950 truncate leading-snug">
                              {tx.description}
                            </span>
                            {(tx.installmentNumber || tx.recurrenceText) && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#f1f6df] text-[#4d7207] border border-[#c8e278] rounded-xs shrink-0 flex items-center gap-0.5">
                                💳 {tx.installmentNumber && tx.totalInstallments ? `${tx.installmentNumber}/${tx.totalInstallments}` : tx.recurrenceText}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                              {tx.category}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 truncate max-w-[110px]">
                              {tx.account}
                            </span>
                          </div>
                        </div>

                        {/* Right: Amount & Status Check */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <div className={`font-black text-[14.5px] tabular-nums ${
                            isNegative ? 'text-red-600' : 'text-emerald-700'
                          }`}>
                            {formatSignedAmount(tx.amount)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleConsolidate(tx.id);
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                              tx.isConsolidated
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            title="Toque para alternar status liquidado"
                          >
                            {tx.isConsolidated ? (
                              <CheckCheck className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <span className="w-2.5 h-2.5 inline-block rounded-full border border-gray-400" />
                            )}
                            <span>{tx.isConsolidated ? 'Liquidado' : 'Pendente'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DESKTOP MAIN TRANSACTIONS TABLE */}
      <div className="hidden md:block border border-[#b8b8b8] bg-white overflow-x-auto shadow-xs">
        <div className="min-w-[680px]">
        {/* Table Header Columns */}
        <div className="flex items-center bg-[#eeeeee] border-b border-[#cccccc] px-3 py-2 font-black text-[#000000] text-[14px]">
          <div className="w-6 flex items-center justify-center">
            <input
              type="checkbox"
              checked={filteredTxs.length > 0 && selectedTxIds.length === filteredTxs.length}
              onChange={(e) => handleSelectAllTxs(e.target.checked)}
              className="accent-[#73a000] cursor-pointer w-4 h-4"
            />
          </div>
          <div className="flex-1 px-3 font-black">Descrição</div>
          <div className="w-[195px] px-3 font-black">Categoria</div>
          <div className="w-[165px] px-3 font-black">Conta</div>
          <div className="w-[145px] px-3 text-right font-black">Valor (R$)</div>
          <div className="w-10 px-1 text-center font-black" title="Status de consolidação">C</div>
        </div>

        {/* Global Summary Row: "[-] Todos | Saldo no dia 31/10/2026 R$ 0,00 [x]" */}
        <div className="flex items-center justify-between bg-[#edf3f8] border-b border-[#b8cce0] px-3 py-2 font-bold text-[#000000]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllCollapsed(!allCollapsed)}
              className="w-4 h-4 flex items-center justify-center border border-[#777] bg-white text-[11px] font-black text-[#000000] cursor-pointer leading-none"
            >
              {allCollapsed ? '+' : '-'}
            </button>
            <span className="text-[14px] font-black text-[#000000]">Todos</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-[14px] font-bold text-[#000000]">
              Saldo no dia 31/{String(selectedMonth === 0 ? 12 : selectedMonth).padStart(2, '0')}/{selectedMonth === 0 ? selectedYear - 1 : selectedYear}
              <span className="ml-3 tabular-nums font-black text-[#000000]">R$ 0,00</span>
            </div>
            <input
              type="checkbox"
              checked={filteredTxs.length > 0 && selectedTxIds.length === filteredTxs.length}
              onChange={(e) => handleSelectAllTxs(e.target.checked)}
              className="accent-[#73a000] cursor-pointer w-4 h-4"
            />
          </div>
        </div>

        {/* Empty State */}
        {dates.length === 0 && (
          <div className="p-8 text-center text-red-600 font-black text-[15px]">
            Nenhuma transação encontrada neste período.
          </div>
        )}

        {/* Grouped Day Rows */}
        {!allCollapsed && dates.map((dateStr) => {
          const dayTxs = groupedByDate[dateStr];
          const isDayCollapsed = collapsedDays[dateStr];
          const dayProgressiveBalance = dailyBalances[dateStr] ?? 0;

          return (
            <div key={dateStr} className="border-b border-[#cccccc]">
              {/* Day Header */}
              <div
                className="flex items-center gap-2.5 bg-[#f6f6f6] hover:bg-[#ededed] px-3 py-2 border-b border-[#dcdcdc] cursor-pointer transition-colors"
                onClick={() => toggleDayCollapse(dateStr)}
              >
                <button
                  type="button"
                  className="w-4 h-4 flex items-center justify-center border border-[#888] bg-white text-[11px] font-black text-[#000000] leading-none"
                >
                  {isDayCollapsed ? '+' : '-'}
                </button>
                <span className="font-black text-[#000000] text-[14px]">
                  {formatDateWithWeekday(dateStr)}
                </span>
              </div>

              {/* Transactions in Day */}
              {!isDayCollapsed && (
                <div>
                  {dayTxs.map((tx) => {
                    const isSelected = selectedTxIds.includes(tx.id);
                    const isNegative = tx.amount < 0;

                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center px-3 py-2 border-b border-gray-200 last:border-b-0 text-[14px] hover:bg-[#f4fae6] transition-colors group ${
                          isSelected ? 'bg-[#edf6d8]' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="w-6 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectTx(tx.id)}
                            className="accent-[#73a000] cursor-pointer w-4 h-4"
                          />
                        </div>

                        {/* Description */}
                        <div
                          className="flex-1 px-3 font-bold text-[#000000] truncate flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => onEditTransaction(tx)}
                          title="Clique para editar transação"
                        >
                          <span className="truncate">{tx.description}</span>
                          {(tx.installmentNumber || tx.recurrenceText) && (
                            <span className="text-[11px] text-[#3b6002] bg-[#f1f6df] border border-[#c8e278] px-1.5 py-0.5 rounded-xs font-black flex items-center gap-1 shrink-0">
                              💳 {tx.installmentNumber && tx.totalInstallments ? `${tx.installmentNumber}/${tx.totalInstallments}` : tx.recurrenceText}
                            </span>
                          )}
                        </div>

                        {/* Category */}
                        <div className="w-[195px] px-3 text-[#000000] font-semibold truncate flex items-center gap-1.5">
                          {tx.isRecurring && (
                            <span className="text-[#000000] text-[12px] font-bold" title="Transação recorrente">
                              🕒
                            </span>
                          )}
                          <span className="truncate">{tx.category}</span>
                        </div>

                        {/* Account */}
                        <div className="w-[165px] px-3 text-[#000000] font-bold truncate">
                          {tx.account}
                        </div>

                        {/* Amount & Action Buttons */}
                        <div className="w-[145px] px-3 flex items-center justify-end gap-2">
                          <span
                            className={`font-black tabular-nums text-[14.5px] ${
                              isNegative ? 'text-[#dc2626]' : 'text-[#15803d]'
                            }`}
                          >
                            {formatSignedAmount(tx.amount)}
                          </span>

                          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTransaction(tx);
                              }}
                              className="text-black hover:text-green-700 p-0.5 cursor-pointer text-[13px] font-black"
                              title="Editar transação"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(tx.id);
                              }}
                              className="text-black hover:text-red-700 p-0.5 cursor-pointer text-[13px] font-black"
                              title="Excluir transação"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Status Checkmark (C) */}
                        <div className="w-10 px-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onToggleConsolidate(tx.id)}
                            className="cursor-pointer hover:opacity-80 p-0.5"
                            title={tx.isConsolidated ? 'Consolidada (clique para desmarcar)' : 'Pendente (clique para consolidar)'}
                          >
                            {tx.isConsolidated ? (
                              <CheckCheck className="w-4.5 h-4.5 text-[#000000] stroke-[3]" />
                            ) : (
                              <span className="text-[#666666] text-[14px] font-black">○</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Daily Subtotal: Dashed Line & Saldo do dia */}
                  <div className="border-t-2 border-dashed border-[#888888] px-4 py-2 flex items-center justify-end gap-10 bg-[#fafafa]">
                    <span className="font-black text-[#000000] text-[14px]">Saldo do dia</span>
                    <span className="font-black text-[#000000] tabular-nums text-[14.5px]">
                      {formatCurrency(dayProgressiveBalance)}
                    </span>
                    <div className="w-10" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
