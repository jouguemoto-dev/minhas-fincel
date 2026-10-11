import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 sm:left-4 z-50 flex items-center gap-2 rounded-lg bg-[#b91c1c] px-3.5 py-2 text-[13px] font-bold text-white shadow-xl border border-red-800 animate-bounce">
      <WifiOff className="w-4 h-4 text-white shrink-0" />
      <span>Modo Offline — Seus dados continuam salvos no dispositivo.</span>
    </div>
  );
};
