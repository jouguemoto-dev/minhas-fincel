import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="flex flex-col leading-none">
        <span className="font-bold text-[#3d3d3d] tracking-tight text-[19px] -mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
          minhas
        </span>
        <span className="text-[#555555] tracking-tight text-[11px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          economias
        </span>
      </div>
      <div className="relative flex items-center justify-center">
        {/* The iconic Minhas Economias clover/dollar icon */}
        <div className="w-7 h-7 rounded-full bg-[#83b006] flex items-center justify-center shadow-xs text-white font-extrabold text-[15px] border border-[#6b9204]">
          <span className="transform -translate-y-0.5">$</span>
        </div>
      </div>
    </div>
  );
};
