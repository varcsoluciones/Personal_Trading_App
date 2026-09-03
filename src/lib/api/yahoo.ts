import { Candle } from '../types/market';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Maps standard unified interval codes ('1h', '4h', '1d', '1w', '1M')
 * to Yahoo Finance query parameters (range, interval).
 */
export function mapIntervalToYahooParams(interval: string): { yahooInterval: string; range: string; isIntraday: boolean } {
  switch (interval) {
    case '1h':
      return { yahooInterval: '1h', range: '730d', isIntraday: true };
    case '4h':
      // Yahoo doesn't support 4h natively, we query 1h and aggregate into 4h bars
      return { yahooInterval: '1h', range: '730d', isIntraday: true };
    case '1w':
      return { yahooInterval: '1wk', range: '5y', isIntraday: false };
    case '1M':
      return { yahooInterval: '1mo', range: '10y', isIntraday: false };
    case '1d':
    default:
      return { yahooInterval: '1d', range: '2y', isIntraday: false };
  }
}

/**
 * Aggregates 1-hour candles into 4-hour candles.
 */
function aggregate1hTo4h(hourlyCandles: Candle[]): Candle[] {
  if (hourlyCandles.length === 0) return [];
  const aggregated: Candle[] = [];

  for (let i = 0; i < hourlyCandles.length; i += 4) {
    const chunk = hourlyCandles.slice(i, i + 4);
    if (chunk.length === 0) continue;

    const open = chunk[0].open;
    const close = chunk[chunk.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    chunk.forEach((c) => {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      volume += c.volume || 0;
    });

    aggregated.push({
      time: chunk[0].time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return aggregated;
}

/**
 * Fetches real stock, ETF and crypto daily/intraday data from Yahoo Finance API.
 */
export async function fetchStockKlines(
  symbol = 'VOO',
  customRange?: string,
  interval = '1d',
  maxRetries = 2
): Promise<Candle[]> {
  const cleanSym = symbol.trim().toUpperCase();
  const hosts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];

  const { yahooInterval, range: defaultRange, isIntraday } = mapIntervalToYahooParams(interval);
  const selectedRange = customRange || defaultRange;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const host = hosts[attempt % hosts.length];
    const url = `${host}/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=${yahooInterval}&range=${selectedRange}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENTS[attempt % USER_AGENTS.length],
          'Accept': '*/*',
        },
        next: { revalidate: isIntraday ? 60 : 300 },
      });

      if (res.status === 429) {
        const retryAfterSec = parseInt(res.headers.get('Retry-After') || '1', 10);
        const waitMs = Math.max(retryAfterSec * 1000, 1000 * (attempt + 1));
        console.warn(`[Yahoo] 429 Rate limited for ${cleanSym}. Retrying in ${waitMs}ms...`);
        if (attempt < maxRetries - 1) {
          await sleep(waitMs);
          continue;
        }
        return [];
      }

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
              const timeVal = isIntraday
                ? timestamps[i]
                : new Date(timestamps[i] * 1000).toISOString().split('T')[0];

              candles.push({
                time: timeVal,
                open: Number(o.toFixed(2)),
                high: Number(h.toFixed(2)),
                low: Number(l.toFixed(2)),
                close: Number(c.toFixed(2)),
                volume: Number(volumes[i] || 1000000),
              });
            }
          }

          if (candles.length > 5) {
            if (interval === '4h') {
              return aggregate1hTo4h(candles);
            }
            return candles;
          }
        }
      }
    } catch (err) {
      console.warn(`[Yahoo] Error on attempt ${attempt + 1} for ${cleanSym}:`, err);
      if (attempt < maxRetries - 1) {
        await sleep(500 * (attempt + 1));
      }
    }
  }

  return [];
}

/**
 * Generates realistic deterministic historical price series for explicit demo mode or testing.
 */
export function generateDeterministicCandles(symbol: string, days = 380, interval = '1d'): Candle[] {
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
    BTCUSDT: { base: 77000, vol: 0.028, drift: 0.0008 },
    ETHUSDT: { base: 2450, vol: 0.032, drift: 0.0007 },
    SOLUSDT: { base: 100, vol: 0.038, drift: 0.0008 },
    BNBUSDT: { base: 680, vol: 0.022, drift: 0.0006 },
    XRPUSDT: { base: 1.35, vol: 0.035, drift: 0.0004 },
    ADAUSDT: { base: 0.20, vol: 0.040, drift: 0.0004 },
    DOGEUSDT: { base: 0.08, vol: 0.045, drift: 0.0005 },
    AVAXUSDT: { base: 7.20, vol: 0.042, drift: 0.0007 },
    LINKUSDT: { base: 11.2, vol: 0.038, drift: 0.0006 },
    SUIUSDT: { base: 0.72, vol: 0.050, drift: 0.0010 },
  };

  const assetConfig = basePrices[symbol.toUpperCase()] || { base: 100, vol: 0.018, drift: 0.0005 };
  const candles: Candle[] = [];

  const now = new Date();
  let currentPrice = assetConfig.base * 0.82;

  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);

  function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const isIntraday = interval === '1h' || interval === '4h';
  const stepMs = interval === '1h' ? 3600 * 1000 : interval === '4h' ? 4 * 3600 * 1000 : 24 * 3600 * 1000;
  const count = isIntraday ? Math.min(days * 4, 400) : days;

  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * stepMs);
    const dayOfWeek = d.getDay();
    const isCrypto = symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
    if (!isCrypto && (dayOfWeek === 0 || dayOfWeek === 6) && !isIntraday) {
      continue;
    }

    const timeVal = isIntraday ? Math.floor(d.getTime() / 1000) : d.toISOString().split('T')[0];

    const r1 = seededRandom() - 0.48;
    const dailyReturn = assetConfig.drift + r1 * assetConfig.vol * (isIntraday ? 0.6 : 2.5);
    const open = currentPrice;
    const close = Math.max(0.01, open * (1 + dailyReturn));

    const wickUp = seededRandom() * assetConfig.vol * open * (isIntraday ? 0.5 : 1.5);
    const wickDown = seededRandom() * assetConfig.vol * open * (isIntraday ? 0.5 : 1.5);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    const baseVol = symbol.includes('USDT') ? 25000 : 5000000;
    const volume = Math.round(baseVol * (0.6 + seededRandom() * 0.8));

    candles.push({
      time: timeVal,
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
