import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface BinanceSymbolItem {
  symbol: string;
  baseAsset: string;
}

// In-memory cache for Binance symbols (24 hours TTL)
let cachedSymbols: BinanceSymbolItem[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchBinanceExchangeSymbols(): Promise<BinanceSymbolItem[]> {
  const now = Date.now();
  if (cachedSymbols && cacheExpiresAt > now) {
    return cachedSymbols;
  }

  try {
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      headers: {
        'User-Agent': 'QuantPulse-Pro/1.0',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Binance exchangeInfo returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.symbols)) {
      const filtered: BinanceSymbolItem[] = data.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
        .map((s: any) => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
        }));

      if (filtered.length > 0) {
        cachedSymbols = filtered;
        cacheExpiresAt = now + CACHE_TTL_MS;
        return filtered;
      }
    }
  } catch (err) {
    console.warn('[CryptoSymbolsAPI] Failed to fetch Binance exchangeInfo, using fallback:', err);
  }

  // Fallback list of top active Binance pairs if external fetch is unavailable
  const fallbackList: BinanceSymbolItem[] = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB' },
    { symbol: 'XRPUSDT', baseAsset: 'XRP' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA' },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE' },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX' },
    { symbol: 'LINKUSDT', baseAsset: 'LINK' },
    { symbol: 'SUIUSDT', baseAsset: 'SUI' },
    { symbol: 'NEARUSDT', baseAsset: 'NEAR' },
    { symbol: 'DOTUSDT', baseAsset: 'DOT' },
    { symbol: 'PEPEUSDT', baseAsset: 'PEPE' },
    { symbol: 'SHIBUSDT', baseAsset: 'SHIB' },
    { symbol: 'LTCUSDT', baseAsset: 'LTC' },
    { symbol: 'RENDERUSDT', baseAsset: 'RENDER' },
    { symbol: 'FETUSDT', baseAsset: 'FET' },
    { symbol: 'TAOUSDT', baseAsset: 'TAO' },
    { symbol: 'AAVEUSDT', baseAsset: 'AAVE' },
    { symbol: 'UNIUSDT', baseAsset: 'UNI' },
  ];

  return fallbackList;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  const allSymbols = await fetchBinanceExchangeSymbols();

  if (!q) {
    return NextResponse.json({ symbols: allSymbols.slice(0, 50) });
  }

  const cleanQuery = q.toUpperCase().replace(/[\/\-\s_]/g, '');
  const baseQuery = cleanQuery.replace(/USDT$/, '').replace(/USD$/, '');

  // Match symbols based on exact base, startsWith, or contains
  const matching = allSymbols
    .filter(
      (item) =>
        item.symbol.includes(cleanQuery) ||
        item.baseAsset.includes(baseQuery) ||
        item.symbol.includes(baseQuery)
    )
    .sort((a, b) => {
      // Prioritize exact base match
      const aExact = a.baseAsset === baseQuery || a.symbol === cleanQuery;
      const bExact = b.baseAsset === baseQuery || b.symbol === cleanQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Prioritize prefix match
      const aPrefix = a.baseAsset.startsWith(baseQuery);
      const bPrefix = b.baseAsset.startsWith(baseQuery);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;

      return a.symbol.localeCompare(b.symbol);
    })
    .slice(0, 30);

  return NextResponse.json({ symbols: matching });
}
