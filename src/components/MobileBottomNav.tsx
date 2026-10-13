import React, { useState } from 'react';
import { Home, ReceiptText, Target, PieChart, Menu, Settings, Download, Smartphone, X, ChevronRight, BarChart2, ShieldCheck, LogOut, Plus, MessageSquare } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenInstallModal: () => void;
  onOpenExportModal: () => void;
  onOpenQuickAdd: () => void;
  onOpenChatModal?: () => void;
  isInstalled: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenInstallModal,
  onOpenExportModal,
  onOpenQuickAdd,
  onOpenChatModal,
  isInstalled,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'transacoes', label: 'Transações', icon: ReceiptText },
    { id: 'sonhos', label: 'Sonhos', icon: Target },
    { id: 'orcamento', label: 'Orçamento', icon: PieChart },
  ];

  return (
    <>
      {/* Slide-up Menu Drawer for "Mais" */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs select-none animate-fadeIn lg:hidden">
          <div className="bg-white rounded-t-2xl shadow-2xl border-t-2 border-[#82af07] max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#f8faf2]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#82af07] flex items-center justify-center text-white font-black text-sm">
                  ME
                </div>
                <div>
                  <h3 className="font-black text-[15px] text-[#000000]">Menu Minhas Economias</h3>
                  <p className="text-[12px] text-[#555555]">Todas as ferramentas e configurações</p>
                </div>
              </div>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-3 space-y-1 text-[14px]">
              {/* Lançamento por Chat IA Highlight Card */}
              {onOpenChatModal && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenChatModal();
                  }}
                  className="w-full mb-2 p-3 bg-gradient-to-r from-[#2c4004] via-[#5a8710] to-[#82af07] text-white rounded-xl flex items-center justify-between font-black shadow-md cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-[14px] leading-tight font-black flex items-center gap-1.5">
                        <span>Lançar por Chat</span>
                        <span className="bg-emerald-400 text-emerald-950 text-[9.5px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">IA</span>
                      </div>
                      <div className="text-[11.5px] text-green-100 font-medium">Digite ou fale gastos em linguagem natural</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-90" />
                </button>
              )}

              {/* Install on Android Highlight Card */}
              {!isInstalled && (
                <button
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenInstallModal();
                  }}
                  className="w-full mb-2 p-3 bg-gradient-to-r from-[#82af07] to-[#6e9406] text-white rounded-lg flex items-center justify-between font-black shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-yellow-300" />
                    <div className="text-left">
                      <div className="text-[14px] leading-tight font-black">Instalar no Android</div>
                      <div className="text-[11.5px] text-green-100 font-medium">Toque para adicionar à tela inicial</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Orçamento */}
              <button
                onClick={() => {
                  setActiveTab('orcamento');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PieChart className="w-4 h-4 text-[#82af07]" />
                  <span>Orçamento Mensal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Análises */}
              <div className="px-3 pt-2 pb-1 text-[11.5px] font-black text-[#555555] uppercase tracking-wider">
                Relatórios e Gráficos
              </div>
              <button
                onClick={() => {
                  setActiveTab('analise-categorias');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PieChart className="w-4 h-4 text-[#82af07]" />
                  <span>Despesas por Categoria</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('analise-evolucao');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4 text-[#82af07]" />
                  <span>Evolução do Saldo</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('analise-fluxo');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#82af07] font-bold text-sm">⚖️</span>
                  <span>Receitas x Despesas</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Gerenciamento */}
              <div className="px-3 pt-3 pb-1 text-[11.5px] font-black text-[#555555] uppercase tracking-wider">
                Configurações & Gestão
              </div>
              <button
                onClick={() => {
                  setActiveTab('config-contas');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#82af07]" />
                  <span>Gerenciar Contas Bancárias</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('config-categorias');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🏷️</span>
                  <span>Gerenciar Categorias</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('config-regras');
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#82af07]" />
                  <span>Regras de Preenchimento</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Exportar */}
              <div className="px-3 pt-3 pb-1 text-[11.5px] font-black text-[#555555] uppercase tracking-wider">
                Ações
              </div>
              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  onOpenExportModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[#f1f6df] text-left font-bold text-[#000000] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-black" />
                  <span>Exportar Extrato (Excel / CSV / PDF)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar on Mobile Screens (hidden on lg: screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden select-none">
        {/* Tab 1: Início */}
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'inicio' ? 'text-[#82af07] font-black' : 'text-gray-500 font-bold hover:text-black'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'inicio' ? 'bg-[#edf6d8]' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 leading-tight">Início</span>
        </button>

        {/* Tab 2: Transações */}
        <button
          onClick={() => setActiveTab('transacoes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'transacoes' ? 'text-[#82af07] font-black' : 'text-gray-500 font-bold hover:text-black'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'transacoes' ? 'bg-[#edf6d8]' : ''}`}>
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 leading-tight">Transações</span>
        </button>

        {/* Center Tab: Elevated Action Button (+) */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="flex flex-col items-center justify-center flex-1 -mt-5 cursor-pointer group active:scale-95 transition-transform"
          title="Novo lançamento rápido"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6e9406] to-[#82af07] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(130,175,7,0.45)] border-3 border-white group-hover:scale-105 transition-all">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10.5px] font-black text-[#577708] mt-0.5">Novo</span>
        </button>

        {/* Tab 4: Sonhos */}
        <button
          onClick={() => setActiveTab('sonhos')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'sonhos' ? 'text-[#82af07] font-black' : 'text-gray-500 font-bold hover:text-black'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'sonhos' ? 'bg-[#edf6d8]' : ''}`}>
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 leading-tight">Sonhos</span>
        </button>

        {/* Tab 5: Mais */}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab.startsWith('analise') || activeTab.startsWith('config') || activeTab === 'orcamento'
              ? 'text-[#82af07] font-black'
              : 'text-gray-500 font-bold hover:text-black'
          }`}
        >
          <div className="p-1 rounded-full relative">
            <Menu className="w-5 h-5" />
            {!isInstalled && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#82af07] rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <span className="text-[11px] mt-0.5 leading-tight">Mais</span>
        </button>
      </nav>
    </>
  );
};
