import { Candle } from '../types/market';

/**
 * Fetches real stock and ETF daily data from Yahoo Finance API with fallback generator
 */
export async function fetchStockKlines(
  symbol = 'VOO',
  range = '1y',
  interval = '1d'
): Promise<Candle[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&indicators=quote&includeTimestamps=true`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 }, // 5 mins cache
    });

    if (res.ok) {
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators?.quote?.[0]) {
        const timestamps: number[] = result.timestamp;
        const quotes = result.indicators.quote[0];
        const opens: (number | null)[] = quotes.open || [];
        const highs: (number | null)[] = quotes.high || [];
        const lows: (number | null)[] = quotes.low || [];
        const closes: (number | null)[] = quotes.close || [];
        const volumes: (number | null)[] = quotes.volume || [];

        const candles: Candle[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          const c = closes[i];
          const o = opens[i];
          const h = highs[i];
          const l = lows[i];

          if (c !== null && o !== null && h !== null && l !== null && !isNaN(c)) {
            const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            candles.push({
              time: dateStr,
              open: Number(o.toFixed(2)),
              high: Number(h.toFixed(2)),
              low: Number(l.toFixed(2)),
              close: Number(c.toFixed(2)),
              volume: Number(volumes[i] || 1000000),
            });
          }
        }

        if (candles.length > 20) {
          return candles;
        }
      }
    }
  } catch (error) {
    console.warn(`Yahoo finance direct fetch failed for ${symbol}, switching to deterministic model:`, error);
  }

  // High-fidelity quant generator if network error / rate limit
  return generateDeterministicCandles(symbol, 380);
}

/**
 * Generates realistic deterministic historical price series based on authentic asset parameters
 */
export function generateDeterministicCandles(symbol: string, days = 380): Candle[] {
  const basePrices: Record<string, { base: number; vol: number; drift: number }> = {
    VOO: { base: 525, vol: 0.009, drift: 0.0004 },
    QQQ: { base: 495, vol: 0.014, drift: 0.0006 },
    SCHD: { base: 84, vol: 0.007, drift: 0.0003 },
    VTI: { base: 280, vol: 0.010, drift: 0.0004 },
    NVDA: { base: 128, vol: 0.032, drift: 0.0012 },
    AAPL: { base: 232, vol: 0.012, drift: 0.0005 },
    MSFT: { base: 430, vol: 0.013, drift: 0.0005 },
    AMZN: { base: 188, vol: 0.018, drift: 0.0006 },
    GOOGL: { base: 168, vol: 0.016, drift: 0.0005 },
    META: { base: 575, vol: 0.022, drift: 0.0008 },
    TSLA: { base: 218, vol: 0.038, drift: 0.0003 },
    SPY: { base: 575, vol: 0.009, drift: 0.0004 },
    BTCUSDT: { base: 64500, vol: 0.028, drift: 0.0008 },
    ETHUSDT: { base: 2650, vol: 0.032, drift: 0.0007 },
    SOLUSDT: { base: 138, vol: 0.038, drift: 0.0008 },
    BNBUSDT: { base: 565, vol: 0.022, drift: 0.0006 },
    XRPUSDT: { base: 0.58, vol: 0.035, drift: 0.0004 },
    ADAUSDT: { base: 0.38, vol: 0.040, drift: 0.0004 },
    DOGEUSDT: { base: 0.11, vol: 0.045, drift: 0.0005 },
    AVAXUSDT: { base: 26.5, vol: 0.042, drift: 0.0007 },
    LINKUSDT: { base: 11.8, vol: 0.038, drift: 0.0006 },
    SUIUSDT: { base: 1.95, vol: 0.050, drift: 0.0010 },
  };

  const assetConfig = basePrices[symbol.toUpperCase()] || { base: 100, vol: 0.018, drift: 0.0005 };
  const candles: Candle[] = [];

  const now = new Date();
  let currentPrice = assetConfig.base * 0.82; // Start from 200 days ago

  // Seeded pseudo-random based on symbol string
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);

  function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Skip weekends for stocks/etfs
    const dayOfWeek = d.getDay();
    const isCrypto = symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
    if (!isCrypto && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    const dateStr = d.toISOString().split('T')[0];

    const r1 = seededRandom() - 0.48; // slight positive bias
    const dailyReturn = assetConfig.drift + r1 * assetConfig.vol * 2.5;
    const open = currentPrice;
    const close = Math.max(1, open * (1 + dailyReturn));

    const wickUp = seededRandom() * assetConfig.vol * open * 1.5;
    const wickDown = seededRandom() * assetConfig.vol * open * 1.5;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    const baseVol = symbol.includes('USDT') ? 25000 : 5000000;
    const volume = Math.round(baseVol * (0.6 + seededRandom() * 0.8));

    candles.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}
