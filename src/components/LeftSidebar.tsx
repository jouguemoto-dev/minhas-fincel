import React, { useState } from 'react';
import { Account, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Minus, Plus, HelpCircle, CheckSquare, Square, Search } from 'lucide-react';

interface LeftSidebarProps {
  activeTab: string;
  accounts: Account[];
  categories: Category[];
  selectedAccountIds: string[];
  onToggleAccount: (id: string) => void;
  onSelectIndividualAccount: (id: string) => void;
  onClearAccounts: () => void;
  onSelectAllAccounts: () => void;
  onOpenNewAccountModal: () => void;
  onOpenNewCreditCardModal?: () => void;
  onEditAccount: (account: Account) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  onToggleCategory: (categoryName: string) => void;
  onOpenNewCategoryModal: () => void;
  onEditCategory: (category: Category) => void;
  totalCurrentBalance: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  accounts,
  categories,
  selectedAccountIds,
  onToggleAccount,
  onSelectIndividualAccount,
  onClearAccounts,
  onSelectAllAccounts,
  onOpenNewAccountModal,
  onOpenNewCreditCardModal,
  onEditAccount,
  searchQuery,
  setSearchQuery,
  selectedCategories,
  onToggleCategory,
  onOpenNewCategoryModal,
  onEditCategory,
  totalCurrentBalance,
}) => {
  // Panel collapses
  const [contasOpen, setContasOpen] = useState(true);
  const [buscaOpen, setBuscaOpen] = useState(true);
  const [categoriasOpen, setCategoriasOpen] = useState(true);

  // Expanded categories in tree
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    alim: false,
    casa: false,
    educ: false,
    rec: false,
  });

  const toggleCategoryExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <aside className="w-full lg:w-[268px] shrink-0 space-y-4 text-[14px] text-[#000000] select-none font-sans">
      {/* 1. CONTAS PANEL */}
      <div className="bg-white border border-[#b8b8b8] shadow-xs">
        {/* Panel Header */}
        <div className="bg-[#eeeeee] border-b border-[#cccccc] px-3 py-2 flex items-center justify-between">
          <span className="font-bold text-[14.5px] text-[#000000]">Contas</span>
          <div className="flex items-center gap-1.5 text-[#000000]">
            <button
              onClick={() => setContasOpen(!contasOpen)}
              className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] hover:bg-gray-200 cursor-pointer text-[12px] font-black leading-none"
              title={contasOpen ? 'Recolher' : 'Expandir'}
            >
              {contasOpen ? '-' : '+'}
            </button>
            <span
              className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] text-[12px] font-bold leading-none cursor-help select-none"
              title="Selecione as contas desejadas para filtrar as transações. O saldo atual é calculado com base nas transações consolidadas."
            >
              ?
            </span>
          </div>
        </div>

        {contasOpen && (
          <div className="p-3 space-y-2">
            <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1.5">
              {accounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between hover:bg-[#f2f2f2] px-1.5 py-1 rounded group transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[155px]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleAccount(acc.id)}
                        className="w-4 h-4 accent-[#73a000] cursor-pointer"
                        title="Marcar/desmarcar conta"
                      />
                      <button
                        type="button"
                        onClick={() => onSelectIndividualAccount(acc.id)}
                        className={`truncate text-left font-bold text-[13.5px] cursor-pointer transition-colors ${
                          selectedAccountIds.length === 1 && selectedAccountIds[0] === acc.id
                            ? 'text-[#527800] underline'
                            : 'text-[#000000] hover:text-[#527800]'
                        }`}
                        title="Ver apenas esta conta individual"
                      >
                        {acc.name}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#000000] tabular-nums whitespace-nowrap ml-1 text-[13.5px]">
                        {formatCurrency(acc.balance)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIndividualAccount(acc.id);
                        }}
                        className="text-[10.5px] uppercase font-bold text-[#555] hover:text-white hover:bg-[#73a000] px-1 py-0.5 rounded border border-[#ccc] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Filtrar individualmente"
                      >
                        Só
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAccount(acc);
                        }}
                        className="text-black hover:text-green-700 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[12px] font-bold"
                        title="Editar ou excluir conta"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Saldo Atual Total */}
            <div className="pt-2.5 border-t-2 border-[#bbbbbb] flex items-center justify-between font-black text-[14.5px] px-1 text-[#000000]">
              <span>Saldo atual</span>
              <span className="tabular-nums text-[#000000] font-black">{formatCurrency(totalCurrentBalance)}</span>
            </div>

            {/* Bottom Buttons */}
            <div className="pt-2 flex items-center justify-between gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={selectedAccountIds.length > 0 ? onClearAccounts : onSelectAllAccounts}
                className="px-2.5 py-1.5 border border-[#999999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#d0d0d0] text-[#000000] font-bold rounded-xs cursor-pointer text-[12px] active:translate-y-px"
              >
                {selectedAccountIds.length > 0 ? 'Limpar' : 'Marcar todas'}
              </button>
              <div className="flex items-center gap-1.5">
                {onOpenNewCreditCardModal && (
                  <button
                    type="button"
                    onClick={onOpenNewCreditCardModal}
                    className="px-2 py-1.5 border border-[#999999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#d0d0d0] text-[#5a8710] font-bold rounded-xs cursor-pointer text-[12px] active:translate-y-px flex items-center gap-1"
                    title="Cadastrar Cartão de Crédito"
                  >
                    💳 Cartão
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenNewAccountModal}
                  className="px-2.5 py-1.5 border border-[#999999] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#d0d0d0] text-[#000000] font-bold rounded-xs cursor-pointer text-[12px] active:translate-y-px"
                >
                  Nova conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. TRANSAÇÕES VIEW CONTEXTUAL PANELS */}
      {activeTab === 'transacoes' && (
        <>
          {/* Busca Rápida Panel */}
          <div className="bg-white border border-[#b8b8b8] shadow-xs">
            <div className="bg-[#eeeeee] border-b border-[#cccccc] px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-[14.5px] text-[#000000]">Busca rápida</span>
              <div className="flex items-center gap-1.5 text-[#000000]">
                <button
                  onClick={() => setBuscaOpen(!buscaOpen)}
                  className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] hover:bg-gray-200 cursor-pointer text-[12px] font-black leading-none"
                >
                  {buscaOpen ? '-' : '+'}
                </button>
                <span
                  className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] text-[12px] font-bold leading-none cursor-help select-none"
                  title="Digite qualquer termo para filtrar por descrição ou observação das transações."
                >
                  ?
                </span>
              </div>
            </div>
            {buscaOpen && (
              <div className="p-3 space-y-2.5">
                <input
                  type="text"
                  placeholder="Texto da busca"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-[#888888] text-[13.5px] font-bold text-[#000000] focus:outline-none focus:border-[#73a000] bg-white"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="px-4 py-1.5 border border-[#888888] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] hover:to-[#d0d0d0] text-[#000000] font-black rounded-xs cursor-pointer text-[13px] active:translate-y-px"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Categorias Tree Panel */}
          <div className="bg-white border border-[#b8b8b8] shadow-xs">
            <div className="bg-[#eeeeee] border-b border-[#cccccc] px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-[14.5px] text-[#000000]">Categorias</span>
              <div className="flex items-center gap-1.5 text-[#000000]">
                <button
                  type="button"
                  onClick={onOpenNewCategoryModal}
                  className="px-2.5 py-1 border border-[#777] bg-[#ffffff] hover:bg-gray-200 cursor-pointer text-[11.5px] font-black text-[#2e4705]"
                  title="Criar nova categoria"
                >
                  + Nova
                </button>
                <button
                  onClick={() => setCategoriasOpen(!categoriasOpen)}
                  className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] hover:bg-gray-200 cursor-pointer text-[12px] font-black leading-none"
                >
                  {categoriasOpen ? '-' : '+'}
                </button>
                <span
                  className="w-5 h-5 flex items-center justify-center border border-[#999] bg-[#ffffff] text-[12px] font-bold leading-none cursor-help select-none"
                  title="Filtre suas transações clicando nas categorias desejadas."
                >
                  ?
                </span>
              </div>
            </div>

            {categoriasOpen && (
              <div className="p-3 max-h-[400px] overflow-y-auto space-y-1.5 text-[13.5px]">
                {categories.map((cat) => {
                  const hasSub = cat.subcategories && cat.subcategories.length > 0;
                  const isExpanded = expandedCats[cat.id];
                  const isCatSelected = selectedCategories.includes(cat.name);

                  return (
                    <div key={cat.id} className="space-y-1 group">
                      <div className="flex items-center gap-2 hover:bg-[#f2f2f2] py-1 px-1 rounded cursor-pointer transition-colors">
                        {hasSub ? (
                          <button
                            type="button"
                            onClick={(e) => toggleCategoryExpand(cat.id, e)}
                            className="w-4 h-4 flex items-center justify-center border border-[#888] bg-white text-[11px] font-extrabold text-[#000] leading-none cursor-pointer"
                          >
                            {isExpanded ? '-' : '+'}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}

                        <input
                          type="checkbox"
                          checked={isCatSelected}
                          onChange={() => onToggleCategory(cat.name)}
                          className="w-4 h-4 accent-[#73a000] cursor-pointer"
                        />
                        <span
                          onClick={() => onToggleCategory(cat.name)}
                          className="text-[#000000] font-bold truncate flex-1 hover:text-black text-[13.5px]"
                        >
                          {cat.name}
                        </span>

                        {cat.name !== 'Sem Categoria' && cat.name !== 'Transferência' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCategory(cat);
                            }}
                            className="text-black hover:text-green-700 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[12px] font-bold"
                            title="Editar ou excluir categoria"
                          >
                            ✎
                          </button>
                        )}
                      </div>

                      {/* Subcategories list */}
                      {hasSub && isExpanded && (
                        <div className="pl-6 space-y-1 border-l-2 border-[#bbbbbb] ml-2 my-1">
                          {cat.subcategories?.map((sub) => {
                            const isSubSelected = selectedCategories.includes(sub);
                            return (
                              <div
                                key={sub}
                                className="flex items-center gap-2 hover:bg-[#f2f2f2] py-0.5 px-1 rounded cursor-pointer transition-colors"
                                onClick={() => onToggleCategory(sub)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSubSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 accent-[#73a000] cursor-pointer"
                                />
                                <span className="text-[#000000] font-semibold text-[13px] truncate hover:text-black">{sub}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
