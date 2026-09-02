'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Check,
  X,
  TrendingUp,
  Coins,
  Layers,
} from 'lucide-react';
import { POPULAR_ASSETS_CATALOG, AssetDefinition } from '@/lib/api/default-data';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, name: string, type: 'crypto' | 'stock' | 'etf') => void;
  existingSymbols?: string[];
}

export function AddAssetModal({ isOpen, onClose, onAdd, existingSymbols = [] }: AddAssetModalProps) {
  const { settings, accent } = useSettings();
  const isDark = settings.theme === 'dark';

  const [query, setQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'crypto' | 'stock' | 'etf'>('all');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  // Filter catalog based on search query and type filter
  const matches = useMemo(() => {
    return POPULAR_ASSETS_CATALOG.filter((item) => {
      const matchType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
      const matchQuery =
        !query.trim() ||
        item.symbol.toLowerCase().includes(query.toLowerCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase());
      return matchType && matchQuery;
    });
  }, [query, selectedTypeFilter]);

  if (!isOpen) return null;

  const isSymbolAdded = (symbol: string) => {
    const cleanSym = symbol.replace('/', '').toUpperCase();
    return (
      justAdded.has(symbol) ||
      justAdded.has(cleanSym) ||
      existingSymbols.some(
        (s) => s.toUpperCase() === symbol.toUpperCase() || s.replace('/', '').toUpperCase() === cleanSym
      )
    );
  };

  const handleSelectAsset = (item: AssetDefinition) => {
    if (isSymbolAdded(item.symbol)) return;
    onAdd(item.symbol, item.name, item.type);
    setJustAdded((prev) => new Set(prev).add(item.symbol).add(item.id));
  };

  const handleAddCustom = () => {
    if (!query.trim()) return;
    const cleanSym = query.trim().toUpperCase();
    const isCrypto = cleanSym.includes('USDT') || cleanSym.includes('BTC') || cleanSym.includes('ETH');
    const type = isCrypto ? 'crypto' : selectedTypeFilter === 'all' ? 'stock' : selectedTypeFilter;
    onAdd(cleanSym, cleanSym, type);
    setJustAdded((prev) => new Set(prev).add(cleanSym));
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? "border-slate-800 bg-[#1c1c1e] text-white shadow-black/60"
            : "border-slate-200/80 bg-white text-slate-900 shadow-slate-300/60"
        }`}
      >
        {/* Header & Search Bar */}
        <div className={`p-5 pb-3 border-b ${isDark ? "border-slate-800/80" : "border-slate-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ backgroundColor: accent.hex }}
              >
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold">Agregar a Watchlist</h3>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Puedes seleccionar varios activos sin cerrar la ventana
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-1.5 transition-colors ${
                isDark ? "text-slate-400 hover:bg-[#2c2c2e] hover:text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
            <input
              type="text"
              autoFocus
              placeholder="Escribe el ticker o nombre (ej. VOO, BTC, SOL, NVDA)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (matches.length > 0) handleSelectAsset(matches[0]);
                  else handleAddCustom();
                }
              }}
              className={`w-full rounded-2xl border py-2.5 pl-10 pr-9 text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? "border-slate-700/80 bg-[#2c2c2e]/70 text-white placeholder-slate-500 focus:border-blue-500/60"
                  : "border-slate-200 bg-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500/60"
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
                style={selectedTypeFilter === f.id ? { backgroundColor: accent.hex, color: '#ffffff' } : {}}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selectedTypeFilter === f.id
                    ? "shadow-xs"
                    : isDark
                    ? "bg-[#2c2c2e]/60 text-slate-400 hover:text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              const added = isSymbolAdded(item.symbol);
              const typeBadge = getAssetTypeBadgeStyle(item.type, isDark);

              const TypeIcon = item.type === 'crypto' ? Coins : item.type === 'etf' ? Layers : TrendingUp;

              return (
                <div
                  key={item.id}
                  onClick={() => !added && handleSelectAsset(item)}
                  className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition-all ${
                    added
                      ? isDark
                        ? "bg-emerald-500/5 border border-emerald-500/20"
                        : "bg-emerald-50/60 border border-emerald-200"
                      : isDark
                      ? "hover:bg-[#2c2c2e]/70 active:bg-[#3a3a3c] cursor-pointer"
                      : "hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        added
                          ? isDark ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : isDark ? "bg-[#2c2c2e] border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {added ? <Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> : <TypeIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight">{item.symbol}</span>
                        <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${typeBadge}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {added ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-500">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        Agregado
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAsset(item);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          isDark
                            ? "bg-[#2c2c2e] text-blue-400 hover:bg-blue-600 hover:text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-xs"
                        }`}
                        title="Agregar a Watchlist"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : query.trim() ? (
            /* Custom entry if not in catalog */
            <div className="p-4 text-center">
              <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No está en el catálogo predeterminado, pero puedes agregarlo directamente:
              </p>
              <button
                onClick={handleAddCustom}
                style={{ backgroundColor: accent.hex }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar "{query.trim().toUpperCase()}" a la Watchlist</span>
              </button>
            </div>
          ) : (
            <div className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Escribe el ticker o nombre para buscar.
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? "border-slate-800 bg-[#2c2c2e]/40" : "border-slate-100 bg-slate-50"
        }`}>
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {justAdded.size > 0 ? `✨ ${justAdded.size} activo(s) agregado(s)` : "Selecciona los activos que deseas seguir"}
          </span>
          <button
            onClick={onClose}
            style={{ backgroundColor: accent.hex }}
            className="rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
