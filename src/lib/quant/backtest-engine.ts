import { BacktestConfig, BacktestResult, Candle, EquityPoint, Trade, WalkForwardMetrics } from '../types/market';
import { calculateADX, calculateATR, calculateEMA, calculateRSI, calculateVolumeConfirmation, aggregateToWeekly } from './indicators';
import {
  evaluateEntryCondition,
  evaluateExitCondition,
  calculateDynamicOrderSetup,
  calculateSuggestedEntry,
} from './strategy-rules';

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 1000,
  brokerPreset: 'IBKR_TIERED',
  commissionRate: 0.0005, // 0.05% (Interactive Brokers Tiered: ~$0.0035/share or 0.05%)
  slippageRate: 0.0002,  // 0.02% (Interactive Brokers SmartRouting)
  rsiPeriod: 14,
  rsiOversold: 38,
  rsiOverbought: 70,
  emaFastPeriod: 20,
  emaSlowPeriod: 50,
  stopLossPct: 3.5,
  takeProfitRatio: 2.2,  // 1:2.2 Risk/Reward
  useAtrStop: true,      // Uses ATR dynamic stop matching live signals
};

interface PendingLimitOrder {
  limitPrice: number;
  signalIndex: number;
  signalDate: string;
  signalAtr: number;
  remainingBars: number; // Max bars before cancellation (e.g. 5)
}

/**
 * Core backtest simulation engine.
 * Simulates realistic limit orders matching the projected pullback entry price,
 * with order expiration (5 bars), ATR-based stops, next-candle fills, and IBKR fees.
 */
