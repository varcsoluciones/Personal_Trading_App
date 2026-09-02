import { Candle } from '../types/market';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches real historical candlestick data from Binance public REST API with 429 backoff retries.
 */
export async function fetchBinanceKlines(
  symbol = 'BTCUSDT',
  interval = '1d',
  limit = 500,
  maxRetries = 3
): Promise<Candle[]> {
  const formattedSymbol = symbol.replace('/', '').toUpperCase();
  const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PersonalTradingApp/1.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // cache for 60 seconds
      });

      if (res.status === 429) {
        const retryAfterSec = parseInt(res.headers.get('Retry-After') || '1', 10);
        const waitMs = Math.max(retryAfterSec * 1000, attempt * 1000);
        console.warn(`[Binance] Rate limit 429 for ${symbol}. Waiting ${waitMs}ms (attempt ${attempt}/${maxRetries})...`);
        if (attempt < maxRetries) {
          await sleep(waitMs);
          continue;
        }
        return [];
      }

      if (!res.ok) {
        throw new Error(`Binance API HTTP ${res.status}: ${res.statusText}`);
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
      console.warn(`[Binance] Fetch attempt ${attempt} failed for ${symbol}:`, error);
      if (attempt < maxRetries) {
        await sleep(attempt * 800);
      }
    }
  }

  return [];
}
