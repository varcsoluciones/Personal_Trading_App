import { NextRequest, NextResponse } from 'next/server';
import { fetchBinanceKlines } from '@/lib/api/binance';
import { normalizeCryptoSymbol } from '@/lib/utils/symbol-normalizer';
import { fetchStockKlines, generateDeterministicCandles } from '@/lib/api/yahoo';
import { analyzeAsset } from '@/lib/quant/trend-analyzer';
import { Candle } from '@/lib/types/market';

export const dynamic = 'force-dynamic';

// In-memory server-side shared cache across requests
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const serverCache = new Map<string, CacheEntry>();

// Cache TTLs in milliseconds
const CRYPTO_CACHE_TTL_MS = 30 * 1000;    // 30 seconds for crypto
const STOCK_CACHE_TTL_MS = 120 * 1000;    // 2 minutes for stocks/ETFs

// Symbol regex validation (Alphanumeric, dots, dashes, underscores, slashes, max 20 chars)
const SYMBOL_REGEX = /^[A-Za-z0-9.\-_=\/]{1,20}$/;

const VALID_INTERVALS = ['1h', '4h', '1d', '1w', '1M'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = (searchParams.get('type') || 'crypto').toLowerCase();
  const rawInterval = searchParams.get('interval') || '1d';
  const interval = VALID_INTERVALS.includes(rawInterval) ? rawInterval : '1d';
  const forceDemo = searchParams.get('demo') === 'true';

  // 1. Validate symbol parameter
  if (!rawSymbol || !SYMBOL_REGEX.test(rawSymbol)) {
    return NextResponse.json(
      { error: 'Parámetro de símbolo inválido. Solo se permiten caracteres alfanuméricos y longitud máxima de 20.' },
      { status: 400 }
    );
  }

  const isCrypto =
    type === 'crypto' ||
    rawSymbol.toUpperCase().includes('USDT') ||
    rawSymbol.toUpperCase().includes('BTC') ||
    rawSymbol.toUpperCase().includes('ETH') ||
    rawSymbol.toUpperCase().includes('SOL') ||
    rawSymbol.toUpperCase().includes('BNB') ||
    rawSymbol.toUpperCase().includes('XRP');

  // Normalize symbol: Crypto always becomes {TICKER}USDT (e.g. ETH -> ETHUSDT, ETHUSD -> ETHUSDT)
  const normalizedSymbol = isCrypto
    ? normalizeCryptoSymbol(rawSymbol)
    : rawSymbol.replace(/[\/\-\s_]/g, '').toUpperCase();

  const cacheKey = `${normalizedSymbol}:${type}:${interval}:${forceDemo}`;
  const now = Date.now();

  // 2. Check Shared Server-Side In-Memory Cache
  const cached = serverCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Server-Cache': 'HIT' },
    });
  }

  try {
    let candles: Candle[] = [];
    let isSimulated = false;

    if (forceDemo) {
      candles = generateDeterministicCandles(normalizedSymbol, 380, interval);
      isSimulated = true;
    } else if (isCrypto) {
      // Primary: Query Binance with validated USDT pair and selected timeframe interval
      candles = await fetchBinanceKlines(normalizedSymbol, interval, 500);

      // Fallback: Query Yahoo Finance with {TICKER}-USD (e.g. ETH-USD)
      if (!candles || candles.length === 0) {
        const yahooCryptoSymbol = normalizedSymbol.replace(/USDT$/, '-USD');
        candles = await fetchStockKlines(yahooCryptoSymbol, undefined, interval);
      }
    } else {
      // Stocks and ETFs via Yahoo Finance
      candles = await fetchStockKlines(rawSymbol, undefined, interval);
    }

    // If intraday data failed for stocks/ETFs, provide clear message instead of silent fallback
    if ((!candles || candles.length === 0) && (interval === '1h' || interval === '4h') && !isCrypto) {
      return NextResponse.json(
        {
          error: `Este activo (${rawSymbol}) no tiene histórico horario (${interval}) disponible más allá del rango soportado por Yahoo Finance.`,
          unsupportedInterval: true,
        },
        { status: 404 }
      );
    }

    // High-fidelity contingency fallback for daily default if network is completely offline
    if (!candles || candles.length === 0) {
      console.warn(`[MarketAPI] Real fetch returned empty for ${normalizedSymbol} (${interval}). Providing fallback.`);
      candles = generateDeterministicCandles(normalizedSymbol, 380, interval);
      isSimulated = true;
    }

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    const price = last.close;
    const change24h = price - prev.close;
    const change24hPct = ((price - prev.close) / prev.close) * 100;

    const analysis = analyzeAsset(candles);

    const payload = {
      symbol: rawSymbol,
      normalizedSymbol,
      interval,
      price: Number(price.toFixed(4)),
      change24h: Number(change24h.toFixed(4)),
      change24hPct: Number(change24hPct.toFixed(2)),
      high24h: last.high,
      low24h: last.low,
      volume24h: last.volume,
      candles,
      analysis,
      isSimulated,
    };

    // Store in shared in-memory cache
    const ttl = isCrypto ? CRYPTO_CACHE_TTL_MS : STOCK_CACHE_TTL_MS;
    serverCache.set(cacheKey, {
      data: payload,
      expiresAt: now + ttl,
    });

    return NextResponse.json(payload, {
      headers: { 'X-Server-Cache': 'MISS' },
    });
  } catch (error) {
    console.error(`Error fetching market data for ${rawSymbol} (${interval}):`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener datos de mercado' },
      { status: 500 }
    );
  }
}
