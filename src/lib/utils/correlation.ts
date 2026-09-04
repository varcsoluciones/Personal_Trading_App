import { Candle } from '@/lib/types/market';

/**
 * Calculates the Pearson correlation coefficient on daily percentage returns of two candle series.
 * Uses the last `lookbackDays` common days between both series.
 * Returns a value between -1.0 and 1.0 (or 0 if insufficient data).
 */
export function calculatePriceCorrelation(
  candlesA: Candle[],
  candlesB: Candle[],
  lookbackDays: number = 60
): number {
  if (!candlesA || !candlesB || candlesA.length < 5 || candlesB.length < 5) {
    return 0;
  }

  // Normalize candle timestamp/time to YYYY-MM-DD
  const normalizeDate = (time: number | string): string => {
    if (typeof time === 'number') {
      const d = new Date(time * 1000);
      return d.toISOString().split('T')[0];
    }
    return String(time).split('T')[0];
  };

  const mapA = new Map<string, number>();
  for (const c of candlesA) {
    mapA.set(normalizeDate(c.time), c.close);
  }

  const mapB = new Map<string, number>();
  for (const c of candlesB) {
    mapB.set(normalizeDate(c.time), c.close);
  }

  // Find common dates in ascending order
  const commonDates = Array.from(mapA.keys())
    .filter((date) => mapB.has(date))
    .sort();

  if (commonDates.length < 5) return 0;

  // Take the most recent lookbackDays + 1 dates to compute percentage returns
  const targetDates = commonDates.slice(-Math.min(commonDates.length, lookbackDays + 1));
  if (targetDates.length < 3) return 0;

  const returnsA: number[] = [];
  const returnsB: number[] = [];

  for (let i = 1; i < targetDates.length; i++) {
    const prevDate = targetDates[i - 1];
    const currDate = targetDates[i];

    const pA0 = mapA.get(prevDate)!;
    const pA1 = mapA.get(currDate)!;
    const pB0 = mapB.get(prevDate)!;
    const pB1 = mapB.get(currDate)!;

    if (pA0 > 0 && pB0 > 0) {
      returnsA.push((pA1 - pA0) / pA0);
      returnsB.push((pB1 - pB0) / pB0);
    }
  }

  const n = returnsA.length;
  if (n < 3) return 0;

  const meanA = returnsA.reduce((sum, val) => sum + val, 0) / n;
  const meanB = returnsB.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = returnsA[i] - meanA;
    const diffB = returnsB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denominator = Math.sqrt(denomA * denomB);
  if (denominator === 0) return 0;

  const r = numerator / denominator;
  return Math.max(-1, Math.min(1, Number(r.toFixed(3))));
}
