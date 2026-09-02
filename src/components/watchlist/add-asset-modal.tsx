'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Check,
  TrendingUp,
  Coins,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { POPULAR_ASSETS_CATALOG, AssetDefinition } from '@/lib/api/default-data';
import { useSettings } from '@/lib/context/settings-context';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, name: string, type: 'crypto' | 'stock' | 'etf') => void;
}

export function AddAssetModal({ isOpen, onClose, onAdd }: AddAssetModalProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const [query, setQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'crypto' | 'stock' | 'etf'>('all');

  // Filter catalog live based on query and type filter
  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return POPULAR_ASSETS_CATALOG.filter((item) => {
      const matchType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
      if (!matchType) return false;
      if (!trimmed) return true;
      return (
        item.symbol.toLowerCase().includes(trimmed) ||
        item.id.toLowerCase().includes(trimmed) ||
        item.name.toLowerCase().includes(trimmed)
      );
    });
  }, [query, selectedTypeFilter]);

  if (!isOpen) return null;

  const handleSelectAsset = (item: AssetDefinition) => {
    onAdd(item.symbol, item.name, item.type);
    setQuery('');
    onClose();
  };

  const handleAddCustom = () => {
    if (!query.trim()) return;
    const cleanSym = query.trim().toUpperCase();
    const isCrypto = cleanSym.includes('USDT') || cleanSym.includes('BTC') || cleanSym.includes('ETH');
    const type = isCrypto ? 'crypto' : selectedTypeFilter === 'all' ? 'stock' : selectedTypeFilter;
    onAdd(cleanSym, cleanSym, type);
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white shadow-black/60'
            : 'border-slate-200/80 bg-white text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Header & Search Bar (iOS Spotlight Style) */}
        <div className={`p-5 pb-3 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Plus className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold">Buscar y Agregar Activo</h3>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-1.5 transition-colors ${
                isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              autoFocus
              placeholder="Escribe el ticker o nombre (ej. VOO, BTC, NVDA, TSLA)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (matches.length > 0) handleSelectAsset(matches[0]);
                  else handleAddCustom();
                }
              }}
              className={`w-full rounded-2xl border py-2.5 pl-10 pr-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-white placeholder-slate-500'
                  : 'border-slate-200 bg-slate-100 text-slate-900 placeholder-slate-400'
              }`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'stock', label: 'Acciones' },
              { id: 'etf', label: 'ETFs' },
              { id: 'crypto', label: 'Criptos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedTypeFilter(f.id as any)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selectedTypeFilter === f.id
                    ? 'bg-blue-500 text-white shadow-xs'
                    : isDark
                    ? 'bg-[#2c2c2e]/60 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Dropdown / Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-80">
          {matches.length > 0 ? (
            matches.map((item) => {
              const typeBadge = {
                crypto: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
                stock: isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
                etf: isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200',
              }[item.type];

              const TypeIcon = item.type === 'crypto' ? Coins : item.type === 'etf' ? Layers : TrendingUp;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectAsset(item)}
                  className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition-all ${
                    isDark
                      ? 'hover:bg-[#2c2c2e]/70 active:bg-[#3a3a3c]'
                      : 'hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        isDark ? 'bg-[#2c2c2e] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight">{item.symbol}</span>
                        <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${typeBadge}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                      Seleccionar <ArrowRight className="h-3 w-3" />
                    </span>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isDark ? 'bg-[#2c2c2e] text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>
              );
            })
          ) : query.trim() ? (
            /* Custom entry if not in catalog */
            <div className="p-4 text-center">
              <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No se encontró en la lista rápida, pero puedes agregarlo directamente:
              </p>
              <button
                onClick={handleAddCustom}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar "{query.trim().toUpperCase()}" a la Watchlist</span>
              </button>
            </div>
          ) : (
            <div className={`py-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Escribe el ticker o nombre de la empresa para buscar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
