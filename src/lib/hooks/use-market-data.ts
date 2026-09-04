'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset, BacktestConfig, BacktestResult, Candle } from '../types/market';
import { DEFAULT_ASSETS_LIST, AssetDefinition, POPULAR_ASSETS_CATALOG } from '../api/default-data';
import { analyzeAsset } from '../quant/trend-analyzer';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '../quant/backtest-engine';
import { usePriceAlerts } from './use-price-alerts';
import { useSettings } from '../context/settings-context';

const WATCHLIST_STORAGE_KEY = 'personal_trading_custom_watchlist_v1';
const ACTIVE_TAB_STORAGE_KEY = 'quantpulse_active_tab_v2';
const SELECTED_ASSET_STORAGE_KEY = 'quantpulse_selected_asset_v2';
const BACKTEST_CONFIG_STORAGE_KEY = 'quantpulse_backtest_config_v2';


export function useMarketData() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const { checkAlerts } = usePriceAlerts();
  const { settings } = useSettings();
  const [selectedAssetId, setSelectedAssetIdState] = useState<string>('BTCUSDT');
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'screener' | 'chart' | 'backtest' | 'portfolio'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>(DEFAULT_BACKTEST_CONFIG);

  // Hydrate persistent state from localStorage
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as 'dashboard' | 'screener' | 'chart' | 'backtest';
      if (savedTab && ['dashboard', 'screener', 'chart', 'backtest'].includes(savedTab)) {
        setActiveTabState(savedTab);
      }
      const savedAsset = localStorage.getItem(SELECTED_ASSET_STORAGE_KEY);
      if (savedAsset) {
        setSelectedAssetIdState(savedAsset);
      }
      const savedConfig = localStorage.getItem(BACKTEST_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setBacktestConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {}
  }, []);

  const setActiveTab = useCallback((tab: 'dashboard' | 'screener' | 'chart' | 'backtest' | 'portfolio') => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch (e) {}
  }, []);

  const setSelectedAssetId = useCallback((id: string) => {
    setSelectedAssetIdState(id);
    try {
      localStorage.setItem(SELECTED_ASSET_STORAGE_KEY, id);
    } catch (e) {}
  }, []);

  // Initialize assets with parallel Promise.allSettled loading
  useEffect(() => {
    async function loadInitialAssets() {
      setIsLoading(true);

      let assetDefs: AssetDefinition[] = DEFAULT_ASSETS_LIST;
      try {
        const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (savedWatchlist) {
          const parsed = JSON.parse(savedWatchlist);
          if (Array.isArray(parsed) && parsed.length > 0) {
            assetDefs = parsed;
          }
        }
      } catch (e) {}

      // Parallel Fetch with Promise.allSettled
      const results = await Promise.allSettled(
        assetDefs.map(async (def) => {
          const cleanId = def.id.replace('/', '').toUpperCase();
          const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${def.type}`);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} for ${def.symbol}`);
          }

          const data = await res.json();
          if (!data.candles || data.candles.length === 0) {
            throw new Error(`No candles returned for ${def.symbol}`);
          }

          const candles: Candle[] = data.candles;
          const lastCandle = candles[candles.length - 1];
          const prevCandle = candles[candles.length - 2] || lastCandle;
          const price = data.price ?? lastCandle.close;
          const change24h = data.change24h ?? (price - prevCandle.close);
          const change24hPct = data.change24hPct ?? (((price - prevCandle.close) / prevCandle.close) * 100);
          const analysis = data.analysis ?? analyzeAsset(candles);

          return {
            id: def.id,
            symbol: def.symbol,
            name: def.name,
            type: def.type,
            price: Number(price.toFixed(4)),
            change24h: Number(change24h.toFixed(4)),
            change24hPct: Number(change24hPct.toFixed(2)),
            high24h: data.high24h ?? lastCandle.high,
            low24h: data.low24h ?? lastCandle.low,
            volume24h: data.volume24h ?? lastCandle.volume,
            candles,
            analysis,
            isSimulated: data.isSimulated || false,
          } as Asset;
        })
      );

      const successfulAssets: Asset[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          successfulAssets.push(r.value);
        } else {
          console.warn(`[MarketData] Could not load data for ${assetDefs[idx]?.symbol}:`, (r as PromiseRejectedResult).reason);
        }
      });

      // Fallback to catalog defaults if custom list returned 0
      if (successfulAssets.length === 0) {
        console.warn('Initial watchlist was empty, reloading catalog defaults...');
        const fallbackResults = await Promise.allSettled(
          DEFAULT_ASSETS_LIST.map(async (def) => {
            const cleanId = def.id.replace('/', '').toUpperCase();
            const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${def.type}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const candles: Candle[] = data.candles;
            const lastCandle = candles[candles.length - 1];
            const prevCandle = candles[candles.length - 2] || lastCandle;
            const price = data.price ?? lastCandle.close;
            return {
              id: def.id,
              symbol: def.symbol,
              name: def.name,
              type: def.type,
              price: Number(price.toFixed(4)),
              change24h: data.change24h ?? Number((price - prevCandle.close).toFixed(4)),
              change24hPct: data.change24hPct ?? Number((((price - prevCandle.close) / prevCandle.close) * 100).toFixed(2)),
              high24h: data.high24h ?? lastCandle.high,
              low24h: data.low24h ?? lastCandle.low,
              volume24h: data.volume24h ?? lastCandle.volume,
              candles,
              analysis: data.analysis ?? analyzeAsset(candles),
              isSimulated: data.isSimulated || false,
            } as Asset;
          })
        );
        fallbackResults.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) successfulAssets.push(r.value);
        });
      }

      setAssets(successfulAssets);

      // Check price alerts with freshly loaded asset prices
      const priceMap: Record<string, number> = {};
      successfulAssets.forEach((a) => {
        priceMap[a.id] = a.price;
        priceMap[a.symbol] = a.price;
      });
      checkAlerts(priceMap);

      if (successfulAssets.length > 0 && !successfulAssets.some(a => a.id === selectedAssetId)) {
        setSelectedAssetId(successfulAssets[0].id);
      }
      setIsLoading(false);
    }

    loadInitialAssets();
  }, []);

  // Manual and periodic refresh handler
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setAssets((prevAssets) => {
      if (prevAssets.length === 0) {
        setIsRefreshing(false);
        return prevAssets;
      }

      (async () => {
        try {
          const results = await Promise.allSettled(
            prevAssets.map(async (asset) => {
              const cleanId = asset.id.replace("/", "").toUpperCase();
              const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${asset.type}`);
              if (!res.ok) return asset;
              const data = await res.json();
              if (!data.candles || data.candles.length === 0) return asset;

              const candles: Candle[] = data.candles;
              const lastCandle = candles[candles.length - 1];
              const prevCandle = candles[candles.length - 2] || lastCandle;
              const price = data.price ?? lastCandle.close;
              const change24h = data.change24h ?? (price - prevCandle.close);
              const change24hPct = data.change24hPct ?? (((price - prevCandle.close) / prevCandle.close) * 100);
              const analysis = data.analysis ?? analyzeAsset(candles);

              return {
                ...asset,
                price: Number(price.toFixed(4)),
                change24h: Number(change24h.toFixed(4)),
                change24hPct: Number(change24hPct.toFixed(2)),
                high24h: data.high24h ?? lastCandle.high,
                low24h: data.low24h ?? lastCandle.low,
                volume24h: data.volume24h ?? lastCandle.volume,
                candles,
                analysis,
              } as Asset;
            })
          );

          const updated: Asset[] = [];
          const priceMap: Record<string, number> = {};

          results.forEach((r, idx) => {
            if (r.status === "fulfilled" && r.value) {
              updated.push(r.value);
              priceMap[r.value.id] = r.value.price;
              priceMap[r.value.symbol] = r.value.price;
            } else {
              updated.push(prevAssets[idx]);
            }
          });

          setAssets(updated);
          checkAlerts(priceMap);
        } catch (err) {
          console.warn("[MarketData] Refresh error:", err);
        } finally {
          setIsRefreshing(false);
        }
      })();

      return prevAssets;
    });
  }, [checkAlerts]);

  // Periodic background refresh based on user settings (30s, 60s default, or 120s)
  useEffect(() => {
    const intervalSec = settings.refreshInterval || 60;
    const intervalMs = intervalSec * 1000;

    const intervalId = setInterval(() => {
      refreshData();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [settings.refreshInterval, refreshData]);


  // Selected asset
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || assets[0] || null;
  }, [assets, selectedAssetId]);

  // Recalculate backtest whenever selectedAsset or backtestConfig changes
  const backtestResult: BacktestResult | null = useMemo(() => {
    if (!selectedAsset || !selectedAsset.candles || selectedAsset.candles.length === 0) {
      return null;
    }
    return runBacktest(selectedAsset.candles, backtestConfig);
  }, [selectedAsset, backtestConfig]);

  // Add new asset to watchlist
  const addAsset = useCallback(
    async (symbol: string, name: string, type: 'crypto' | 'stock' | 'etf') => {
      const cleanId = symbol.replace('/', '').toUpperCase();
      const existing = assets.find((a) => a.id === cleanId || a.symbol === symbol);
      if (existing) {
        setSelectedAssetId(existing.id);
        return;
      }

      try {
        const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${type}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const candles: Candle[] = data.candles || [];

        if (candles.length === 0) {
          alert(`No se encontraron datos históricos de mercado para ${symbol}.`);
          return;
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;
        const price = data.price ?? last.close;
        const change24h = data.change24h ?? (price - prev.close);
        const change24hPct = data.change24hPct ?? (((price - prev.close) / prev.close) * 100);
        const analysis = data.analysis ?? analyzeAsset(candles);

        const newAsset: Asset = {
          id: cleanId,
          symbol,
          name: name || symbol,
          type,
          price: Number(price.toFixed(4)),
          change24h: Number(change24h.toFixed(4)),
          change24hPct: Number(change24hPct.toFixed(2)),
          high24h: data.high24h ?? last.high,
          low24h: data.low24h ?? last.low,
          volume24h: data.volume24h ?? last.volume,
          candles,
          analysis,
          isSimulated: data.isSimulated || false,
        };

        setAssets((prev) => {
          const next = [newAsset, ...prev];
          try {
            const defsToSave = next.map(a => ({ id: a.id, symbol: a.symbol, name: a.name, type: a.type }));
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(defsToSave));
          } catch (e) {}
          return next;
        });

        // Check alerts for new asset price
        checkAlerts({ [newAsset.id]: newAsset.price, [newAsset.symbol]: newAsset.price });
        setSelectedAssetId(newAsset.id);
      } catch (err) {
        console.error(`Failed to add asset ${symbol}:`, err);
        alert(`No se pudo cargar la información para ${symbol}.`);
      }
    },
    [assets]
  );

  // Remove asset from watchlist
  const removeAsset = useCallback((assetId: string) => {
    setAssets((prev) => {
      const filtered = prev.filter((a) => a.id !== assetId);
      try {
        const defsToSave = filtered.map(a => ({ id: a.id, symbol: a.symbol, name: a.name, type: a.type }));
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(defsToSave));
      } catch (e) {}
      return filtered;
    });
  }, []);

  // Update backtest parameters and persist to localStorage
  const updateBacktestConfig = useCallback((updates: Partial<BacktestConfig>) => {
    setBacktestConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(BACKTEST_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  return {
    assets,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    activeTab,
    setActiveTab,
    isLoading,
    isRefreshing,
    refreshData,
    backtestConfig,
    updateBacktestConfig,
    backtestResult,
    addAsset,
    removeAsset,
  };
}
