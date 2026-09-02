import { Candle } from '../types/market';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Find first index with non-NaN
  let firstValidIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(data[i])) {
      firstValidIdx = i;
      break;
    }
  }

  if (firstValidIdx === -1 || data.length - firstValidIdx < period) {
    return new Array(data.length).fill(NaN);
  }

  for (let i = 0; i < data.length; i++) {
    if (i < firstValidIdx + period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === firstValidIdx + period - 1) {
      // Seed with SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
      continue;
    }

    const currentPrice = data[i];
    const previousEMA = result[i - 1];
    const currentEMA = (currentPrice - previousEMA) * multiplier + previousEMA;
    result.push(currentEMA);
  }

  return result;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's smoothing method (14 standard)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  // First period average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = 100 - 100 / (1 + rs);
  }

  // Subsequent periods using Wilder's smoothed values
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

/**
 * Calculates True Range (TR) and Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period = 14): { atr: number[]; tr: number[] } {
  const tr: number[] = [];
  const atr: number[] = new Array(candles.length).fill(NaN);

  if (candles.length === 0) return { atr, tr };

  // Calculate TR for each candle
  tr.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prevClose = candles[i - 1].close;

    const hl = current.high - current.low;
    const hpc = Math.abs(current.high - prevClose);
    const lpc = Math.abs(current.low - prevClose);

    tr.push(Math.max(hl, hpc, lpc));
  }

  if (candles.length < period) return { atr, tr };

  // First ATR is the simple mean of TR for period
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += tr[i];
  }
  atr[period - 1] = trSum / period;

  // Wilder's smoothing for subsequent ATR
  for (let i = period; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  return { atr, tr };
}

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

/**
 * Calculates Average Directional Index (ADX) along with +DI and -DI (Wilder's method)
 */
export function calculateADX(candles: Candle[], period = 14): ADXResult {
  const len = candles.length;
  const adx: number[] = new Array(len).fill(NaN);
  const plusDI: number[] = new Array(len).fill(NaN);
  const minusDI: number[] = new Array(len).fill(NaN);

  if (len < period * 2) {
    return { adx, plusDI, minusDI };
  }

  const { tr } = calculateATR(candles, period);
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < len; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  // Initial smoothed TR, +DM, -DM
  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 0; i < period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  const dx: number[] = new Array(len).fill(NaN);

  // Compute +DI and -DI
  for (let i = period - 1; i < len; i++) {
    if (i > period - 1) {
      smoothedTR = smoothedTR - smoothedTR / period + tr[i];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
      smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];
    }

    const pDI = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100;
    const mDI = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100;

    plusDI[i] = pDI;
    minusDI[i] = mDI;

    const diSum = pDI + mDI;
    const diDiff = Math.abs(pDI - mDI);
    dx[i] = diSum === 0 ? 0 : (diDiff / diSum) * 100;
  }

  // Calculate first ADX from DX values
  let dxSum = 0;
  const startAdxIdx = period * 2 - 1;
  for (let i = period - 1; i < startAdxIdx; i++) {
    dxSum += dx[i];
  }
  adx[startAdxIdx - 1] = dxSum / period;

  // Smoothed ADX
  for (let i = startAdxIdx; i < len; i++) {
    adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
  }

  return { adx, plusDI, minusDI };
}

/**
 * Detects RSI Divergence within recent swing peaks and valleys
 */
