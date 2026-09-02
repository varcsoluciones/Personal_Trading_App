export interface StrategyRulesConfig {
  rsiOversold?: number;
  rsiOverbought?: number;
  emaFastPeriod?: number;
  emaSlowPeriod?: number;
  adxMin?: number;
  atrMultiplier?: number;
  takeProfitRatio?: number;
  useAtrStop?: boolean;
  stopLossPct?: number;
}

export const DEFAULT_STRATEGY_CONFIG: Required<StrategyRulesConfig> = {
  rsiOversold: 38,
  rsiOverbought: 70,
  emaFastPeriod: 20,
  emaSlowPeriod: 50,
  adxMin: 20,
  atrMultiplier: 1.5,
  takeProfitRatio: 2.2,
  useAtrStop: true,
  stopLossPct: 3.5,
};

/**
 * Shared entry condition evaluated by both live trend analyzer and backtest engine.
 * Bullish trend alignment (Fast EMA > Slow EMA), favorable pullback RSI, and ADX strength >= 20.
 */
export function evaluateEntryCondition(params: {
  currentPrice: number;
  currentEmaFast: number;
  currentEmaSlow: number;
  currentRsi: number;
  prevRsi: number;
  currentAdx: number;
  rsiDiv?: "BULLISH" | "BEARISH" | "NONE";
  config?: StrategyRulesConfig;
}): { shouldEnter: boolean; reason: string } {
  const cfg = { ...DEFAULT_STRATEGY_CONFIG, ...params.config };
  const { currentPrice, currentEmaFast, currentEmaSlow, currentRsi, prevRsi, currentAdx, rsiDiv } = params;

  const trendIsBullish = currentEmaFast > currentEmaSlow && currentPrice >= currentEmaSlow;
  const adxFilter = currentAdx >= cfg.adxMin;

  // 1. Pullback to support in bullish trend with healthy RSI and ADX filter
  const rsiPullback = currentRsi >= cfg.rsiOversold && currentRsi <= 58;
  const rsiBouncing = prevRsi <= cfg.rsiOversold + 5 && currentRsi > prevRsi && currentRsi < 62;

  if (trendIsBullish && adxFilter && (rsiPullback || rsiBouncing)) {
    return {
      shouldEnter: true,
      reason: "Retroceso saludable (pullback) hacia soporte con RSI favorable y filtro ADX >= " + cfg.adxMin,
    };
  }

  // 2. Bullish RSI divergence near support
  if (rsiDiv === "BULLISH" && currentRsi < cfg.rsiOversold + 5 && currentPrice >= currentEmaSlow * 0.98) {
    return {
      shouldEnter: true,
      reason: "Divergencia alcista en soporte con alta probabilidad de rebote institucional.",
    };
  }

  return { shouldEnter: false, reason: "Sin confirmación de entrada" };
}

/**
 * Shared exit condition for closing a long trade based on technical exhaustion / reversal.
 */
export function evaluateExitCondition(params: {
  currentPrice: number;
  currentEmaFast: number;
  currentEmaSlow: number;
  currentRsi: number;
  config?: StrategyRulesConfig;
}): { shouldExit: boolean; reason: string } {
  const cfg = { ...DEFAULT_STRATEGY_CONFIG, ...params.config };
  const { currentPrice, currentEmaFast, currentEmaSlow, currentRsi } = params;

  // Overbought RSI exhaustion
  if (currentRsi >= cfg.rsiOverbought) {
    return { shouldExit: true, reason: "Sobrecompra técnica extrema (RSI >= " + cfg.rsiOverbought + ")" };
  }

  // Trend breakdown (Price & Fast EMA cross below Slow EMA)
  if (currentEmaFast < currentEmaSlow && currentPrice < currentEmaSlow) {
    return { shouldExit: true, reason: "Pérdida de estructura alcista (cruce bajista EMA " + cfg.emaFastPeriod + "/" + cfg.emaSlowPeriod + ")" };
  }

  return { shouldExit: false, reason: "Mantener posición" };
}

/**
 * Calculates dynamic Stop Loss and Take Profit levels based on ATR or fixed %.
 * Used identically in live signals and backtesting.
 */
