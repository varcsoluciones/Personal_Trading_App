'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { ChevronDown, Check, Search } from 'lucide-react';

interface AssetDropdownSelectProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (id: string) => void;
  className?: string;
  showDetails?: boolean;
}

export function AssetDropdownSelect({
  assets,
  selectedAsset,
  onSelectAsset,
  className = '',
  showDetails = true,
}: AssetDropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredAssets = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPositive = selectedAsset.change24hPct >= 0;

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-20'} ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className={`group flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all ${
          isDark
            ? 'border-slate-700/80 bg-[#2c2c2e]/80 text-white hover:border-slate-600 hover:bg-[#38383a]'
            : 'border-slate-200/90 bg-slate-100 text-slate-900 hover:border-slate-300 hover:bg-slate-200/70 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight font-mono sm:text-lg">
            {selectedAsset.symbol}
          </span>
          <span
            className={`rounded-lg border px-1.5 py-0.2 text-[10px] font-bold uppercase ${getAssetTypeBadgeStyle(
              selectedAsset.type,
              isDark
            )}`}
          >
            {selectedAsset.type}
          </span>
        </div>

        {showDetails && (
          <div className="hidden sm:flex items-center gap-2 border-l pl-2.5 border-slate-700/40 text-xs font-mono">
            <span className="font-bold">{formatCurrency(selectedAsset.price)}</span>
            <span
              className={`font-semibold text-[11px] ${
                isPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {selectedAsset.change24hPct.toFixed(2)}%
            </span>
          </div>
        )}

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-white'
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-3xl border p-2 shadow-2xl backdrop-blur-xl transition-all animate-fade-in ${
            isDark
              ? 'border-slate-700/80 bg-[#1c1c1e]/95 text-white ring-1 ring-white/10'
              : 'border-slate-200 bg-white/95 text-slate-900 shadow-xl ring-1 ring-black/5'
          }`}
        >
          {/* Quick Filter Search Input */}
          {assets.length > 3 && (
            <div className="mb-2 p-1">
              <div
                className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-xs ${
                  isDark
                    ? 'border-slate-700 bg-[#2c2c2e] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar activo o ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Asset List Scrollable Container */}
          <div className="max-h-64 overflow-y-auto space-y-1 p-0.5 custom-horizontal-scrollbar">
            {filteredAssets.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No se encontraron activos
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = asset.id === selectedAsset.id;
                const assetIsPositive = asset.change24hPct >= 0;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelectAsset(asset.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-2xl p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-500/20 text-white border border-blue-500/40'
                          : 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs'
                        : isDark
                        ? 'hover:bg-[#2c2c2e] text-slate-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-sm truncate">
                            {asset.symbol}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase shrink-0 ${getAssetTypeBadgeStyle(
                              asset.type,
                              isDark
                            )}`}
                          >
                            {asset.type}
                          </span>
                        </div>
                        <p className={`truncate text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {asset.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right font-mono">
                      <div>
                        <div className="font-bold">{formatCurrency(asset.price)}</div>
                        <div
                          className={`text-[10px] font-semibold ${
                            assetIsPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {assetIsPositive ? '+' : ''}
                          {asset.change24hPct.toFixed(2)}%
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
