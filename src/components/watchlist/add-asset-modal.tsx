'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AssetType } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { normalizeCryptoSymbol } from '@/lib/utils/symbol-normalizer';
import { POPULAR_ASSETS_CATALOG, AssetDefinition } from '@/lib/api/default-data';
import {
  X,
  Search,
  Plus,
  Check,
  TrendingUp,
  Coins,
  Layers,
  Sparkles,
  Globe,
  Loader2,
  PlusCircle,
  Lightbulb,
} from 'lucide-react';

interface CatalogAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  isBinanceLive?: boolean;
}

// Common aliases and typo mappings
const SEARCH_ALIASES: Record<string, { ticker: string; nameHint: string }> = {
  IBRK: { ticker: 'IBKR', nameHint: 'Interactive Brokers Group Inc.' },
  IB: { ticker: 'IBKR', nameHint: 'Interactive Brokers Group Inc.' },
  INTERACTIVE: { ticker: 'IBKR', nameHint: 'Interactive Brokers Group Inc.' },
  'INTERACTIVE BROKERS': { ticker: 'IBKR', nameHint: 'Interactive Brokers Group Inc.' },
  COCA: { ticker: 'KO', nameHint: 'The Coca-Cola Company' },
  COKE: { ticker: 'KO', nameHint: 'The Coca-Cola Company' },
  'COCA COLA': { ticker: 'KO', nameHint: 'The Coca-Cola Company' },
  'COCA-COLA': { ticker: 'KO', nameHint: 'The Coca-Cola Company' },
  GOOGLE: { ticker: 'GOOGL', nameHint: 'Alphabet Inc. (Google)' },
  ALPHABET: { ticker: 'GOOGL', nameHint: 'Alphabet Inc. (Google)' },
  FACEBOOK: { ticker: 'META', nameHint: 'Meta Platforms Inc.' },
  DISNEY: { ticker: 'DIS', nameHint: 'The Walt Disney Company' },
  MCDONALDS: { ticker: 'MCD', nameHint: "McDonald's Corporation" },
  MCDONALD: { ticker: 'MCD', nameHint: "McDonald's Corporation" },
  PEPSI: { ticker: 'PEP', nameHint: 'PepsiCo Inc.' },
  PEPSICO: { ticker: 'PEP', nameHint: 'PepsiCo Inc.' },
  WALMART: { ticker: 'WMT', nameHint: 'Walmart Inc.' },
  COSTCO: { ticker: 'COST', nameHint: 'Costco Wholesale Corporation' },
  BERKSHIRE: { ticker: 'BRK-B', nameHint: 'Berkshire Hathaway Inc.' },
  PALANTIR: { ticker: 'PLTR', nameHint: 'Palantir Technologies' },
  MICROSOFT: { ticker: 'MSFT', nameHint: 'Microsoft Corporation' },
  AMAZON: { ticker: 'AMZN', nameHint: 'Amazon.com Inc.' },
  APPLE: { ticker: 'AAPL', nameHint: 'Apple Inc.' },
  TESLA: { ticker: 'TSLA', nameHint: 'Tesla Inc.' },
  NVIDIA: { ticker: 'NVDA', nameHint: 'NVIDIA Corporation' },
};

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, name: string, type: AssetType) => void;
  existingSymbols: string[];
}