export function calculateDynamicOrderSetup(
  entryPrice: number,
  atr: number,
  config?: StrategyRulesConfig
): {
  stopLossPrice: number;
  takeProfitPrice: number;
  stopLossPct: number;
  takeProfitPct: number;
  riskRewardRatio: number;
  potentialRiskUSD: number;
  potentialRewardUSD: number;
} {
  const cfg = { ...DEFAULT_STRATEGY_CONFIG, ...config };

  let stopLossDistance: number;
  if (cfg.useAtrStop && atr > 0) {
    // ATR-based dynamic stop with a minimum distance of 1.5%
    stopLossDistance = Math.max(atr * cfg.atrMultiplier, entryPrice * 0.015);
  } else {
    // Fixed percentage stop loss
    stopLossDistance = entryPrice * (cfg.stopLossPct / 100);
  }

  const stopLossPrice = Math.max(0.0001, entryPrice - stopLossDistance);
  const stopLossPct = Number((((entryPrice - stopLossPrice) / entryPrice) * 100).toFixed(2));

  const rewardDistance = stopLossDistance * cfg.takeProfitRatio;
  const takeProfitPrice = entryPrice + rewardDistance;
  const takeProfitPct = Number((((takeProfitPrice - entryPrice) / entryPrice) * 100).toFixed(2));

  const riskRewardRatio = Number((takeProfitPct / Math.max(0.01, stopLossPct)).toFixed(2));

  return {
    stopLossPrice: Number(stopLossPrice.toFixed(4)),
    takeProfitPrice: Number(takeProfitPrice.toFixed(4)),
    stopLossPct,
    takeProfitPct,
    riskRewardRatio,
    potentialRiskUSD: Number(stopLossDistance.toFixed(2)),
    potentialRewardUSD: Number(rewardDistance.toFixed(2)),
  };
}

export type EntryStrategyType = 'INMEDIATA' | 'PULLBACK_ESPERADO' | 'REBOTE_SOPORTE';

export interface SuggestedEntryResult {
  suggestedEntryPrice: number;
  entryType: EntryStrategyType;
  entryLabel: string;
  distanceToEntryPct: number;
}

/**
 * Shared suggested entry price calculator.
 * Used identically by live indicators/screener and the backtest limit order execution simulator.
 */
export function calculateSuggestedEntry(
  currentPrice: number,
  currentEma20: number,
  currentAtr: number,
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  signal: 'OPORTUNIDAD DE ENTRADA' | 'OPORTUNIDAD DE SALIDA' | 'ESPERAR / MANTENER'
): SuggestedEntryResult {
  let suggestedEntryPrice = currentPrice;
  let entryType: EntryStrategyType = 'PULLBACK_ESPERADO';
  let entryLabel = 'Esperar retroceso';

  if (signal === 'OPORTUNIDAD DE ENTRADA') {
    suggestedEntryPrice = currentPrice;
    entryType = 'INMEDIATA';
    entryLabel = 'Comprar en Mercado (Pullback Confirmado)';
  } else if (trend === 'BULLISH') {
    // In bullish trend, target pullback to EMA 20 dynamic support
    const pullbackTarget = currentEma20 > 0 && currentPrice > currentEma20
      ? currentEma20
      : currentPrice * 0.985;
    suggestedEntryPrice = Math.min(currentPrice, pullbackTarget);
    entryType = 'PULLBACK_ESPERADO';
    entryLabel = 'Esperar retroceso a EMA 20';
  } else if (trend === 'NEUTRAL') {
    // In range/lateral trend, target lower boundary support
    const rangeLowTarget = Math.max(0.0001, currentPrice - currentAtr * 1.2);
    suggestedEntryPrice = Math.min(currentPrice, rangeLowTarget);
    entryType = 'REBOTE_SOPORTE';
    entryLabel = 'Esperar base del rango';
  } else {
    // In bearish trend, wait for extreme oversold reversal level
    suggestedEntryPrice = Math.max(0.0001, currentPrice * 0.95);
    entryType = 'REBOTE_SOPORTE';
    entryLabel = 'Esperar suelo de sobreventa';
  }

  const distanceToEntryPct = Number(
    (((suggestedEntryPrice - currentPrice) / currentPrice) * 100).toFixed(2)
  );

  return {
    suggestedEntryPrice: Number(suggestedEntryPrice.toFixed(4)),
    entryType,
    entryLabel,
    distanceToEntryPct,
  };
}
