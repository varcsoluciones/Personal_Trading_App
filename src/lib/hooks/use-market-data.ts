'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset, BacktestConfig, BacktestResult, Candle } from '../types/market';
import { DEFAULT_ASSETS_LIST, AssetDefinition } from '../api/default-data';
import { analyzeAsset } from '../quant/trend-analyzer';
import { generateDeterministicCandles } from '../api/yahoo';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '../quant/backtest-engine';

const WATCHLIST_STORAGE_KEY = 'personal_trading_custom_watchlist_v1';

export function useMarketData() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'screener' | 'chart' | 'backtest'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>(DEFAULT_BACKTEST_CONFIG);

  // Initialize assets with precalculated quant models
  useEffect(() => {
    async function loadInitialAssets() {
      setIsLoading(true);
      const initialAssets: Asset[] = [];

      let assetDefs = DEFAULT_ASSETS_LIST;
      try {
        const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (savedWatchlist) {
          const parsed = JSON.parse(savedWatchlist);
          if (Array.isArray(parsed) && parsed.length > 0) {
            assetDefs = parsed;
          }
        }
      } catch (e) {}

      for (const def of assetDefs) {
        try {
          // Generate or fetch candles
          const cleanId = def.id.replace('/', '').toUpperCase();
          const isCrypto = def.type === 'crypto';
          
          let candles: Candle[] = [];
          
          // Try fetching from internal API
          try {
            const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${def.type}`);
            if (res.ok) {
              const data = await res.json();
              if (data.candles && data.candles.length > 0) {
                candles = data.candles;
              }
            }
          } catch (e) {
            // fallback if fetch fails
          }

          if (candles.length === 0) {
            candles = generateDeterministicCandles(cleanId, 380);
          }

          const lastCandle = candles[candles.length - 1];
          const prevCandle = candles[candles.length - 2] || lastCandle;
          const price = lastCandle.close;
          const change24h = price - prevCandle.close;
          const change24hPct = ((price - prevCandle.close) / prevCandle.close) * 100;
          const analysis = analyzeAsset(candles);

          initialAssets.push({
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
          });
        } catch (err) {
          console.error(`Error loading asset ${def.symbol}:`, err);
        }
      }

      setAssets(initialAssets);
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

  // Add new asset to watchlist
  const addAsset = useCallback(
    async (symbol: string, name: string, type: 'crypto' | 'stock' | 'etf') => {
      const cleanId = symbol.replace('/', '').toUpperCase();
      const existing = assets.find((a) => a.id === cleanId || a.symbol === symbol);
      if (existing) {
        setSelectedAssetId(existing.id);
        return;
      }

      let candles: Candle[] = [];
      try {
        const res = await fetch(`/api/market-data?symbol=${cleanId}&type=${type}`);
        if (res.ok) {
          const data = await res.json();
          candles = data.candles || [];
        }
      } catch (e) {
        // Fallback
      }

      if (candles.length === 0) {
        candles = generateDeterministicCandles(cleanId, 380);
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
