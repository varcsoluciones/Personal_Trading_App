import { NextRequest, NextResponse } from 'next/server';
import { fetchBinanceKlines } from '@/lib/api/binance';
import { fetchStockKlines } from '@/lib/api/yahoo';
import { analyzeAsset } from '@/lib/quant/trend-analyzer';
import { Candle } from '@/lib/types/market';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = searchParams.get('type') || 'crypto';

  try {
    let candles: Candle[] = [];

    if (type === 'crypto' || symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) {
      const cleanSym = symbol.replace('/', '').replace('-', '').toUpperCase();
      candles = await fetchBinanceKlines(cleanSym, '1d', 200);
      if (!candles || candles.length === 0) {
        candles = await fetchStockKlines(cleanSym);
      }
    } else {
      candles = await fetchStockKlines(symbol);
    }

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        { error: `No data available for symbol ${symbol}` },
        { status: 404 }
      );
    }

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    const price = last.close;
    const change24h = price - prev.close;
    const change24hPct = ((price - prev.close) / prev.close) * 100;

    const analysis = analyzeAsset(candles);

    return NextResponse.json({
      symbol,
      price: Number(price.toFixed(4)),
      change24h: Number(change24h.toFixed(4)),
      change24hPct: Number(change24hPct.toFixed(2)),
      high24h: last.high,
      low24h: last.low,
      volume24h: last.volume,
      candles,
      analysis,
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching market data' },
      { status: 500 }
    );
  }
}
