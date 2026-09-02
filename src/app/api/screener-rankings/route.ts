import { NextResponse } from 'next/server';
import { POPULAR_ASSETS_CATALOG } from '@/lib/api/default-data';
import { fetchBinanceKlines } from '@/lib/api/binance';
import { fetchStockKlines, generateDeterministicCandles } from '@/lib/api/yahoo';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '@/lib/quant/backtest-engine';
import { Candle } from '@/lib/types/market';

export const dynamic = 'force-dynamic';

interface RankingEntry {
  id: string;
  symbol: string;
  cleanSymbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'etf';
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

let rankingsCache: CacheState | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET() {
  const now = Date.now();

  if (rankingsCache && rankingsCache.expiresAt > now) {
    return NextResponse.json(
      {
        rankings: rankingsCache.data,
        cachedAt: rankingsCache.cachedAt,
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
      if (asset.type === 'crypto') {
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

    const backtest = runBacktest(candles, DEFAULT_BACKTEST_CONFIG);

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

  rankingsCache = {
    data: results,
    expiresAt: now + CACHE_TTL_MS,
    cachedAt: new Date().toISOString(),
  };

  return NextResponse.json({
    rankings: results,
    cachedAt: rankingsCache.cachedAt,
    isCached: false,
  });
}
