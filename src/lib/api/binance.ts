import { Candle } from '../types/market';

/**
 * Fetches real historical candlestick data from Binance's public REST API
 */
export async function fetchBinanceKlines(
  symbol = 'BTCUSDT',
  interval = '1d',
  limit = 200
): Promise<Candle[]> {
  try {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'QuantPulse/1.0' },
      next: { revalidate: 60 }, // cache for 60 seconds
    });

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.statusText}`);
    }

    const data: (string | number)[][] = await res.json();

    const candles: Candle[] = data.map((k) => {
      const openTime = new Date(Number(k[0]));
      const dateStr = openTime.toISOString().split('T')[0];
      return {
        time: dateStr,
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      };
    });

    return candles;
  } catch (error) {
    console.warn(`Failed to fetch Binance data for ${symbol}:`, error);
    return [];
  }
}
