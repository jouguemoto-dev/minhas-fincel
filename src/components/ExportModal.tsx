import React, { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (config: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'xls';
    orientation: 'portrait' | 'landscape';
    printFilters: boolean;
  }) => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  defaultStartDate = '2026-11-01',
  defaultEndDate = '2026-11-30',
}) => {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [format, setFormat] = useState<'pdf' | 'xls'>('pdf');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printFilters, setPrintFilters] = useState(true);

  if (!isOpen) return null;

  const handleExport = () => {
    onConfirmExport({
      startDate,
      endDate,
      format,
      orientation,
      printFilters,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      {/* Modal Dialog Container */}
      <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-[480px] text-[14px] text-[#000000] select-none rounded-xs font-sans">
        {/* Title Bar */}
        <div className="bg-[#eeeeee] border-b border-[#cccccc] px-4 py-2.5 flex items-center justify-between">
          <span className="font-black text-[15px] text-[#000000]">Exportar transações</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-[#888888] bg-[#ffffff] hover:bg-gray-100 text-[#000000] text-[13px] font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 space-y-4">
          <p className="text-[#000000] font-semibold leading-normal text-[14px]">
            O arquivo será gerado a partir dos filtros selecionados e o período informado abaixo.
          </p>

          {/* Período */}
          <div className="flex items-center gap-2 flex-wrap font-bold text-[#000000]">
            <span className="text-[#000000]">Período de</span>
            <div className="flex items-center border border-[#888888] bg-white px-2.5 py-1 w-[140px]">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-[13px] font-bold focus:outline-none text-[#000000]"
              />
            </div>
            <span className="text-[#000000]">até</span>
            <div className="flex items-center border border-[#888888] bg-white px-2.5 py-1 w-[140px]">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-[13px] font-bold focus:outline-none text-[#000000]"
              />
            </div>
          </div>

          {/* Formato do Arquivo */}
          <div className="flex items-center gap-6 font-bold text-[#000000]">
            <span className="w-36 text-[#000000]">Formato do arquivo:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={() => setFormat('pdf')}
                className="accent-[#0078d7] w-4 h-4"
              />
              <span className="font-bold">PDF</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="xls"
                checked={format === 'xls'}
                onChange={() => setFormat('xls')}
                className="accent-[#0078d7] w-4 h-4"
              />
              <span className="font-bold">XLS</span>
            </label>
          </div>

          {/* Orientação da Folha */}
          <div className="flex items-center gap-6 font-bold text-[#000000]">
            <span className="w-36 text-[#000000]">Orientação da folha:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="portrait"
                checked={orientation === 'portrait'}
                onChange={() => setOrientation('portrait')}
                className="accent-[#0078d7] w-4 h-4"
              />
              <span className="font-bold">Retrato</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="landscape"
                checked={orientation === 'landscape'}
                onChange={() => setOrientation('landscape')}
                className="accent-[#0078d7] w-4 h-4"
              />
              <span className="font-bold">Paisagem</span>
            </label>
          </div>

          {/* Imprimir filtros ativos */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#000000]">
              <input
                type="checkbox"
                checked={printFilters}
                onChange={(e) => setPrintFilters(e.target.checked)}
                className="accent-[#0078d7] w-4 h-4 cursor-pointer"
              />
              <span>Imprimir filtros ativos</span>
            </label>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-3 border-t border-[#cccccc]">
            <button
              onClick={handleExport}
              className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-6 py-1.5 font-black text-[13px] border border-[#446609] rounded-xs cursor-pointer shadow-xs active:translate-y-px"
            >
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