export function detectRSIDivergence(
  candles: Candle[],
  rsi: number[],
  lookback = 20
): 'BULLISH' | 'BEARISH' | 'NONE' {
  const len = candles.length;
  if (len < lookback || isNaN(rsi[len - 1])) return 'NONE';

  const recentCandles = candles.slice(-lookback);
  const recentRSI = rsi.slice(-lookback);

  // Check Bearish Divergence: Price makes higher high, RSI makes lower high
  let highestPriceIdx = 0;
  let prevHighPriceIdx = -1;

  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > recentCandles[highestPriceIdx].high) {
      prevHighPriceIdx = highestPriceIdx;
      highestPriceIdx = i;
    }
  }

  if (
    highestPriceIdx >= recentCandles.length - 3 &&
    prevHighPriceIdx !== -1 &&
    highestPriceIdx - prevHighPriceIdx >= 3
  ) {
    const p1 = recentCandles[prevHighPriceIdx].high;
    const p2 = recentCandles[highestPriceIdx].high;
    const r1 = recentRSI[prevHighPriceIdx];
    const r2 = recentRSI[highestPriceIdx];

    if (p2 > p1 && r2 < r1 && r2 > 55) {
      return 'BEARISH';
    }
  }

  // Check Bullish Divergence: Price makes lower low, RSI makes higher low
  let lowestPriceIdx = 0;
  let prevLowPriceIdx = -1;

  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].low < recentCandles[lowestPriceIdx].low) {
      prevLowPriceIdx = lowestPriceIdx;
      lowestPriceIdx = i;
    }
  }

  if (
    lowestPriceIdx >= recentCandles.length - 3 &&
    prevLowPriceIdx !== -1 &&
    lowestPriceIdx - prevLowPriceIdx >= 3
  ) {
    const p1 = recentCandles[prevLowPriceIdx].low;
    const p2 = recentCandles[lowestPriceIdx].low;
    const r1 = recentRSI[prevLowPriceIdx];
    const r2 = recentRSI[lowestPriceIdx];

    if (p2 < p1 && r2 > r1 && r2 < 45) {
      return 'BULLISH';
    }
  }

  return 'NONE';
}

/**
 * Calculates standard On-Balance Volume (OBV)
 */
export function calculateOBV(candles: Candle[]): number[] {
  const len = candles.length;
  if (len === 0) return [];
  const obv: number[] = new Array(len).fill(0);
  obv[0] = candles[0].volume || 0;

  for (let i = 1; i < len; i++) {
    const currentClose = candles[i].close;
    const prevClose = candles[i - 1].close;
    const volume = candles[i].volume || 0;

    if (currentClose > prevClose) {
      obv[i] = obv[i - 1] + volume;
    } else if (currentClose < prevClose) {
      obv[i] = obv[i - 1] - volume;
    } else {
      obv[i] = obv[i - 1];
    }
  }
  return obv;
}

/**
 * Validates volume participation by comparing recent average volume against historical average.
 */
export function calculateVolumeConfirmation(
  candles: Candle[],
  lookback = 20,
  recentBars = 4
): { isConfirmed: boolean; volumeRatio: number } {
  const len = candles.length;
  if (len < lookback + recentBars) {
    return { isConfirmed: true, volumeRatio: 1.0 };
  }

  const recentCandles = candles.slice(-recentBars);
  const historicalCandles = candles.slice(-(lookback + recentBars), -recentBars);

  const avgRecent = recentCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / recentBars;
  const avgHist = historicalCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / historicalCandles.length;

  if (avgHist === 0) {
    return { isConfirmed: true, volumeRatio: 1.0 };
  }

  const volumeRatio = Number((avgRecent / avgHist).toFixed(2));
  const isConfirmed = volumeRatio >= 0.85; // Institutional backing threshold

  return { isConfirmed, volumeRatio };
}

/**
 * Aggregates daily candlestick data into weekly OHLCV bars (Monday to Sunday).
 */
export function aggregateToWeekly(dailyCandles: Candle[]): Candle[] {
  if (!dailyCandles || dailyCandles.length === 0) return [];

  const weeklyMap = new Map<string, Candle[]>();

  for (const candle of dailyCandles) {
    const d = new Date(candle.time);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    const weekKey = monday.toISOString().split('T')[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, []);
    }
    weeklyMap.get(weekKey)!.push(candle);
  }

  const weeklyCandles: Candle[] = [];

  weeklyMap.forEach((days, weekKey) => {
    if (days.length === 0) return;
    const open = days[0].open;
    const close = days[days.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    for (const day of days) {
      if (day.high > high) high = day.high;
      if (day.low < low) low = day.low;
      volume += (day.volume || 0);
    }

    weeklyCandles.push({
      time: weekKey,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  });

  return weeklyCandles;
}
