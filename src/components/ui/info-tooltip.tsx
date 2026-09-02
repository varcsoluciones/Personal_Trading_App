'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';

interface InfoTooltipProps {
  text: string;
  title?: string;
}

export function InfoTooltip({ text, title }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`rounded-full p-0.5 transition-colors ${
          isDark
            ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-2xl border p-3 shadow-xl text-left backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            isDark
              ? 'border-slate-700/80 bg-[#1c1c1e]/95 text-slate-200'
              : 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-200'
          }`}
        >
          {title && <p className="font-bold text-[11px] mb-1 text-blue-500">{title}</p>}
          <p className="text-[11px] leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}
