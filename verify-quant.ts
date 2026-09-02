import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './src/lib/quant/backtest-engine';
import { generateDeterministicCandles } from './src/lib/api/yahoo';

const candles = generateDeterministicCandles('BTCUSDT', 250);
console.log(`Generated ${candles.length} candles for test.`);

const result = runBacktest(candles, DEFAULT_BACKTEST_CONFIG);

console.log('--- Backtest Verification ---');
console.log('Initial Capital:', result.initialCapital);
console.log('Final Capital:', result.finalCapital);
console.log('Total Net Profit:', result.totalNetProfit, `(${result.totalNetProfitPct.toFixed(2)}%)`);
console.log('Buy & Hold Profit:', result.buyAndHoldProfit, `(${result.buyAndHoldProfitPct.toFixed(2)}%)`);
console.log('Total Trades:', result.totalTrades);
console.log('Winning Trades:', result.winningTrades);
console.log('Losing Trades:', result.losingTrades);
console.log('Win Rate:', result.winRate, '%');
console.log('Max Drawdown:', result.maxDrawdown, '%', `($${result.maxDrawdownUSD})`);
console.log('Profit Factor:', result.profitFactor);
console.log('Total Fees & Slippage Deducted:', `$${result.totalFeesPaid}`);
console.log('Sample Trade Execution Log (First 2):', result.trades.slice(0, 2));

if (result.trades.length > 0) {
  const firstTrade = result.trades[0];
  console.log('Checking fee deduction on trade:', {
    entryPrice: firstTrade.entryPrice,
    exitPrice: firstTrade.exitPrice,
    fees: firstTrade.fees,
    netPnl: firstTrade.netPnl,
    exitReason: firstTrade.exitReason
  });
}