export function runCoreBacktest(candles: Candle[], config?: Partial<BacktestConfig>): BacktestResult {
  const cfg: BacktestConfig = { ...DEFAULT_BACKTEST_CONFIG, ...config };

  if (!candles || candles.length < Math.max(cfg.emaSlowPeriod + 10, 40)) {
    return getEmptyResult(cfg.initialCapital);
  }

  const closes = candles.map((c) => c.close);
  const emaFast = calculateEMA(closes, cfg.emaFastPeriod);
  const emaSlow = calculateEMA(closes, cfg.emaSlowPeriod);
  const rsi = calculateRSI(closes, cfg.rsiPeriod);
  const { atr } = calculateATR(candles, 14);
  const { adx } = calculateADX(candles, 14);

  // Precompute Weekly Trend Map for Multi-Timeframe Alignment
  const weeklyCandles = aggregateToWeekly(candles);
  const weeklyTrendMap = new Map<string, 'BULLISH' | 'BEARISH' | 'NEUTRAL'> ();

  if (weeklyCandles.length >= 8) {
    const wCloses = weeklyCandles.map((c) => c.close);
    const wEmaFast = calculateEMA(wCloses, Math.min(20, wCloses.length - 1));
    const wEmaSlow = calculateEMA(wCloses, Math.min(50, wCloses.length - 1));
    for (let w = 0; w < weeklyCandles.length; w++) {
      const wClose = wCloses[w];
      const f = wEmaFast[w];
      const s = wEmaSlow[w];
      let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      if (!isNaN(f) && !isNaN(s)) {
        if (f > s && wClose >= s) trend = 'BULLISH';
        else if (f < s && wClose < s) trend = 'BEARISH';
      } else if (!isNaN(f)) {
        trend = wClose >= f ? 'BULLISH' : 'BEARISH';
      }
      weeklyTrendMap.set(weeklyCandles[w].time, trend);
    }
  }

  let capital = cfg.initialCapital;
  let inPosition = false;
  let shares = 0;
  let entryPrice = 0;
  let entryDate = '';
  let entryIndex = 0;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;
  let entryFeeForThisTrade = 0;
  let ambiguousBarsCount = 0;

  // Limit Order state: pending entry at projected pullback price
  let pendingOrder: PendingLimitOrder | null = null;

  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  const startIdx = Math.max(cfg.emaSlowPeriod, cfg.rsiPeriod, 20);
  const initialAssetPrice = candles[startIdx].open || closes[startIdx];
  const buyAndHoldShares = cfg.initialCapital / initialAssetPrice;

  let peakEquity = cfg.initialCapital;
  let maxDrawdownUSD = 0;
  let maxDrawdownPct = 0;
  let totalFeesPaid = 0;

  for (let i = startIdx; i < candles.length; i++) {
    const candle = candles[i];
    const currentPrice = candle.close;
    const currentOpen = candle.open;
    const currentEmaFast = emaFast[i];
    const currentEmaSlow = emaSlow[i];
    const currentRsi = rsi[i];
    const prevRsi = rsi[i - 1] || currentRsi;
    const currentAtr = atr[i] || (currentPrice * 0.02);
    const currentAdx = adx[i] || 20;

    // 1. CHECK FILL FOR PENDING LIMIT ORDER (Simulates order limit execution)
    if (pendingOrder && !inPosition) {
      // Limit order fills if bar low touches or dips below limit price
      const isFilled = candle.low <= pendingOrder.limitPrice || currentOpen <= pendingOrder.limitPrice;

      if (isFilled) {
        // Effective entry price is the limit price (or opening gap down if favorable), with slippage
        const rawFillPrice = Math.min(currentOpen, pendingOrder.limitPrice);
        const effectiveEntryPrice = rawFillPrice * (1 + cfg.slippageRate);
        const entryFee = capital * cfg.commissionRate;
        totalFeesPaid += entryFee;
        entryFeeForThisTrade = entryFee;

        const investableCapital = capital - entryFee;
        shares = investableCapital / effectiveEntryPrice;
        entryPrice = effectiveEntryPrice;
        entryDate = candle.time;
        entryIndex = i;

        // Dynamic Stop Loss & Take Profit from the actual fill price
        const orderSetup = calculateDynamicOrderSetup(entryPrice, pendingOrder.signalAtr, {
          useAtrStop: cfg.useAtrStop,
          atrMultiplier: 1.5,
          takeProfitRatio: cfg.takeProfitRatio,
          stopLossPct: cfg.stopLossPct,
        });

        stopLossPrice = orderSetup.stopLossPrice;
        takeProfitPrice = orderSetup.takeProfitPrice;
        inPosition = true;
        pendingOrder = null;
      } else {
        // Decrement expiration counter
        pendingOrder.remainingBars -= 1;
        if (pendingOrder.remainingBars <= 0) {
          // Order expired without fill
          pendingOrder = null;
        }
      }
    }

    // Track current position value
    let currentEquity = capital;
    if (inPosition) {
      currentEquity = shares * currentPrice;
    }

    // Check Buy & Hold benchmark equity
    const buyAndHoldEquity = buyAndHoldShares * currentPrice;

    // Check Peak & Drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const currentDrawdownUSD = peakEquity - currentEquity;
    const currentDrawdownPct = peakEquity > 0 ? (currentDrawdownUSD / peakEquity) * 100 : 0;
    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
      maxDrawdownUSD = currentDrawdownUSD;
    }

    // 2. IF IN POSITION, CHECK EXITS (Conservative ambiguity handling)
    if (inPosition) {
      let exitPrice = 0;
      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'END_OF_DATA' = 'SIGNAL_EXIT';

      const tpTriggered = candle.high >= takeProfitPrice;
      const slTriggered = candle.low <= stopLossPrice;

      // Conservative check: if BOTH TP and SL were breached in the same bar, assume Stop Loss triggered first
      if (tpTriggered && slTriggered) {
        exitPrice = stopLossPrice;
        exitReason = 'STOP_LOSS';
        ambiguousBarsCount++;
      } else if (tpTriggered) {
        exitPrice = takeProfitPrice;
        exitReason = 'TAKE_PROFIT';
      } else if (slTriggered) {
        exitPrice = stopLossPrice;
        exitReason = 'STOP_LOSS';
      } else {
        // Technical Exit Evaluation
        const exitCheck = evaluateExitCondition({
          currentPrice,
          currentEmaFast,
          currentEmaSlow,
          currentRsi,
          config: {
            rsiOverbought: cfg.rsiOverbought,
            emaFastPeriod: cfg.emaFastPeriod,
            emaSlowPeriod: cfg.emaSlowPeriod,
          },
        });

        if (exitCheck.shouldExit) {
          exitPrice = currentPrice;
          exitReason = 'SIGNAL_EXIT';
        } else if (i === candles.length - 1) {
          exitPrice = currentPrice;
          exitReason = 'END_OF_DATA';
        }
      }

      if (exitPrice > 0) {
        // Apply slippage on exit
        const realizedExitPrice = exitPrice * (1 - cfg.slippageRate);
        const grossValue = shares * realizedExitPrice;
        const exitFee = grossValue * cfg.commissionRate;
        const exitSlippage = shares * (exitPrice - realizedExitPrice);
        const netCapital = grossValue - exitFee;

        totalFeesPaid += exitFee;

        const grossPnl = shares * (exitPrice - entryPrice);
        const netPnl = netCapital - (shares * entryPrice);
        const netPnlPct = ((netCapital - (shares * entryPrice)) / (shares * entryPrice)) * 100;

        capital = netCapital;
        currentEquity = capital;

        // Correct total commissions per trade (Entry Fee + Exit Fee)
        const totalTradeFees = Number((entryFeeForThisTrade + exitFee).toFixed(2));

        trades.push({
          id: `trade-${trades.length + 1}`,
          entryDate,
          exitDate: candle.time,
          type: 'LONG',
          entryPrice: Number(entryPrice.toFixed(4)),
          exitPrice: Number(exitPrice.toFixed(4)),
          shares: Number(shares.toFixed(4)),
          grossPnl: Number(grossPnl.toFixed(2)),
          fees: totalTradeFees,
          slippageCost: Number(exitSlippage.toFixed(2)),
          netPnl: Number(netPnl.toFixed(2)),
          netPnlPct: Number(netPnlPct.toFixed(2)),
          exitReason,
          capitalAfter: Number(capital.toFixed(2)),
          holdingDays: Math.max(1, i - entryIndex),
        });

        inPosition = false;
        shares = 0;
        entryFeeForThisTrade = 0;
      }
    }

    // 3. IF NOT IN POSITION & NO PENDING ORDER, EVALUATE ENTRY AT CLOSE OF CANDLE i
    if (!inPosition && !pendingOrder && i < candles.length - 1) {
      // Find weekly trend corresponding to candle date
      const d = new Date(candle.time);
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
      const weekKey = monday.toISOString().split('T')[0];
      const weeklyTrend = weeklyTrendMap.get(weekKey) || 'NEUTRAL';

      // Calculate volume confirmation up to bar i (no look-ahead bias)
      const { isConfirmed: volumeConfirmed, volumeRatio } = calculateVolumeConfirmation(
        candles.slice(Math.max(0, i - 25), i + 1),
        20
      );

      const entryCheck = evaluateEntryCondition({
        currentPrice,
        currentEmaFast,
        currentEmaSlow,
        currentRsi,
        prevRsi,
        currentAdx,
        volumeConfirmed,
        volumeRatio,
        weeklyTrend,
        config: {
          rsiOversold: cfg.rsiOversold,
          emaFastPeriod: cfg.emaFastPeriod,
          emaSlowPeriod: cfg.emaSlowPeriod,
          adxMin: 20,
          requireVolumeConfirmation: true,
          requireWeeklyAlignment: true,
        },
      });

      if (entryCheck.shouldEnter) {
        // Calculate the exact projected limit entry price using the shared strategy rule
        const trend = currentEmaFast > currentEmaSlow ? 'BULLISH' : 'NEUTRAL';
        const entryPlan = calculateSuggestedEntry(currentPrice, currentEmaFast, currentAtr, trend, 'OPORTUNIDAD DE ENTRADA');

        pendingOrder = {
          limitPrice: entryPlan.suggestedEntryPrice,
          signalIndex: i,
          signalDate: candle.time,
          signalAtr: currentAtr,
          remainingBars: 5, // Order remains active for up to 5 bars
        };
      }
    }

    equityCurve.push({
      date: candle.time,
      equity: Number(currentEquity.toFixed(2)),
      buyAndHoldEquity: Number(buyAndHoldEquity.toFixed(2)),
      drawdownPct: Number(currentDrawdownPct.toFixed(2)),
    });
  }

  // Calculate Aggregated Metrics
  const winningTrades = trades.filter((t) => t.netPnl > 0);
  const losingTrades = trades.filter((t) => t.netPnl <= 0);
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const totalGrossWin = winningTrades.reduce((acc, t) => acc + t.netPnl, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnl, 0));
  const profitFactor = totalGrossLoss > 0 ? totalGrossWin / totalGrossLoss : totalGrossWin > 0 ? 99 : 0;

  const totalNetProfit = capital - cfg.initialCapital;
  const totalNetProfitPct = ((capital - cfg.initialCapital) / cfg.initialCapital) * 100;

  const finalAssetPrice = closes[closes.length - 1];
  const finalBuyAndHoldEquity = buyAndHoldShares * finalAssetPrice;
  const buyAndHoldProfit = finalBuyAndHoldEquity - cfg.initialCapital;
  const buyAndHoldProfitPct = ((finalBuyAndHoldEquity - cfg.initialCapital) / cfg.initialCapital) * 100;

  const avgWinUSD = winningTrades.length > 0 ? totalGrossWin / winningTrades.length : 0;
  const avgLossUSD = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0;
  const avgTradeProfit = totalTrades > 0 ? totalNetProfit / totalTrades : 0;

  return {
    initialCapital: cfg.initialCapital,
    finalCapital: Number(capital.toFixed(2)),
    totalNetProfit: Number(totalNetProfit.toFixed(2)),
    totalNetProfitPct: Number(totalNetProfitPct.toFixed(2)),
    buyAndHoldProfit: Number(buyAndHoldProfit.toFixed(2)),
    buyAndHoldProfitPct: Number(buyAndHoldProfitPct.toFixed(2)),
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownUSD: Number(maxDrawdownUSD.toFixed(2)),
    avgTradeProfit: Number(avgTradeProfit.toFixed(2)),
    avgWinUSD: Number(avgWinUSD.toFixed(2)),
    avgLossUSD: Number(avgLossUSD.toFixed(2)),
    riskRewardRatio: cfg.takeProfitRatio,
    totalFeesPaid: Number(totalFeesPaid.toFixed(2)),
    equityCurve,
    trades: trades.reverse(), // most recent first
    lowSampleWarning: totalTrades < 30,
    ambiguousBarsCount,
    reliabilityScore: 70,
    reliabilityLabel: 'MEDIA',
  };
}

