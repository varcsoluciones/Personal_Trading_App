import { evaluateEntryCondition, evaluateExitCondition, calculateDynamicOrderSetup, calculateSuggestedEntry } from './strategy-rules';
import { AssetCategory, Candle, RiskLevel, SignalType, TrendAnalysis, TrendDirection } from '../types/market';
import {
  calculateADX,
  calculateATR,
  calculateEMA,
  calculateRSI,
  detectRSIDivergence,
  calculateVolumeConfirmation,
  aggregateToWeekly,
} from './indicators';

/**
 * Full quantitative diagnostic analyzer for a single asset's historical series
 */
export function analyzeAsset(candles: Candle[]): TrendAnalysis {
  if (!candles || candles.length < 30) {
    return getDefaultAnalysis(candles?.[candles.length - 1]?.close || 100);
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];

  // 1. Calculate Core Indicators
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, Math.min(200, closes.length - 1));
  const rsiValues = calculateRSI(closes, 14);
  const { atr } = calculateATR(candles, 14);
  const { adx, plusDI, minusDI } = calculateADX(candles, 14);

  const lastIdx = closes.length - 1;
  const currentEma20 = ema20[lastIdx];
  const currentEma50 = ema50[lastIdx];
  const currentEma200 = ema200[lastIdx];
  const currentRsi = rsiValues[lastIdx] || 50;
  const currentAtr = atr[lastIdx] || currentPrice * 0.02;
  const currentAdx = adx[lastIdx] || 20;
  const currentPlusDI = plusDI[lastIdx] || 20;
  const currentMinusDI = minusDI[lastIdx] || 20;

  const atrPct = (currentAtr / currentPrice) * 100;

  // 2. Trend Determination & Historical Continuity
  let trend: TrendDirection = 'NEUTRAL';
  const emaDiffPct = ((currentEma20 - currentEma50) / currentEma50) * 100;
  const priceAboveEma20 = currentPrice > currentEma20;
  const priceAboveEma50 = currentPrice > currentEma50;

  if (currentEma20 > currentEma50 && priceAboveEma50 && emaDiffPct > 0.3) {
    trend = 'BULLISH';
  } else if (currentEma20 < currentEma50 && !priceAboveEma50 && emaDiffPct < -0.3) {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  const trendLabel = trend === 'BULLISH' ? 'Alcista' : trend === 'BEARISH' ? 'Bajista' : 'Lateral';

  // 3. Count Time In Trend (Consecutive candles adhering to current trend structure)
  let daysInTrend = 1;
  for (let i = lastIdx - 1; i >= 10; i--) {
    const e20 = ema20[i];
    const e50 = ema50[i];
    if (isNaN(e20) || isNaN(e50)) break;

    let candleTrend: TrendDirection = 'NEUTRAL';
    const diff = ((e20 - e50) / e50) * 100;
    if (e20 > e50 && diff > 0.2) candleTrend = 'BULLISH';
    else if (e20 < e50 && diff < -0.2) candleTrend = 'BEARISH';

    if (candleTrend === trend) {
      daysInTrend++;
    } else {
      break;
    }
  }

  // 4. Reversal Risk / Trend Exhaustion Calculation
  const rsiDiv = detectRSIDivergence(candles, rsiValues, 25);
  const reversalReasons: string[] = [];
  let riskScore = 15; // baseline low risk

  // Factor: RSI extreme conditions
  if (trend === 'BULLISH') {
    if (currentRsi > 75) {
      riskScore += 35;
      reversalReasons.push(`RSI en sobrecompra extrema (${currentRsi.toFixed(1)})`);
    } else if (currentRsi > 68) {
      riskScore += 20;
      reversalReasons.push(`RSI en zona alta de resistencia (${currentRsi.toFixed(1)})`);
    }
    if (rsiDiv === 'BEARISH') {
      riskScore += 35;
      reversalReasons.push('Divergencia bajista detectada en RSI');
    }
    // EMA slope deceleration
    if (lastIdx >= 5) {
      const slopeNow = currentEma20 - ema20[lastIdx - 2];
      const slopePast = ema20[lastIdx - 3] - ema20[lastIdx - 5];
      if (slopeNow < slopePast * 0.4 && slopeNow > 0) {
        riskScore += 15;
        reversalReasons.push('Desaceleración en la pendiente de la EMA 20');
      }
    }
    // ADX exhaustion (trend running out of momentum)
    if (currentAdx > 45 && currentAdx < adx[lastIdx - 2]) {
      riskScore += 20;
      reversalReasons.push(`Agotamiento de impulso tendencial (ADX descendiendo desde ${currentAdx.toFixed(1)})`);
    }
    // Extended time in trend
    if (daysInTrend > 45) {
      riskScore += 15;
      reversalReasons.push(`Tendencia madura y extendida (${daysInTrend} días consecutivos)`);
    }
  } else if (trend === 'BEARISH') {
    if (currentRsi < 25) {
      riskScore += 35;
      reversalReasons.push(`RSI en sobreventa extrema (${currentRsi.toFixed(1)})`);
    } else if (currentRsi < 32) {
      riskScore += 20;
      reversalReasons.push(`RSI en zona baja de soporte (${currentRsi.toFixed(1)})`);
    }
    if (rsiDiv === 'BULLISH') {
      riskScore += 35;
      reversalReasons.push('Divergencia alcista detectada en RSI');
    }
    if (currentAdx > 45 && currentAdx < adx[lastIdx - 2]) {
      riskScore += 20;
      reversalReasons.push(`Agotamiento de presión vendedora (ADX descendiendo desde ${currentAdx.toFixed(1)})`);
    }
    if (daysInTrend > 45) {
      riskScore += 15;
      reversalReasons.push(`Tendencia bajista prolongada (${daysInTrend} días consecutivos)`);
    }
  } else {
    // Range / Neutral
    riskScore = 30;
    reversalReasons.push('Mercado en consolidación lateral sin dirección dominante');
  }

  // Bound risk score between 5% and 95%
  const riskPercentage = Math.min(95, Math.max(5, Math.round(riskScore)));
  let riskLevel: RiskLevel = 'BAJO';
  if (riskPercentage >= 65) riskLevel = 'ALTO';
  else if (riskPercentage >= 40) riskLevel = 'MEDIO';

  if (reversalReasons.length === 0) {
    reversalReasons.push('Estructura técnica sólida y congruente');
  }

  // 5. Volatility & Strength Label
  let strengthLabel: 'Muy Fuerte' | 'Fuerte' | 'Moderada' | 'Débil / Rango' = 'Moderada';
  if (currentAdx >= 35) strengthLabel = 'Muy Fuerte';
  else if (currentAdx >= 25) strengthLabel = 'Fuerte';
  else if (currentAdx >= 18) strengthLabel = 'Moderada';
  else strengthLabel = 'Débil / Rango';

  // 5b. Multi-Timeframe (Weekly) & Volume Confirmations
  const { isConfirmed: volumeConfirmed, volumeRatio } = calculateVolumeConfirmation(candles, 20);

  const weeklyCandles = aggregateToWeekly(candles);
  let weeklyTrend: TrendDirection = 'NEUTRAL';
  if (weeklyCandles.length >= 8) {
    const weeklyCloses = weeklyCandles.map((c) => c.close);
    const wEmaFast = calculateEMA(weeklyCloses, Math.min(20, weeklyCloses.length - 1));
    const wEmaSlow = calculateEMA(weeklyCloses, Math.min(50, weeklyCloses.length - 1));
    const lastWIdx = weeklyCloses.length - 1;
    const currentWEmaFast = wEmaFast[lastWIdx];
    const currentWEmaSlow = wEmaSlow[lastWIdx];
    const currentWClose = weeklyCloses[lastWIdx];

    if (!isNaN(currentWEmaFast) && !isNaN(currentWEmaSlow)) {
      if (currentWEmaFast > currentWEmaSlow && currentWClose >= currentWEmaSlow) {
        weeklyTrend = 'BULLISH';
      } else if (currentWEmaFast < currentWEmaSlow && currentWClose < currentWEmaSlow) {
        weeklyTrend = 'BEARISH';
      }
    } else if (!isNaN(currentWEmaFast)) {
      weeklyTrend = currentWClose >= currentWEmaFast ? 'BULLISH' : 'BEARISH';
    }
  }

  // 6. Signal Determination (Instant State with Volume & Multi-Timeframe Filters)
  let signal: SignalType = 'ESPERAR / MANTENER';
  let signalReason = 'Sin confirmación de alta probabilidad en este momento.';

  const entryCheck = evaluateEntryCondition({
    currentPrice,
    currentEmaFast: currentEma20,
    currentEmaSlow: currentEma50,
    currentRsi,
    prevRsi: rsiValues[lastIdx - 1] || currentRsi,
    currentAdx,
    rsiDiv,
    volumeConfirmed,
    volumeRatio,
    weeklyTrend,
  });

  const exitCheck = evaluateExitCondition({
    currentPrice,
    currentEmaFast: currentEma20,
    currentEmaSlow: currentEma50,
    currentRsi,
  });

  if (entryCheck.shouldEnter) {
    signal = 'OPORTUNIDAD DE ENTRADA';
    signalReason = entryCheck.reason;
  } else if (exitCheck.shouldExit || (trend === 'BEARISH' && currentRsi > 45)) {
    signal = 'OPORTUNIDAD DE SALIDA';
    signalReason = exitCheck.reason;
  } else {
    signal = 'ESPERAR / MANTENER';
    signalReason = trend === 'BULLISH'
      ? 'Tendencia alcista activa en curso. Mantener posición.'
      : 'Consolidación o sin ventaja estadística clara.';
  }

  // 7. Projected Ideal Entry Price & Order Setup (Shared Strategy Calculation)
  const entryCalc = calculateSuggestedEntry(currentPrice, currentEma20, currentAtr, trend, signal);
  const suggestedEntryPrice = entryCalc.suggestedEntryPrice;
  const entryType = entryCalc.entryType;
  const entryLabel = entryCalc.entryLabel;
  const distanceToEntryPct = entryCalc.distanceToEntryPct;

  // Stop Loss & Take Profit calculated strictly from the Projected Entry Price
  const orderCalc = calculateDynamicOrderSetup(suggestedEntryPrice, currentAtr, {
    useAtrStop: true,
    atrMultiplier: 1.5,
    takeProfitRatio: 2.2,
  });

  const suggestedStopLoss = orderCalc.stopLossPrice;
  const suggestedStopLossPct = orderCalc.stopLossPct;
  const suggestedTakeProfit = orderCalc.takeProfitPrice;
  const suggestedTakeProfitPct = orderCalc.takeProfitPct;
  const riskRewardRatio = orderCalc.riskRewardRatio;
  const potentialRiskUSD = orderCalc.potentialRiskUSD;
  const potentialRewardUSD = orderCalc.potentialRewardUSD;

  // 8. Smart Opportunity Categorization & Composite Score (0 - 100)
  let opportunityCategory: AssetCategory = 'trend';
  let categoryLabel = 'Tendencia Fuerte';

  if (atrPct < 1.8 && currentAdx < 28) {
    opportunityCategory = 'stable';
    categoryLabel = 'Más Estable / Conservador';
  } else if (currentAdx < 20) {
    opportunityCategory = 'range';
    categoryLabel = 'Operaciones en Rango';
  } else if (atrPct > 4.2 || (trend === 'BULLISH' && currentAdx > 35)) {
    opportunityCategory = 'volatile';
    categoryLabel = 'Alta Volatilidad / Oportunidades';
  } else {
    opportunityCategory = 'trend';
    categoryLabel = 'Tendencia Fuerte';
  }

  // Compute composite 0-100 Score
  let score = 50;

  // Trend component (+/- 25 pts)
  if (trend === 'BULLISH') score += 20;
  if (trend === 'BEARISH') score -= 15;

  // RSI component (sweet spot 40-55 for buying pullbacks = +20 pts)
  if (currentRsi >= 40 && currentRsi <= 58) score += 20;
  else if (currentRsi < 35 && rsiDiv === 'BULLISH') score += 22;
  else if (currentRsi > 70) score -= 15;

  // ADX strength component (+/- 15 pts)
  if (currentAdx >= 25 && currentPlusDI > currentMinusDI) score += 15;
  else if (currentAdx < 15) score -= 8;

  // Reversal Risk discount (0 to -20 pts)
  if (riskLevel === 'BAJO') score += 10;
  else if (riskLevel === 'ALTO') score -= 20;

  // Volume confirmation adjustment
  if (!volumeConfirmed || volumeRatio < 0.8) score -= 10;
  else if (volumeRatio >= 1.2) score += 6;

  // Multi-timeframe weekly alignment adjustment
  if (weeklyTrend === 'BULLISH') score += 8;
  else if (weeklyTrend === 'BEARISH') score -= 15;

  // Signal component
  if (signal === 'OPORTUNIDAD DE ENTRADA') score += 15;
  if (signal === 'OPORTUNIDAD DE SALIDA') score -= 15;

  const opportunityScore = Math.min(99, Math.max(12, Math.round(score)));

  return {
    trend,
    trendLabel,
    daysInTrend,
    reversalRisk: {
      level: riskLevel,
      percentage: riskPercentage,
      reasons: reversalReasons,
    },
    volatilityMetrics: {
      adx: Number(currentAdx.toFixed(1)),
      plusDI: Number(currentPlusDI.toFixed(1)),
      minusDI: Number(currentMinusDI.toFixed(1)),
      atr: Number(currentAtr.toFixed(4)),
      atrPct: Number(atrPct.toFixed(2)),
      strengthLabel,
    },
    indicators: {
      ema20: Number(currentEma20.toFixed(4)),
      ema50: Number(currentEma50.toFixed(4)),
      ema200: currentEma200 ? Number(currentEma200.toFixed(4)) : undefined,
      rsi: Number(currentRsi.toFixed(1)),
      rsiDivergence: rsiDiv,
    },
    signal,
    signalReason,
    opportunityScore,
    opportunityCategory,
    categoryLabel,
    orderSetup: {
      currentPrice: Number(currentPrice.toFixed(4)),
      suggestedEntryPrice: Number(suggestedEntryPrice.toFixed(4)),
      entryType,
      entryLabel,
      distanceToEntryPct,
      suggestedStopLoss: Number(suggestedStopLoss.toFixed(4)),
      suggestedStopLossPct: Number(suggestedStopLossPct.toFixed(2)),
      suggestedTakeProfit: Number(suggestedTakeProfit.toFixed(4)),
      suggestedTakeProfitPct: Number(suggestedTakeProfitPct.toFixed(2)),
      riskRewardRatio,
      potentialRiskUSD,
      potentialRewardUSD,
    },
  };
}

