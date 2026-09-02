'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset, BacktestConfig, BacktestResult, Candle } from '../types/market';
import { DEFAULT_ASSETS_LIST, AssetDefinition } from '../api/default-data';
import { analyzeAsset } from '../quant/trend-analyzer';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '../quant/backtest-engine';

const WATCHLIST_STORAGE_KEY = 'personal_trading_custom_watchlist_v1';

export function useMarketData() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'screener' | 'chart' | 'backtest'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>(DEFAULT_BACKTEST_CONFIG);

  // Initialize assets with parallel Promise.allSettled loading (NO silent fake fallback)
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
          const price = lastCandle.close;
          const change24h = price - prevCandle.close;
          const change24hPct = ((price - prevCandle.close) / prevCandle.close) * 100;
          const analysis = analyzeAsset(candles);

          return {
            id: def.id,
            symbol: def.symbol,
            name: def.name,
            type: def.type,
            price: Number(price.toFixed(4)),
            change24h: Number(change24h.toFixed(4)),
            change24hPct: Number(change24hPct.toFixed(2)),
            high24h: lastCandle.high,
            low24h: lastCandle.low,
            volume24h: lastCandle.volume,
            candles,
            analysis,
          } as Asset;
        })
      );

      const successfulAssets: Asset[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          successfulAssets.push(r.value);
        } else {
          console.warn(`[MarketData] Could not load real data for ${assetDefs[idx]?.symbol}:`, (r as PromiseRejectedResult).reason);
        }
      });

      setAssets(successfulAssets);
      if (successfulAssets.length > 0 && !successfulAssets.some(a => a.id === selectedAssetId)) {
        setSelectedAssetId(successfulAssets[0].id);
      }
      setIsLoading(false);
    }

    loadInitialAssets();
  }, []);

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

  // Add new asset to watchlist (Real API fetch, No silent fake fallback)
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
        const price = last.close;
        const change24h = price - prev.close;
        const change24hPct = ((price - prev.close) / prev.close) * 100;
        const analysis = analyzeAsset(candles);

        const newAsset: Asset = {
          id: cleanId,
          symbol,
          name: name || symbol,
          type,
          price: Number(price.toFixed(4)),
          change24h: Number(change24h.toFixed(4)),
          change24hPct: Number(change24hPct.toFixed(2)),
          high24h: last.high,
          low24h: last.low,
          volume24h: last.volume,
          candles,
          analysis,
        };

        setAssets((prev) => {
          const next = [newAsset, ...prev];
          try {
            const defsToSave = next.map(a => ({ id: a.id, symbol: a.symbol, name: a.name, type: a.type }));
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(defsToSave));
          } catch (e) {}
          return next;
        });
        setSelectedAssetId(newAsset.id);
      } catch (err) {
        console.error(`Failed to add asset ${symbol}:`, err);
        alert(`No se pudo cargar la información en vivo para ${symbol}. Verifica el ticker.`);
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

  // Update backtest parameters
  const updateBacktestConfig = useCallback((updates: Partial<BacktestConfig>) => {
    setBacktestConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    assets,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    activeTab,
    setActiveTab,
    isLoading,
    backtestConfig,
    updateBacktestConfig,
    backtestResult,
    addAsset,
    removeAsset,
  };
}
