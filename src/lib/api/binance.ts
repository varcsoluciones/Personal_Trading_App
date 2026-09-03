import { Candle } from '../types/market';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches real historical candlestick data from Binance public REST API with 429 backoff retries.
 * Supports intervals: '1h', '4h', '1d', '1w', '1M'.
 */
export async function fetchBinanceKlines(
  symbol = 'BTCUSDT',
  interval = '1d',
  limit = 500,
  maxRetries = 3
): Promise<Candle[]> {
  const formattedSymbol = symbol.replace('/', '').replace('-', '').toUpperCase();
  const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PersonalTradingApp/1.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 30 }, // cache for 30 seconds
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
      const isIntraday = interval === '1h' || interval === '4h';

      const candles: Candle[] = data.map((k) => {
        const openTimeMs = Number(k[0]);
        // For intraday, use numeric unix seconds for precise candlestick placement
        const timeVal = isIntraday
          ? Math.floor(openTimeMs / 1000)
          : new Date(openTimeMs).toISOString().split('T')[0];

        return {
          time: timeVal,
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
