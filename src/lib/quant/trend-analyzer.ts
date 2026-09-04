import { evaluateEntryCondition, evaluateExitCondition, calculateDynamicOrderSetup, calculateSuggestedEntry, StrategyRulesConfig } from './strategy-rules';
import { AssetCategory, Candle, RiskLevel, SignalType, TrendAnalysis, TrendDirection, HorizonSuggestion, TradingHorizon, ScoreBreakdown, ScoreCriterionBreakdown } from '../types/market';
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
export function analyzeAsset(candles: Candle[], config?: StrategyRulesConfig): TrendAnalysis {
  if (!candles || candles.length < 30) {
    return getDefaultAnalysis(candles?.[candles.length - 1]?.close || 100);
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];

  const fastPeriod = config?.emaFastPeriod ?? 20;
  const slowPeriod = config?.emaSlowPeriod ?? 50;
  const rsiPeriod = config?.rsiPeriod ?? 14;

  // 1. Calculate Core Indicators
  const ema20 = calculateEMA(closes, fastPeriod);
  const ema50 = calculateEMA(closes, slowPeriod);
  const ema200 = calculateEMA(closes, Math.min(200, closes.length - 1));
  const rsiValues = calculateRSI(closes, rsiPeriod);
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
    config,
  });

  const exitCheck = evaluateExitCondition({
    currentPrice,
    currentEmaFast: currentEma20,
    currentEmaSlow: currentEma50,
    currentRsi,
    config,
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
  const entryCalc = calculateSuggestedEntry(
    currentPrice,
    currentEma20,
    currentAtr,
    trend,
    signal,
    config?.entryTolerancePct ?? 1.0,
    fastPeriod
  );
  const suggestedEntryPrice = entryCalc.suggestedEntryPrice;
  const entryType = entryCalc.entryType;
  const entryLabel = entryCalc.entryLabel;
  const distanceToEntryPct = entryCalc.distanceToEntryPct;

  // Stop Loss & Take Profit calculated strictly from the Projected Entry Price with dynamic profile config
  const orderCalc = calculateDynamicOrderSetup(suggestedEntryPrice, currentAtr, config || {
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

  // 8. Smart Opportunity Categorization & Proportional Composite Score (0 - 100)
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

  // Compute 100-point proportional composite score across 6 closed criteria (0-100 without saturation)
  const criteriaBreakdown: ScoreCriterionBreakdown[] = [];

  // 1. Estructura Tendencial (Máx 25 pts)
  let trendPoints = 0;
  let trendDesc = 'Mercado lateral en consolidación sin dirección clara';
  let trendStatus: 'positive' | 'neutral' | 'negative' = 'neutral';

  if (trend === 'BULLISH') {
    trendPoints = 15;
    if (emaDiffPct > 0.8 && priceAboveEma20) {
      trendPoints += 5; // fuerte separación y precio sobre media rápida
    } else {
      trendPoints += 2;
    }
    if (currentEma200 && currentPrice > currentEma200) {
      trendPoints += 5; // mercado alcista macro estructural sobre EMA 200
    } else if (!currentEma200) {
      trendPoints += 5;
    }
    trendStatus = trendPoints >= 20 ? 'positive' : 'neutral';
    trendDesc = `Estructura alcista sólida (EMA ${fastPeriod} > EMA ${slowPeriod}${currentEma200 ? ' y sobre EMA 200' : ''})`;
  } else if (trend === 'NEUTRAL') {
    trendPoints = 8;
    trendStatus = 'neutral';
    trendDesc = 'Tendencia neutral / fase de acumulación o rango';
  } else {
    trendPoints = 0;
    trendStatus = 'negative';
    trendDesc = `Estructura bajista (EMA ${fastPeriod} < EMA ${slowPeriod})`;
  }

  criteriaBreakdown.push({
    id: 'trend',
    name: `Estructura Tendencial (EMA ${fastPeriod}/${slowPeriod})`,
    points: trendPoints,
    maxPoints: 25,
    status: trendStatus,
    description: trendDesc,
  });

  const oversold = config?.rsiOversold ?? 38;
  const overbought = config?.rsiOverbought ?? 70;
  const minAdx = config?.adxMin ?? 20;

  // 2. Proximidad a Soporte Dinámico / Zona de Pullback (Máx 20 pts)
  let proximityPoints = 0;
  let proximityDesc = '';
  let proximityStatus: 'positive' | 'neutral' | 'negative' = 'neutral';

  const distToEmaFastPct = Math.abs((currentPrice - currentEma20) / currentEma20) * 100;
  const isAboveSlowEma = currentPrice >= currentEma50 * 0.99;

  if (!isAboveSlowEma) {
    proximityPoints = 0;
    proximityStatus = 'negative';
    proximityDesc = `Precio cotiza por debajo de la EMA ${slowPeriod} de soporte`;
  } else if (distToEmaFastPct <= 0.4) {
    proximityPoints = 20;
    proximityStatus = 'positive';
    proximityDesc = `Retroceso ideal en el soporte exacto de la EMA ${fastPeriod} (distancia: ${distToEmaFastPct.toFixed(2)}%)`;
  } else if (distToEmaFastPct <= 1.0) {
    proximityPoints = 17;
    proximityStatus = 'positive';
    proximityDesc = `Precio en zona óptima de compra a ${distToEmaFastPct.toFixed(2)}% de la EMA ${fastPeriod}`;
  } else if (distToEmaFastPct <= 1.5) {
    proximityPoints = 13;
    proximityStatus = 'positive';
    proximityDesc = `Precio cercano al soporte dinámico (a ${distToEmaFastPct.toFixed(2)}% de EMA ${fastPeriod})`;
  } else if (distToEmaFastPct <= 2.5) {
    proximityPoints = 8;
    proximityStatus = 'neutral';
    proximityDesc = `Precio a distancia moderada del soporte (${distToEmaFastPct.toFixed(2)}%)`;
  } else {
    proximityPoints = 3;
    proximityStatus = 'neutral';
    proximityDesc = `Precio extendido sobre el soporte (a ${distToEmaFastPct.toFixed(2)}% de EMA ${fastPeriod})`;
  }

  criteriaBreakdown.push({
    id: 'proximity',
    name: `Zona de Compra / Soporte EMA ${fastPeriod}`,
    points: proximityPoints,
    maxPoints: 20,
    status: proximityStatus,
    description: proximityDesc,
  });

  // 3. Momentum Técnico RSI & ADX (Máx 20 pts)
  let rsiPart = 0;
  let adxPart = 0;

  // RSI sub-score (0 - 10 pts)
  if (currentRsi >= oversold && currentRsi <= 58) {
    rsiPart = 10;
  } else if (currentRsi < oversold && rsiDiv === 'BULLISH') {
    rsiPart = 10;
  } else if (currentRsi >= 34 && currentRsi <= 62) {
    rsiPart = 7;
  } else if (currentRsi > 62 && currentRsi <= overbought) {
    rsiPart = 4;
  } else {
    rsiPart = 0; // sobrecompra extrema (> 70) o sobreventa rota
  }

  // ADX sub-score (0 - 10 pts)
  if (currentAdx >= 30 && currentPlusDI > currentMinusDI) {
    adxPart = 10;
  } else if (currentAdx >= minAdx && currentPlusDI > currentMinusDI) {
    adxPart = 8;
  } else if (currentAdx >= 16) {
    adxPart = 5;
  } else {
    adxPart = 2; // mercado débil sin inercia
  }

  const momentumPoints = rsiPart + adxPart;
  const momentumStatus = momentumPoints >= 15 ? 'positive' : momentumPoints >= 8 ? 'neutral' : 'negative';
  const momentumDesc = `RSI en ${currentRsi.toFixed(1)} pts (${rsiPart}/10) y ADX con fuerza ${currentAdx.toFixed(1)} (${adxPart}/10)`;

  criteriaBreakdown.push({
    id: 'momentum',
    name: 'Momentum e Impulso (RSI & ADX)',
    points: momentumPoints,
    maxPoints: 20,
    status: momentumStatus,
    description: momentumDesc,
  });

  // 4. Confirmación de Volumen Institucional (Máx 15 pts)
  let volPoints = 0;
  let volDesc = '';
  let volStatus: 'positive' | 'neutral' | 'negative' = 'neutral';

  if (volumeRatio >= 1.4 && volumeConfirmed) {
    volPoints = 15;
    volStatus = 'positive';
    volDesc = `Acumulación institucional fuerte (${volumeRatio.toFixed(2)}x del promedio de 20p)`;
  } else if (volumeRatio >= 1.0 && volumeConfirmed) {
    volPoints = 12;
    volStatus = 'positive';
    volDesc = `Volumen institucional saludable (${volumeRatio.toFixed(2)}x del promedio)`;
  } else if (volumeRatio >= 0.8) {
    volPoints = 8;
    volStatus = 'neutral';
    volDesc = `Volumen de negociación regular (${volumeRatio.toFixed(2)}x del promedio)`;
  } else {
    volPoints = 3;
    volStatus = 'negative';
    volDesc = `Bajo volumen o falta de respaldo (${volumeRatio.toFixed(2)}x del promedio)`;
  }

  criteriaBreakdown.push({
    id: 'volume',
    name: 'Volumen Institucional',
    points: volPoints,
    maxPoints: 15,
    status: volStatus,
    description: volDesc,
  });

  // 5. Alineación Macro Semanal (Máx 10 pts)
  let weeklyPoints = 0;
  let weeklyDesc = '';
  let weeklyStatus: 'positive' | 'neutral' | 'negative' = 'neutral';

  if (weeklyTrend === 'BULLISH') {
    weeklyPoints = 10;
    weeklyStatus = 'positive';
    weeklyDesc = 'Tendencia semanal de fondo alcista (alineación multi-temporal a favor)';
  } else if (weeklyTrend === 'NEUTRAL') {
    weeklyPoints = 5;
    weeklyStatus = 'neutral';
    weeklyDesc = 'Tendencia semanal en consolidación';
  } else {
    weeklyPoints = 0;
    weeklyStatus = 'negative';
    weeklyDesc = 'Tendencia semanal en contra (bajista)';
  }

  criteriaBreakdown.push({
    id: 'weekly',
    name: 'Alineación Macro (Semanal)',
    points: weeklyPoints,
    maxPoints: 10,
    status: weeklyStatus,
    description: weeklyDesc,
  });

  // 6. Control de Riesgo de Reversión (Máx 10 pts)
  let riskPoints = 0;
  let riskDesc = '';
  let riskStatus: 'positive' | 'neutral' | 'negative' = 'neutral';

  if (riskLevel === 'BAJO') {
    riskPoints = 10;
    riskStatus = 'positive';
    riskDesc = 'Bajo riesgo de agotamiento o reversión (estructura limpia)';
  } else if (riskLevel === 'MEDIO') {
    riskPoints = 5;
    riskStatus = 'neutral';
    riskDesc = 'Riesgo de reversión moderado controlado';
  } else {
    riskPoints = 0;
    riskStatus = 'negative';
    riskDesc = `Riesgo alto de reversión (${reversalReasons[0] || 'Agotamiento técnico detectado'})`;
  }

  criteriaBreakdown.push({
    id: 'risk',
    name: 'Control de Riesgo de Reversión',
    points: riskPoints,
    maxPoints: 10,
    status: riskStatus,
    description: riskDesc,
  });

  const rawScore = trendPoints + proximityPoints + momentumPoints + volPoints + weeklyPoints + riskPoints;
  const opportunityScore = Math.min(100, Math.max(5, Math.round(rawScore)));

  const scoreBreakdown: ScoreBreakdown = {
    baseScore: 0,
    totalScore: opportunityScore,
    criteria: criteriaBreakdown,
  };

  const horizonSuggestion = calculateHorizonSuggestion(
    suggestedTakeProfitPct,
    atrPct,
    currentAdx,
    opportunityCategory
  );

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
    scoreBreakdown,
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
      horizonSuggestion,
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
      horizonSuggestion: {
        horizon: 'MEDIANO_PLAZO',
        horizonLabel: 'Mediano Plazo',
        horizonSubtitle: 'Seguimiento de Tendencia',
        estimatedDaysMin: 8,
        estimatedDaysMax: 16,
        estimatedDaysAvg: 12,
        durationLabel: '8 - 16 días',
        rationale: 'Estimación estándar para activos en consolidación.',
      },
    },
  };
}


export function calculateHorizonSuggestion(
  takeProfitPct: number,
  atrPct: number,
  adx: number,
  opportunityCategory: AssetCategory
): HorizonSuggestion {
  const baseDailyMove = Math.max(0.35, atrPct * 0.42);
  let speedMultiplier = 1.0;

  if (adx >= 30) speedMultiplier = 1.35;
  else if (adx < 20) speedMultiplier = 0.75;

  if (opportunityCategory === 'volatile') speedMultiplier *= 1.2;
  if (opportunityCategory === 'stable') speedMultiplier *= 0.85;

  const rawDays = takeProfitPct / (baseDailyMove * speedMultiplier);
  const estimatedDaysAvg = Math.max(3, Math.min(90, Math.round(rawDays)));
  const estimatedDaysMin = Math.max(2, Math.round(estimatedDaysAvg * 0.7));
  const estimatedDaysMax = Math.min(120, Math.round(estimatedDaysAvg * 1.4));

  let horizon: TradingHorizon = 'MEDIANO_PLAZO';
  let horizonLabel: 'Corto Plazo' | 'Mediano Plazo' | 'Largo Plazo' = 'Mediano Plazo';
  let horizonSubtitle = 'Seguimiento de Tendencia';

  if (estimatedDaysAvg <= 8) {
    horizon = 'CORTO_PLAZO';
    horizonLabel = 'Corto Plazo';
    horizonSubtitle = 'Swing Trading Rápido';
  } else if (estimatedDaysAvg > 25) {
    horizon = 'LARGO_PLAZO';
    horizonLabel = 'Largo Plazo';
    horizonSubtitle = 'Posición Estructural';
  }

  const durationLabel = `${estimatedDaysMin} - ${estimatedDaysMax} días`;
  const rationale = `Estimación basada en volatilidad diaria ATR (${atrPct.toFixed(1)}%) y fuerza ADX (${adx.toFixed(0)}) para alcanzar el objetivo de +${takeProfitPct.toFixed(1)}%.`;

  return {
    horizon,
    horizonLabel,
    horizonSubtitle,
    estimatedDaysMin,
    estimatedDaysMax,
    estimatedDaysAvg,
    durationLabel,
    rationale,
  };
}
