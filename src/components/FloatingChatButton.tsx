import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-[#5a8710] to-[#73a000] hover:from-[#486b0d] hover:to-[#5a8710] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl hover:shadow-emerald-700/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white select-none group"
      title="Criar lançamento por chat com Inteligência Artificial"
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-white" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping"></span>
      </div>
      <span className="font-black text-[13px] sm:text-[13.5px] tracking-tight">
        Lançar por Chat
      </span>
      <span className="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
        <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
        IA
      </span>
    </button>
  );
};
