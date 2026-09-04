import { NextRequest, NextResponse } from 'next/server';
import { POPULAR_ASSETS_CATALOG } from '@/lib/api/default-data';
import { fetchBinanceKlines } from '@/lib/api/binance';
import { fetchStockKlines, generateDeterministicCandles } from '@/lib/api/yahoo';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '@/lib/quant/backtest-engine';
import { STRATEGY_PRESETS } from '@/lib/quant/strategy-rules';
import { Candle, BacktestConfig, AssetType } from '@/lib/types/market';

export const dynamic = 'force-dynamic';

interface RankingEntry {
  id: string;
  symbol: string;
  cleanSymbol: string;
  name: string;
  type: AssetType;
  reliabilityScore: number;
  reliabilityLabel: 'ALTA' | 'MEDIA' | 'BAJA';
  profitFactor: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  totalNetProfitPct: number;
}

interface CacheState {
  data: RankingEntry[];
  expiresAt: number;
  cachedAt: string;
}

const rankingsCacheMap = new Map<string, CacheState>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const presetId = (searchParams.get('preset') || 'balanced').toLowerCase();

  const preset = STRATEGY_PRESETS.find((p) => p.id === presetId) || STRATEGY_PRESETS[1];
  const targetConfig: BacktestConfig = {
    ...DEFAULT_BACKTEST_CONFIG,
    ...preset.config,
  };

  const now = Date.now();
  const cached = rankingsCacheMap.get(presetId);

  if (cached && cached.expiresAt > now) {
    return NextResponse.json(
      {
        rankings: cached.data,
        cachedAt: cached.cachedAt,
        preset: presetId,
        isCached: true,
      },
      { headers: { 'X-Server-Cache': 'HIT' } }
    );
  }

  const results: RankingEntry[] = [];

  for (const asset of POPULAR_ASSETS_CATALOG) {
    const cleanSymbol = asset.symbol.replace('/', '').replace('-', '').toUpperCase();
    let candles: Candle[] = [];

    try {
      if (asset.type === 'crypto' || cleanSymbol.endsWith('USDT')) {
        candles = await fetchBinanceKlines(cleanSymbol, '1d', 400);
      } else {
        candles = await fetchStockKlines(asset.symbol, '2y', '1d');
      }
    } catch (e) {
      // ignore
    }

    if (!candles || candles.length === 0) {
      candles = generateDeterministicCandles(cleanSymbol, 380);
    }

    const backtest = runBacktest(candles, targetConfig);

    results.push({
      id: asset.id,
      symbol: asset.symbol,
      cleanSymbol,
      name: asset.name,
      type: asset.type,
      reliabilityScore: backtest.reliabilityScore,
      reliabilityLabel: backtest.reliabilityLabel,
      profitFactor: backtest.profitFactor,
      winRate: backtest.winRate,
      totalTrades: backtest.totalTrades,
      maxDrawdown: backtest.maxDrawdown,
      totalNetProfitPct: backtest.totalNetProfitPct,
    });
  }

  const cacheEntry: CacheState = {
    data: results,
    expiresAt: now + CACHE_TTL_MS,
    cachedAt: new Date().toISOString(),
  };

  rankingsCacheMap.set(presetId, cacheEntry);

  return NextResponse.json({
    rankings: results,
    cachedAt: cacheEntry.cachedAt,
    preset: presetId,
    isCached: false,
  });
}