/**
 * Walk-Forward Validation: Splits historical data into 70% In-Sample (Calibration)
 * and 30% Out-of-Sample (Validation) to test model robustness and prevent overfitting.
 */
export function runWalkForwardValidation(
  candles: Candle[],
  config?: Partial<BacktestConfig>
): {
  inSampleResult: BacktestResult;
  outOfSampleResult: BacktestResult;
  reliabilityScore: number;
  reliabilityLabel: 'ALTA' | 'MEDIA' | 'BAJA';
  metrics: WalkForwardMetrics;
} {
  if (!candles || candles.length < 60) {
    const empty = getEmptyResult(config?.initialCapital || 1000);
    return {
      inSampleResult: empty,
      outOfSampleResult: empty,
      reliabilityScore: 50,
      reliabilityLabel: 'MEDIA',
      metrics: {
        inSampleProfitFactor: 0,
        outOfSampleProfitFactor: 0,
        inSampleWinRate: 0,
        outOfSampleWinRate: 0,
        inSampleTrades: 0,
        outOfSampleTrades: 0,
      },
    };
  }

  const splitIdx = Math.floor(candles.length * 0.70);
  const inSampleCandles = candles.slice(0, splitIdx);
  const outOfSampleCandles = candles.slice(splitIdx);

  const inSampleResult = runCoreBacktest(inSampleCandles, config);
  const outOfSampleResult = runCoreBacktest(outOfSampleCandles, config);

  const pfIn = inSampleResult.profitFactor;
  const pfOut = outOfSampleResult.profitFactor;
  const wrIn = inSampleResult.winRate;
  const wrOut = outOfSampleResult.winRate;
  const totalTradesCombined = inSampleResult.totalTrades + outOfSampleResult.totalTrades;

  let score = 70;

  if (outOfSampleResult.totalTrades === 0) {
    score = 45; // No out-of-sample trades triggered
  } else {
    // 1. Profit Factor Persistence (Out-of-sample vs In-sample)
    if (pfOut >= pfIn * 0.85 && pfOut >= 1.2) {
      score += 18;
    } else if (pfOut < pfIn * 0.60 || pfOut < 1.0) {
      score -= 24;
    }

    // 2. Win Rate Stability
    if (Math.abs(wrOut - wrIn) <= 10 && wrOut >= 45) {
      score += 12;
    } else if (wrOut < wrIn - 20 || wrOut < 35) {
      score -= 18;
    }

    // 3. Drawdown degradation check
    if (outOfSampleResult.maxDrawdown > inSampleResult.maxDrawdown * 1.5 && outOfSampleResult.maxDrawdown > 8) {
      score -= 12;
    }
  }

  // 4. Sample size penalty
  if (totalTradesCombined < 30) {
    score = Math.min(score, 68); // Cannot achieve ALTA with n < 30
  }

  score = Math.min(99, Math.max(15, Math.round(score)));

  let label: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
  if (score >= 75 && totalTradesCombined >= 30) {
    label = 'ALTA';
  } else if (score >= 50) {
    label = 'MEDIA';
  } else {
    label = 'BAJA';
  }

  return {
    inSampleResult,
    outOfSampleResult,
    reliabilityScore: score,
    reliabilityLabel: label,
    metrics: {
      inSampleProfitFactor: pfIn,
      outOfSampleProfitFactor: pfOut,
      inSampleWinRate: wrIn,
      outOfSampleWinRate: wrOut,
      inSampleTrades: inSampleResult.totalTrades,
      outOfSampleTrades: outOfSampleResult.totalTrades,
    },
  };
}

