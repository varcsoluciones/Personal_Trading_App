import { BacktestConfig, BacktestResult, Candle, EquityPoint, Trade } from '../types/market';
import { calculateADX, calculateATR, calculateEMA, calculateRSI } from './indicators';
import { evaluateEntryCondition, evaluateExitCondition, calculateDynamicOrderSetup } from './strategy-rules';

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

/**
 * Deterministic quantitative backtest simulation engine without look-ahead bias.
 * Unifies ATR stop loss/take profit, ADX filter, realistic IBKR friction, next-bar Open execution,
 * and conservative intra-bar ambiguity resolution.
 */
export function runBacktest(candles: Candle[], config?: Partial<BacktestConfig>): BacktestResult {
  const cfg: BacktestConfig = { ...DEFAULT_BACKTEST_CONFIG, ...config };

  if (!candles || candles.length < Math.max(cfg.emaSlowPeriod + 10, 50)) {
    return getEmptyResult(cfg.initialCapital);
  }

  const closes = candles.map((c) => c.close);
  const emaFast = calculateEMA(closes, cfg.emaFastPeriod);
  const emaSlow = calculateEMA(closes, cfg.emaSlowPeriod);
  const rsi = calculateRSI(closes, cfg.rsiPeriod);
  const { atr } = calculateATR(candles, 14);
  const { adx } = calculateADX(candles, 14);

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

  // Signal queued at close of candle i for execution at open of candle i+1
  let pendingSignal = false;

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
    const prevCandle = candles[i - 1];
    const currentPrice = candle.close;
    const currentOpen = candle.open;
    const currentEmaFast = emaFast[i];
    const currentEmaSlow = emaSlow[i];
    const currentRsi = rsi[i];
    const prevRsi = rsi[i - 1] || currentRsi;
    const currentAtr = atr[i] || (currentPrice * 0.02);
    const currentAdx = adx[i] || 20;

    // 1. EXECUTE PENDING ENTRY SIGNAL AT CANDLE OPEN (Eliminates look-ahead bias)
    if (pendingSignal && !inPosition) {
      const effectiveEntryPrice = currentOpen * (1 + cfg.slippageRate);
      const entryFee = capital * cfg.commissionRate;
      totalFeesPaid += entryFee;
      entryFeeForThisTrade = entryFee;

      const investableCapital = capital - entryFee;
      shares = investableCapital / effectiveEntryPrice;
      entryPrice = effectiveEntryPrice;
      entryDate = candle.time;
      entryIndex = i;

      // Calculate Stop Loss & Take Profit using shared ATR Strategy Logic
      const orderSetup = calculateDynamicOrderSetup(entryPrice, currentAtr, {
        useAtrStop: cfg.useAtrStop,
        atrMultiplier: 1.5,
        takeProfitRatio: cfg.takeProfitRatio,
        stopLossPct: cfg.stopLossPct,
      });

      stopLossPrice = orderSetup.stopLossPrice;
      takeProfitPrice = orderSetup.takeProfitPrice;
      inPosition = true;
      pendingSignal = false;
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

    // 3. IF NOT IN POSITION, EVALUATE ENTRY SIGNAL AT CLOSE OF CANDLE i
    if (!inPosition && !pendingSignal && i < candles.length - 1) {
      const entryCheck = evaluateEntryCondition({
        currentPrice,
        currentEmaFast,
        currentEmaSlow,
        currentRsi,
        prevRsi,
        currentAdx,
        config: {
          rsiOversold: cfg.rsiOversold,
          emaFastPeriod: cfg.emaFastPeriod,
          emaSlowPeriod: cfg.emaSlowPeriod,
          adxMin: 20, // Filter matching live signals
        },
      });

      if (entryCheck.shouldEnter) {
        pendingSignal = true; // Signal confirmed; enter on next bar open
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
  };
}
