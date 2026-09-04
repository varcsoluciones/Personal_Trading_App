'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';

export interface InfoTooltipProps {
  text: string;
  title?: string;
  align?: 'auto' | 'right' | 'left' | 'center';
  position?: 'top' | 'bottom';
}

export function InfoTooltip({
  text,
  title,
  align = 'auto',
  position = 'top',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // Alignment classes to prevent off-screen clipping
  const getAlignmentClass = () => {
    switch (align) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      case 'auto':
      default:
        // Default auto: align to right on small screens, center on larger screens
        return 'right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2';
    }
  };

  const positionClass =
    position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <div className="relative inline-flex items-center z-30">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`rounded-full p-1 transition-colors ${
          isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
        aria-label={title || 'Información'}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${positionClass} ${getAlignmentClass()} z-[100] w-64 sm:w-72 rounded-2xl border p-3.5 shadow-2xl text-left backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            isDark
              ? 'border-slate-700/90 bg-[#1c1c1e]/98 text-slate-100 shadow-black/80'
              : 'border-slate-300 bg-white/98 text-slate-900 shadow-slate-400/50'
          }`}
        >
          {title && (
            <div className="flex items-center gap-1.5 mb-1.5 text-blue-500 font-bold text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{title}</span>
            </div>
          )}
          <p className="text-xs leading-relaxed opacity-90 font-medium whitespace-pre-line">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
