import { BacktestConfig, BacktestResult, Candle, EquityPoint, Trade } from '../types/market';
import { calculateEMA, calculateRSI } from './indicators';

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 1000,
  commissionRate: 0.001, // 0.1% per trade
  slippageRate: 0.0005,  // 0.05% per execution
  rsiPeriod: 14,
  rsiOversold: 38,
  rsiOverbought: 70,
  emaFastPeriod: 20,
  emaSlowPeriod: 50,
  stopLossPct: 3.5,
  takeProfitRatio: 2.2,  // 1:2.2 Risk/Reward
  useAtrStop: false,
};

/**
 * Runs a deterministic historical quantitative backtest on the given asset's candles
 * with real market friction (commissions + slippage).
 */
export function runBacktest(
  candles: Candle[],
  config: Partial<BacktestConfig> = {}
): BacktestResult {
  const cfg: BacktestConfig = { ...DEFAULT_BACKTEST_CONFIG, ...config };
  
  if (!candles || candles.length < Math.max(cfg.emaSlowPeriod, cfg.rsiPeriod) + 10) {
    return getEmptyResult(cfg.initialCapital);
  }

  const closes = candles.map((c) => c.close);
  const emaFast = calculateEMA(closes, cfg.emaFastPeriod);
  const emaSlow = calculateEMA(closes, cfg.emaSlowPeriod);
  const rsi = calculateRSI(closes, cfg.rsiPeriod);

  let capital = cfg.initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';
  let entryIndex = 0;
  let shares = 0;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  const startIdx = Math.max(cfg.emaSlowPeriod, cfg.rsiPeriod);
  const initialAssetPrice = closes[startIdx];
  const buyAndHoldShares = cfg.initialCapital / initialAssetPrice;

  let peakEquity = cfg.initialCapital;
  let maxDrawdownUSD = 0;
  let maxDrawdownPct = 0;
  let totalFeesPaid = 0;

  for (let i = startIdx; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    const currentPrice = candle.close;
    const currentEmaFast = emaFast[i];
    const currentEmaSlow = emaSlow[i];
    const currentRsi = rsi[i];
    const prevRsi = rsi[i - 1];

    // Track current position value
    let currentEquity = capital;
    if (inPosition) {
      currentEquity = shares * currentPrice;
    }

    // Check Buy & Hold benchmark equity
    const buyAndHoldEquity = buyAndHoldShares * currentPrice;

    // Check Drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const currentDrawdownUSD = peakEquity - currentEquity;
    const currentDrawdownPct = peakEquity > 0 ? (currentDrawdownUSD / peakEquity) * 100 : 0;
    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
      maxDrawdownUSD = currentDrawdownUSD;
    }

    // If currently in a trade, check exit conditions (Stop Loss, Take Profit, Signal Reversal)
    if (inPosition) {
      let exitPrice = 0;
      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'END_OF_DATA' = 'SIGNAL_EXIT';

      // 1. Take Profit hit during bar high
      if (candle.high >= takeProfitPrice) {
        exitPrice = takeProfitPrice;
        exitReason = 'TAKE_PROFIT';
      }
      // 2. Stop Loss hit during bar low
      else if (candle.low <= stopLossPrice) {
        exitPrice = stopLossPrice;
        exitReason = 'STOP_LOSS';
      }
      // 3. Technical Exit: RSI overbought or EMA fast cross under EMA slow
      else if (currentRsi >= cfg.rsiOverbought || (currentEmaFast < currentEmaSlow && currentPrice < currentEmaSlow)) {
        exitPrice = currentPrice;
        exitReason = 'SIGNAL_EXIT';
      }
      // 4. End of backtest data
      else if (i === candles.length - 1) {
        exitPrice = currentPrice;
        exitReason = 'END_OF_DATA';
      }

      if (exitPrice > 0) {
        // Apply slippage on exit: selling gets slippage below exit price
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

        trades.push({
          id: `trade-${trades.length + 1}`,
          entryDate,
          exitDate: candle.time,
          type: 'LONG',
          entryPrice: Number(entryPrice.toFixed(4)),
          exitPrice: Number(exitPrice.toFixed(4)),
          shares: Number(shares.toFixed(4)),
          grossPnl: Number(grossPnl.toFixed(2)),
          fees: Number((trades[trades.length - 1]?.fees || 0 + exitFee).toFixed(2)),
          slippageCost: Number(exitSlippage.toFixed(2)),
          netPnl: Number(netPnl.toFixed(2)),
          netPnlPct: Number(netPnlPct.toFixed(2)),
          exitReason,
          capitalAfter: Number(capital.toFixed(2)),
          holdingDays: i - entryIndex,
        });

        inPosition = false;
        shares = 0;
      }
    }

    // If not in position, check Entry Conditions
    if (!inPosition && i < candles.length - 1) {
      // Strategy Rule:
      // Trend: Fast EMA > Slow EMA (Bullish Trend Filter)
      // Momentum: RSI bounced up from oversold region or is in favorable pullback zone
      const trendIsBullish = currentEmaFast > currentEmaSlow && currentPrice > currentEmaSlow;
      const rsiBouncing = prevRsi <= cfg.rsiOversold + 5 && currentRsi > prevRsi && currentRsi < 62;
      const pullbackEntry = trendIsBullish && (rsiBouncing || (currentRsi >= 35 && currentRsi <= 52 && currentPrice >= currentEmaSlow));

      if (pullbackEntry) {
        // Execute Entry
        // Slippage on entry: buying gets slippage above candle close
        const effectiveEntryPrice = currentPrice * (1 + cfg.slippageRate);
        const entryFee = capital * cfg.commissionRate;
        totalFeesPaid += entryFee;

        const investableCapital = capital - entryFee;
        shares = investableCapital / effectiveEntryPrice;
        entryPrice = effectiveEntryPrice;
        entryDate = candle.time;
        entryIndex = i;

        // Set Stop Loss & Take Profit
        const slPct = cfg.stopLossPct / 100;
        stopLossPrice = entryPrice * (1 - slPct);
        const riskAmount = entryPrice - stopLossPrice;
        takeProfitPrice = entryPrice + (riskAmount * cfg.takeProfitRatio);

        inPosition = true;
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
  };
}
