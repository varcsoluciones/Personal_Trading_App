'use client';

import React, { useRef } from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface HorizontalAssetBarProps {
  assets: Asset[];
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
}

export function HorizontalAssetBar({
  assets,
  selectedAssetId,
  onSelectAsset,
}: HorizontalAssetBarProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`rounded-3xl border p-3 shadow-xs transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isDark
              ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:bg-[#3a3a3c] hover:text-white'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
          }`}
          title="Desplazar a la izquierda"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable Container with Visible High-Contrast Scrollbar */}
        <div
          ref={scrollContainerRef}
          className="custom-horizontal-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-2 pt-0.5"
        >
          {assets.map((a) => {
            const isSelected = a.id === selectedAssetId;
            const isPositive = a.change24hPct >= 0;

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectAsset(a.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? isDark
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} font-bold shadow-xs ring-2 ring-blue-500/40`
                      : 'border-blue-500 bg-blue-50/80 text-blue-700 font-bold shadow-xs ring-2 ring-blue-500/40'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-300 hover:border-slate-700 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:border-slate-400 hover:bg-slate-200 font-semibold shadow-2xs'
                }`}
              >
                <span className="font-bold">{a.symbol}</span>
                <span
                  className={`rounded-md border px-1.5 py-0.2 text-[9px] uppercase font-bold ${getAssetTypeBadgeStyle(
                    a.type,
                    isDark
                  )}`}
                >
                  {a.type}
                </span>
                <span className={`font-mono text-[11px] ${isSelected ? (isDark ? 'text-white' : 'text-blue-950') : isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {formatCurrency(a.price, 0)}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    isPositive ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {isPositive ? '+' : ''}{a.change24hPct.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isDark
              ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:bg-[#3a3a3c] hover:text-white'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
          }`}
          title="Desplazar a la derecha"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
