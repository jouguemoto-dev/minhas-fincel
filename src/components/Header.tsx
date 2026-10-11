import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { ChevronDown, User, LogOut, Download, Upload, HelpCircle, Settings, PieChart, ShieldCheck, Smartphone, Check, Eye, EyeOff, MessageSquare } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string;
  onOpenExportModal?: () => void;
  onOpenInstallModal?: () => void;
  onLogout?: () => void;
  onResetDataToZero?: () => void;
  isInstalled?: boolean;
  isSyncing?: boolean;
  isPrivacyMode?: boolean;
  onTogglePrivacy?: () => void;
  onOpenAuthModal?: () => void;
  onOpenChatModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userEmail = 'usuario@exemplo.com',
  onOpenExportModal,
  onOpenInstallModal,
  onLogout,
  onResetDataToZero,
  isInstalled = false,
  isSyncing = false,
  isPrivacyMode = false,
  onTogglePrivacy,
  onOpenAuthModal,
  onOpenChatModal,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [analiseMenuOpen, setAnaliseMenuOpen] = useState(false);
  const [configMenuOpen, setConfigMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const analiseMenuRef = useRef<HTMLDivElement>(null);
  const configMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (analiseMenuRef.current && !analiseMenuRef.current.contains(event.target as Node)) {
        setAnaliseMenuOpen(false);
      }
      if (configMenuRef.current && !configMenuRef.current.contains(event.target as Node)) {
        setConfigMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#82af07] border-b border-[#6e9406] w-full text-white text-[15px] relative z-40 select-none">
      <div className="max-w-[1340px] mx-auto flex items-center justify-between h-[52px] px-2 sm:px-4">
        {/* Left side: Logo + Desktop Tabs */}
        <div className="flex items-stretch h-full">
          {/* Logo container: white background tab */}
          <div
            className="bg-white px-3 sm:px-4 flex items-center shadow-xs rounded-t-sm self-stretch mr-2 cursor-pointer"
            onClick={() => setActiveTab('inicio')}
          >
            <Logo />
          </div>

          {/* Navigation Tabs (Desktop / Large Screens) */}
          <nav className="hidden lg:flex items-stretch font-bold text-[15px]">
            <button
              onClick={() => setActiveTab('inicio')}
              className={`px-4 flex items-center transition-colors relative cursor-pointer ${
                activeTab === 'inicio'
                  ? 'bg-[#577708] text-white font-bold shadow-inner'
                  : 'text-white hover:bg-[#729b06]'
              }`}
            >
              Início
              {activeTab === 'inicio' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('transacoes')}
              className={`px-4 flex items-center transition-colors relative cursor-pointer ${
                activeTab === 'transacoes'
                  ? 'bg-[#577708] text-white font-bold shadow-inner'
                  : 'text-white hover:bg-[#729b06]'
              }`}
            >
              Transações
              {activeTab === 'transacoes' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sonhos')}
              className={`px-4 flex items-center transition-colors relative cursor-pointer ${
                activeTab === 'sonhos'
                  ? 'bg-[#577708] text-white font-bold shadow-inner'
                  : 'text-white hover:bg-[#729b06]'
              }`}
            >
              Sonhos
              {activeTab === 'sonhos' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orcamento')}
              className={`px-4 flex items-center transition-colors relative cursor-pointer ${
                activeTab === 'orcamento'
                  ? 'bg-[#577708] text-white font-bold shadow-inner'
                  : 'text-white hover:bg-[#729b06]'
              }`}
            >
              Orçamento
              {activeTab === 'orcamento' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white"></div>
              )}
            </button>

            {/* Análise Dropdown */}
            <div className="relative flex items-stretch" ref={analiseMenuRef}>
              <button
                onClick={() => {
                  setAnaliseMenuOpen(!analiseMenuOpen);
                  setConfigMenuOpen(false);
                }}
                className={`px-4 flex items-center gap-1 transition-colors cursor-pointer ${
                  activeTab.startsWith('analise')
                    ? 'bg-[#577708] text-white font-bold'
                    : 'text-white hover:bg-[#729b06]'
                }`}
              >
                <span>Análise</span>
                <ChevronDown className="w-4 h-4 opacity-95" />
              </button>
              {analiseMenuOpen && (
                <div className="absolute top-full left-0 mt-0 w-60 bg-white text-[#000000] shadow-xl border border-[#b0b0b0] py-1 text-[13.5px] z-50">
                  <button
                    onClick={() => {
                      setActiveTab('analise-categorias');
                      setAnaliseMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <PieChart className="w-4 h-4 text-[#73a000]" />
                    Despesas por Categoria
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('analise-evolucao');
                      setAnaliseMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <span className="text-[#73a000] font-bold text-base">📈</span>
                    Evolução do Saldo
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('analise-fluxo');
                      setAnaliseMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <span className="text-[#73a000] font-bold text-base">⚖️</span>
                    Receitas x Despesas
                  </button>
                </div>
              )}
            </div>

            {/* Configurações Dropdown */}
            <div className="relative flex items-stretch" ref={configMenuRef}>
              <button
                onClick={() => {
                  setConfigMenuOpen(!configMenuOpen);
                  setAnaliseMenuOpen(false);
                }}
                className={`px-4 flex items-center gap-1 transition-colors cursor-pointer ${
                  activeTab.startsWith('config')
                    ? 'bg-[#577708] text-white font-bold'
                    : 'text-white hover:bg-[#729b06]'
                }`}
              >
                <span>Configurações</span>
                <ChevronDown className="w-4 h-4 opacity-95" />
              </button>
              {configMenuOpen && (
                <div className="absolute top-full left-0 mt-0 w-60 bg-white text-[#000000] shadow-xl border border-[#b0b0b0] py-1 text-[13.5px] z-50">
                  <button
                    onClick={() => {
                      setActiveTab('config-contas');
                      setConfigMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <Settings className="w-4 h-4 text-[#73a000]" />
                    Gerenciar Contas
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('config-categorias');
                      setConfigMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <span className="text-[#73a000] font-bold text-base">🏷️</span>
                    Gerenciar Categorias
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('config-regras');
                      setConfigMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#73a000]" />
                    Regras de Preenchimento
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right side: Sync Indicator, Privacy & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Instant Sync Indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-[#577708] rounded-xs text-[11.5px] font-bold text-white shadow-2xs"
            title="Sincronização automática instantânea em tempo real com o banco de dados"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSyncing ? 'bg-amber-300 animate-pulse' : 'bg-green-300'
              }`}
            />
            <span>{isSyncing ? 'Sincronizando...' : 'Instantâneo'}</span>
          </div>

          {/* Privacy Toggle (Eye) */}
          {onTogglePrivacy && (
            <button
              onClick={onTogglePrivacy}
              className="p-1.5 rounded-sm hover:bg-[#729b06] text-white/95 active:scale-95 transition-all cursor-pointer"
              title={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4 text-yellow-300" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* User Account Menu */}
          <div className="relative flex items-center" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 px-1.5 sm:px-3 py-1 text-white hover:bg-[#729b06] rounded-full sm:rounded font-bold text-[12.5px] sm:text-[13.5px] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-xs font-black sm:hidden">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline max-w-[190px] truncate">{userEmail}</span>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-95 shrink-0" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white text-[#000000] shadow-xl border border-[#b0b0b0] py-1 text-[13.5px] z-50">
                <div className="px-3.5 py-2.5 border-b border-gray-200 bg-[#f9f9f9]">
                  <div className="font-bold text-[#000000] truncate">{userEmail}</div>
                  <div className="text-[12px] text-[#222222] font-semibold">Sincronização em Tempo Real</div>
                </div>
                {onOpenInstallModal && !isInstalled && (
                  <button
                    onClick={() => {
                      onOpenInstallModal();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 bg-[#f8faf2] hover:bg-[#eef5d6] flex items-center gap-2.5 cursor-pointer text-[#82af07] font-black border-b border-gray-100"
                  >
                    <Smartphone className="w-4 h-4 text-[#82af07]" />
                    Instalar no Android
                  </button>
                )}
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#82af07] font-bold border-b border-gray-100"
                  >
                    <span>☁️</span>
                    Conectar / Sincronizar Nuvem
                  </button>
                )}
                <button
                  onClick={() => {
                    onOpenExportModal?.();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#000000] font-medium"
                >
                  <Download className="w-4 h-4 text-[#000000]" />
                  Exportar Dados
                </button>
                {onResetDataToZero && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onResetDataToZero();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center gap-2.5 cursor-pointer text-amber-900 font-semibold"
                  >
                    <span className="text-amber-700 font-bold">🗑️</span>
                    Zerar Dados (Reset)
                  </button>
                )}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f1f6df] flex items-center gap-2.5 cursor-pointer text-[#b91c1c] font-bold"
                >
                  <LogOut className="w-4 h-4 text-[#b91c1c]" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
