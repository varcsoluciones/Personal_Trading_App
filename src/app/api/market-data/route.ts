import { NextRequest, NextResponse } from 'next/server';
import { fetchBinanceKlines } from '@/lib/api/binance';
import { fetchStockKlines } from '@/lib/api/yahoo';
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
const CRYPTO_CACHE_TTL_MS = 60 * 1000;    // 60 seconds for crypto
const STOCK_CACHE_TTL_MS = 180 * 1000;    // 3 minutes for stocks/ETFs

// Symbol regex validation (Alphanumeric, dots, dashes, underscores, max 20 chars)
const SYMBOL_REGEX = /^[A-Za-z0-9.\-_=]{1,20}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = (searchParams.get('type') || 'crypto').toLowerCase();

  // 1. Validate symbol parameter
  if (!rawSymbol || !SYMBOL_REGEX.test(rawSymbol)) {
    return NextResponse.json(
      { error: 'Parámetro de símbolo inválido. Solo se permiten caracteres alfanuméricos y longitud máxima de 20.' },
      { status: 400 }
    );
  }

  const cleanSymbol = rawSymbol.replace('/', '').replace('-', '').toUpperCase();
  const cacheKey = `${cleanSymbol}:${type}`;
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

    const isCrypto =
      type === 'crypto' ||
      cleanSymbol.includes('USDT') ||
      cleanSymbol.includes('BTC') ||
      cleanSymbol.includes('ETH');

    if (isCrypto) {
      candles = await fetchBinanceKlines(cleanSymbol, '1d', 500);
      if (!candles || candles.length === 0) {
        candles = await fetchStockKlines(cleanSymbol, '1y', '1d');
      }
    } else {
      candles = await fetchStockKlines(rawSymbol, '1y', '1d');
    }

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        { error: `Sin datos disponibles para el símbolo ${rawSymbol}` },
        { status: 404 }
      );
    }

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    const price = last.close;
    const change24h = price - prev.close;
    const change24hPct = ((price - prev.close) / prev.close) * 100;

    const analysis = analyzeAsset(candles);

    const payload = {
      symbol: rawSymbol,
      price: Number(price.toFixed(4)),
      change24h: Number(change24h.toFixed(4)),
      change24hPct: Number(change24hPct.toFixed(2)),
      high24h: last.high,
      low24h: last.low,
      volume24h: last.volume,
      candles,
      analysis,
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
    console.error(`Error fetching market data for ${rawSymbol}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener datos de mercado' },
      { status: 500 }
    );
  }
}
