'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AssetType } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { normalizeCryptoSymbol } from '@/lib/utils/symbol-normalizer';
import {
  X,
  Search,
  Plus,
  Check,
  TrendingUp,
  Coins,
  Layers,
  Sparkles,
  AlertCircle,
  Globe,
  Loader2,
} from 'lucide-react';

interface CatalogAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  isBinanceLive?: boolean;
}

// Curated Popular Assets Catalog
const POPULAR_ASSETS_CATALOG: CatalogAsset[] = [
  // Crypto
  { id: 'BTCUSDT', symbol: 'BTC/USDT', name: 'Bitcoin', type: 'crypto' },
  { id: 'ETHUSDT', symbol: 'ETH/USDT', name: 'Ethereum', type: 'crypto' },
  { id: 'SOLUSDT', symbol: 'SOL/USDT', name: 'Solana', type: 'crypto' },
  { id: 'BNBUSDT', symbol: 'BNB/USDT', name: 'BNB Binance Coin', type: 'crypto' },
  { id: 'XRPUSDT', symbol: 'XRP/USDT', name: 'Ripple XRP', type: 'crypto' },
  { id: 'ADAUSDT', symbol: 'ADA/USDT', name: 'Cardano ADA', type: 'crypto' },
  { id: 'DOGEUSDT', symbol: 'DOGE/USDT', name: 'Dogecoin', type: 'crypto' },
  { id: 'AVAXUSDT', symbol: 'AVAX/USDT', name: 'Avalanche AVAX', type: 'crypto' },
  { id: 'LINKUSDT', symbol: 'LINK/USDT', name: 'Chainlink', type: 'crypto' },
  { id: 'SUIUSDT', symbol: 'SUI/USDT', name: 'Sui Network', type: 'crypto' },
  { id: 'NEARUSDT', symbol: 'NEAR/USDT', name: 'NEAR Protocol', type: 'crypto' },
  { id: 'DOTUSDT', symbol: 'DOT/USDT', name: 'Polkadot', type: 'crypto' },

  // Stocks
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', type: 'stock' },
  { id: 'META', symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
  { id: 'AMD', symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock' },
  { id: 'PLTR', symbol: 'PLTR', name: 'Palantir Technologies', type: 'stock' },
  { id: 'COIN', symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'stock' },

  // ETFs
  { id: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' },
  { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', type: 'etf' },
  { id: 'SCHD', symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf' },
  { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' },
  { id: 'IWM', symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf' },
  { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf' },
  { id: 'IBIT', symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', type: 'etf' },
  { id: 'ETHA', symbol: 'ETHA', name: 'iShares Ethereum Trust ETF', type: 'etf' },
  { id: 'GLD', symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf' },
  { id: 'TLT', symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'etf' },
];

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

  // Combined matches: Curated Catalog + Real-time Binance pairs
  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    const cleanQ = q.replace(/[\/\-\s_]/g, '');
    const normCryptoQ = normalizeCryptoSymbol(q);

    // 1. Filter curated catalog
    let catalogFiltered = POPULAR_ASSETS_CATALOG.filter((item) => {
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }
      if (!q) return true;

      const itemClean = item.symbol.toUpperCase().replace(/[\/\-\s_]/g, '');
      const itemNorm = item.type === 'crypto' ? normalizeCryptoSymbol(item.symbol) : itemClean;

      return (
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
  }, [query, selectedTypeFilter, binanceResults]);

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

  const handleSelectAsset = (item: CatalogAsset) => {
    let symbolToAdd = item.symbol;
    if (item.type === 'crypto') {
      symbolToAdd = normalizeCryptoSymbol(item.symbol);
    }

    onAdd(symbolToAdd, item.name, item.type);
    setJustAdded((prev) => new Set(prev).add(symbolToAdd));
  };

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
              placeholder="Escribe ticker o nombre (ej. ETH, BTC, SOL, VOO, NVDA)..."
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
        <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-80 custom-horizontal-scrollbar">
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
                        {item.isBinanceLive && (
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
          ) : query.trim() ? (
            /* No verified matches found message (No arbitrary unvalidated custom add) */
            <div className="py-10 px-4 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2.5 text-amber-500" />
              <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                No encontramos ese activo
              </h4>
              <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Verifica el símbolo o ticker e intenta de nuevo. Solo se permiten pares y activos reales verificados.
              </p>
            </div>
          ) : (
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
            className="rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