/**
 * Main Backtest API: Executes full simulation plus Walk-Forward validation.
 */
export function runBacktest(candles: Candle[], config?: Partial<BacktestConfig>): BacktestResult {
  const fullResult = runCoreBacktest(candles, config);
  const wf = runWalkForwardValidation(candles, config);

  return {
    ...fullResult,
    reliabilityScore: wf.reliabilityScore,
    reliabilityLabel: wf.reliabilityLabel,
    walkForwardMetrics: wf.metrics,
  };
}

function getEmptyResult(initialCapital: number): BacktestResult {
  return {
    initialCapital,
    finalCapital: initialCapital,
    totalNetProfit: 0,
    totalNetProfitPct: 0,
    buyAndHoldProfit: 0,
    buyAndHoldProfitPct: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    maxDrawdownUSD: 0,
    avgTradeProfit: 0,
    avgWinUSD: 0,
    avgLossUSD: 0,
    riskRewardRatio: 2.0,
    totalFeesPaid: 0,
    equityCurve: [],
    trades: [],
    lowSampleWarning: true,
    ambiguousBarsCount: 0,
    reliabilityScore: 50,
    reliabilityLabel: 'MEDIA',
    walkForwardMetrics: {
      inSampleProfitFactor: 0,
      outOfSampleProfitFactor: 0,
      inSampleWinRate: 0,
      outOfSampleWinRate: 0,
      inSampleTrades: 0,
      outOfSampleTrades: 0,
    },
  };
}