function getDefaultAnalysis(price: number): TrendAnalysis {
  return {
    trend: 'NEUTRAL',
    trendLabel: 'Lateral',
    daysInTrend: 5,
    reversalRisk: {
      level: 'MEDIO',
      percentage: 45,
      reasons: ['Datos históricos insuficientes para evaluación completa.'],
    },
    volatilityMetrics: {
      adx: 20,
      plusDI: 20,
      minusDI: 20,
      atr: price * 0.02,
      atrPct: 2.0,
      strengthLabel: 'Moderada',
    },
    indicators: {
      ema20: price,
      ema50: price,
      rsi: 50,
      rsiDivergence: 'NONE',
    },
    signal: 'ESPERAR / MANTENER',
    signalReason: 'Recopilando datos de mercado.',
    opportunityScore: 50,
    opportunityCategory: 'stable',
    categoryLabel: 'Más Estable / Conservador',
    orderSetup: {
      currentPrice: price,
      suggestedEntryPrice: price,
      entryType: 'INMEDIATA',
      entryLabel: 'Recopilando datos',
      distanceToEntryPct: 0,
      suggestedStopLoss: price * 0.965,
      suggestedStopLossPct: 3.5,
      suggestedTakeProfit: price * 1.077,
      suggestedTakeProfitPct: 7.7,
      riskRewardRatio: 2.2,
      potentialRiskUSD: price * 0.035,
      potentialRewardUSD: price * 0.077,
    },
  };
}