export function AddAssetModal({
  isOpen,
  onClose,
  onAdd,
  existingSymbols,
}: AddAssetModalProps) {
  const { settings, accent } = useSettings();
  const isDark = settings.theme === 'dark';

  const [query, setQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<AssetType | 'all'>('all');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const [binanceResults, setBinanceResults] = useState<{ symbol: string; baseAsset: string }[]>([]);
  const [isSearchingBinance, setIsSearchingBinance] = useState(false);

  // Debounced real-time Binance symbol lookup
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'crypto')) {
      setBinanceResults([]);
      setIsSearchingBinance(false);
      return;
    }

    setIsSearchingBinance(true);
    const timeoutId = setTimeout(() => {
      fetch(`/api/crypto-symbols?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.symbols)) {
            setBinanceResults(data.symbols);
          } else {
            setBinanceResults([]);
          }
        })
        .catch((err) => {
          console.warn('Error fetching Binance symbols:', err);
          setBinanceResults([]);
        })
        .finally(() => setIsSearchingBinance(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypeFilter]);

  // Check for alias suggestion
  const aliasSuggestion = useMemo(() => {
    const cleanQ = query.trim().toUpperCase();
    if (!cleanQ) return null;
    return SEARCH_ALIASES[cleanQ] || null;
  }, [query]);

  // Combined matches: Curated Catalog + Alias matches + Real-time Binance pairs
  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    const cleanQ = q.replace(/[\/\-\s_]/g, '');
    const normCryptoQ = normalizeCryptoSymbol(q);
    const aliasTicker = aliasSuggestion?.ticker?.toUpperCase();

    // 1. Filter curated catalog
    const catalogFiltered = POPULAR_ASSETS_CATALOG.filter((item) => {
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }
      if (!q) return true;

      const itemClean = item.symbol.toUpperCase().replace(/[\/\-\s_]/g, '');
      const itemNorm = item.type === 'crypto' ? normalizeCryptoSymbol(item.symbol) : itemClean;

      // Direct match or alias match
      const matchesAlias = aliasTicker ? itemClean === aliasTicker || item.symbol.toUpperCase() === aliasTicker : false;

      return (
        matchesAlias ||
        item.symbol.toUpperCase().includes(q) ||
        item.name.toUpperCase().includes(q) ||
        itemClean.includes(cleanQ) ||
        (item.type === 'crypto' && (itemNorm.includes(cleanQ) || itemNorm.includes(normCryptoQ)))
      );
    });

    // 2. Add real-time Binance matches if crypto is relevant
    if (q && (selectedTypeFilter === 'all' || selectedTypeFilter === 'crypto')) {
      const existingNormSymbols = new Set(
        catalogFiltered
          .filter((c) => c.type === 'crypto')
          .map((c) => normalizeCryptoSymbol(c.symbol))
      );

      const liveBinanceItems: CatalogAsset[] = binanceResults
        .filter((b) => !existingNormSymbols.has(b.symbol))
        .map((b) => ({
          id: b.symbol,
          symbol: b.symbol,
          name: `${b.baseAsset} / USDT`,
          type: 'crypto',
          isBinanceLive: true,
        }));

      return [...catalogFiltered, ...liveBinanceItems];
    }

    return catalogFiltered;
  }, [query, selectedTypeFilter, binanceResults, aliasSuggestion]);

  if (!isOpen) return null;

  const isSymbolAdded = (symbol: string, type?: AssetType) => {
    const cleanSym = symbol.replace(/[\/\-\s_]/g, '').toUpperCase();
    const normSym = type === 'crypto' || cleanSym.includes('USDT') ? normalizeCryptoSymbol(symbol) : cleanSym;

    return existingSymbols.some((s) => {
      const cleanExisting = s.replace(/[\/\-\s_]/g, '').toUpperCase();
      const normExisting = normalizeCryptoSymbol(s);
      return (
        cleanExisting === cleanSym ||
        s.toUpperCase() === symbol.toUpperCase() ||
        normExisting === normSym
      );
    });
  };

  const handleSelectAsset = (item: { symbol: string; name: string; type: AssetType }) => {
    let symbolToAdd = item.symbol;
    if (item.type === 'crypto') {
      symbolToAdd = normalizeCryptoSymbol(item.symbol);
    }

    onAdd(symbolToAdd, item.name, item.type);
    setJustAdded((prev) => new Set(prev).add(symbolToAdd));
  };

  // Custom ticker addition handler
  const handleAddCustom = (customType: AssetType) => {
    const raw = query.trim().toUpperCase();
    if (!raw) return;

    let symbolToAdd = raw;
    let nameToAdd = raw;

    if (customType === 'crypto') {
      symbolToAdd = normalizeCryptoSymbol(raw);
      nameToAdd = `${raw.replace(/USDT$/, '')} / USDT`;
    } else {
      symbolToAdd = raw.replace(/[\/\s]/g, '');
      nameToAdd = `${symbolToAdd} (${customType.toUpperCase()})`;
    }

    onAdd(symbolToAdd, nameToAdd, customType);
    setJustAdded((prev) => new Set(prev).add(symbolToAdd));
  };

  const cleanQuery = query.trim().toUpperCase().replace(/[\/\s_]/g, '');
  const hasExactCatalogMatch = matches.some(
    (m) => m.symbol.toUpperCase().replace(/[\/\s_]/g, '') === cleanQuery
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[85vh] flex flex-col ${
          isDark ? 'border-slate-800 bg-[#1c1c1e] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-5 border-b ${isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-base">Explorar y Agregar Activos</h3>
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
              placeholder="Escribe ticker o nombre (ej. KO, IBKR, NVDA, VOO, BTC)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full rounded-2xl border py-2.5 pl-10 pr-9 text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-white placeholder-slate-500 focus:border-blue-500/60'
                  : 'border-slate-200 bg-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500/60'
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

          {/* Alias Suggestion Banner if applicable */}
          {aliasSuggestion && (
            <div className={`mt-2.5 flex items-center gap-2 p-2 rounded-xl text-xs ${
              isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" />
              <span>
                Sugerencia para <strong>&ldquo;{query.trim()}&rdquo;</strong>: <strong>{aliasSuggestion.ticker}</strong> ({aliasSuggestion.nameHint})
              </span>
            </div>
          )}

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'crypto', label: 'Criptos (Binance)' },
              { id: 'stock', label: 'Acciones' },
              { id: 'etf', label: 'ETFs' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedTypeFilter(f.id as any)}
                style={selectedTypeFilter === f.id ? { backgroundColor: accent.hex, color: '#ffffff' } : {}}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selectedTypeFilter === f.id
                    ? 'shadow-xs'
                    : isDark
                    ? 'bg-[#2c2c2e]/60 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            {isSearchingBinance && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400 ml-auto animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Buscando Binance...</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Dropdown / Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-80 custom-horizontal-scrollbar">
          {matches.length > 0 ? (
            matches.map((item) => {
              const added = isSymbolAdded(item.symbol, item.type);
              const typeBadge = getAssetTypeBadgeStyle(item.type, isDark);
              const TypeIcon = item.type === 'crypto' ? Coins : item.type === 'etf' ? Layers : TrendingUp;

              return (
                <div
                  key={item.id}
                  onClick={() => !added && handleSelectAsset(item)}
                  className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition-all ${
                    added
                      ? isDark
                        ? 'bg-emerald-500/5 border border-emerald-500/20'
                        : 'bg-emerald-50/60 border border-emerald-200'
                      : isDark
                      ? 'hover:bg-[#2c2c2e]/70 active:bg-[#3a3a3c] cursor-pointer'
                      : 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        added
                          ? isDark
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : isDark
                          ? 'bg-[#2c2c2e] border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
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
                        {'isBinanceLive' in item && item.isBinanceLive && (
                          <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 font-mono">
                            <Globe className="h-2.5 w-2.5" />
                            Binance Live
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name}</p>
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
                            ? 'bg-[#2c2c2e] text-blue-400 hover:bg-blue-600 hover:text-white'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-xs'
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
          ) : null}

          {/* Direct Custom Ticker Addition Card (if user typed something not matching or to allow custom ticker addition) */}
          {cleanQuery && cleanQuery.length >= 1 && (
            <div
              className={`mt-3 p-3.5 rounded-2xl border ${
                isDark
                  ? 'bg-[#242426] border-slate-700/80'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold">
                  {hasExactCatalogMatch
                    ? `¿Deseas agregar "${cleanQuery}" con otro tipo de activo?`
                    : `Agregar ticker personalizado: "${cleanQuery}"`}
                </span>
              </div>
              <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Puedes agregar cualquier acción de Wall Street, ETF de EE.UU. o par cripto de Binance.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAddCustom('stock')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+ Acción ({cleanQuery})</span>
                </button>
                <button
                  onClick={() => handleAddCustom('etf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 hover:bg-purple-500/25'
                      : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>+ ETF ({cleanQuery})</span>
                </button>
                <button
                  onClick={() => handleAddCustom('crypto')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>+ Cripto ({cleanQuery}USDT)</span>
                </button>
              </div>
            </div>
          )}

          {matches.length === 0 && !cleanQuery && (
            <div className={`py-10 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Escribe el ticker o nombre para buscar en tiempo real.
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {justAdded.size > 0 ? `✨ ${justAdded.size} activo(s) agregado(s)` : 'Selecciona los activos que deseas seguir'}
          </span>
          <button
            onClick={onClose}
            style={{ backgroundColor: accent.hex }}
            className="rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

