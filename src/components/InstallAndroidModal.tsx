import React from 'react';
import { Smartphone, Download, CheckCircle, Share2, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface InstallAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'manual_needed'>;
  isInstallable: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export const InstallAndroidModal: React.FC<InstallAndroidModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isInstalled,
  isAndroid,
  isIOS,
}) => {
  const [installStatus, setInstallStatus] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await onInstall();
    if (result === 'accepted') {
      setInstallStatus('success');
      setTimeout(() => {
        onClose();
        setInstallStatus(null);
      }, 2000);
    } else if (result === 'dismissed') {
      setInstallStatus('dismissed');
    } else {
      setInstallStatus('manual');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="bg-white border-2 border-[#82af07] rounded-lg shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto text-[#000000]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#82af07] to-[#6e9406] text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white p-1.5 shadow-sm flex items-center justify-center">
              <img src="/icon.svg" alt="Minhas Economias" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-black text-[16.5px] leading-tight">Instalar Minhas Economias</h3>
              <p className="text-[12px] text-green-100 font-medium">Aplicativo Oficial para Android e Telas Móveis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white font-black text-[15px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Status feedback */}
          {isInstalled ? (
            <div className="bg-[#edf6d8] border border-[#82af07] p-4 rounded-md flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#82af07] shrink-0" />
              <div>
                <p className="font-black text-[14.5px] text-[#000000]">Aplicativo já instalado!</p>
                <p className="text-[13px] text-[#333333]">Você já pode abrir o Minhas Economias direto da sua tela inicial do celular.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Highlight Box */}
              <div className="bg-[#f8faf2] border border-[#d6e7a5] rounded-md p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#5b7d04] font-black text-[14.5px]">
                  <Sparkles className="w-5 h-5 text-[#82af07]" />
                  <span>Vantagens do App no seu Celular:</span>
                </div>
                <ul className="text-[13.5px] font-medium space-y-1.5 text-[#222222] pl-1">
                  <li className="flex items-center gap-2">
                    <span className="text-[#82af07] font-black">✓</span> Acesso rápido em 1 toque na tela inicial do Android
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#82af07] font-black">✓</span> Modo tela cheia sem barras do navegador
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#82af07] font-black">✓</span> Funciona offline com dados sincronizados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#82af07] font-black">✓</span> Leve, rápido e sem ocupar espaço de memória
                  </li>
                </ul>
              </div>

              {/* Install Action Button */}
              {isInstallable && (
                <div className="pt-1">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-[#82af07] hover:bg-[#729b06] active:scale-[0.99] text-white font-black py-3 px-5 rounded-md shadow-md flex items-center justify-center gap-2.5 text-[15px] cursor-pointer transition-all border border-[#5b7d04]"
                  >
                    <Download className="w-5 h-5" />
                    <span>INSTALAR AGORA NO ANDROID</span>
                  </button>
                  <p className="text-center text-[12px] text-[#666666] mt-1.5 font-medium">
                    Toque para abrir a confirmação nativa do Android
                  </p>
                </div>
              )}

              {/* Manual instructions guide */}
              <div className="border border-[#cccccc] rounded-md overflow-hidden">
                <div className="bg-[#eeeeee] px-4 py-2.5 border-b border-[#cccccc] flex items-center justify-between">
                  <span className="font-black text-[14px] text-[#000000] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#82af07]" />
                    Como instalar pelo Chrome no Android:
                  </span>
                  <span className="text-[11.5px] font-bold bg-[#82af07] text-white px-2 py-0.5 rounded-sm">
                    Passo a Passo
                  </span>
                </div>

                <div className="p-4 space-y-3.5 bg-white text-[13.5px]">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#82af07] text-white font-black text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#000000]">
                        Abra o menu do Chrome no Android
                      </p>
                      <p className="text-[#444444] text-[13px]">
                        Toque no ícone de <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#82af07] text-white font-black text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#000000]">
                        Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
                      </p>
                      <p className="text-[#444444] text-[13px]">
                        Procure pela opção <strong>"Instalar aplicativo"</strong> (ou "Adicionar à tela principal").
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#82af07] text-white font-black text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#000000]">
                        Confirme a instalação
                      </p>
                      <p className="text-[#444444] text-[13px]">
                        Toque em <strong>"Instalar"</strong>. O ícone oficial será adicionado à sua tela inicial!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* iOS Alternative if viewed on iPhone */}
              {isIOS && (
                <div className="bg-[#f0f4f8] border border-[#c2d4e5] rounded-md p-3.5 text-[13px]">
                  <p className="font-bold text-[#000000] mb-1">Para usuários de iPhone / iPad (Safari):</p>
                  <p className="text-[#333333]">
                    Toque no botão <strong>Compartilhar (quadrado com seta)</strong> no Safari e depois em <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Security & Offline note */}
          <div className="flex items-center gap-2 text-[12.5px] text-[#555555] bg-gray-50 p-2.5 rounded-sm border border-gray-200">
            <ShieldCheck className="w-4 h-4 text-[#82af07] shrink-0" />
            <span>Aplicativo seguro e verificado. Todos os dados permanecem protegidos no seu dispositivo.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f5f5f5] px-4 py-3 border-t border-[#cccccc] flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Minhas Economias',
                  text: 'Acesse o Minhas Economias no seu celular:',
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }
            }}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[#555555] hover:text-[#000000] cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? '✓ Link copiado!' : 'Compartilhar link'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#444444] hover:bg-[#222222] text-white font-bold text-[13.5px] rounded-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
