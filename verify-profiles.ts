import { generateDeterministicCandles } from './src/lib/api/yahoo';
import { analyzeAsset } from './src/lib/quant/trend-analyzer';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './src/lib/quant/backtest-engine';
import { STRATEGY_PRESETS } from './src/lib/quant/strategy-rules';
import { calculateConfidence } from './src/components/ui/confidence-badge';

const testAssets = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA' },
];

console.log('========================================================================================');
console.log('  COMPARATIVA DE SIMULACIÓN EN VIVO: CONSERVADOR vs EQUILIBRADO vs AGRESIVO');
console.log('========================================================================================\n');

for (const asset of testAssets) {
  const candles = generateDeterministicCandles(asset.symbol, 380);
  console.log(`▶ ACTIVO: ${asset.symbol} (${asset.name})`);
  console.log('----------------------------------------------------------------------------------------');
  console.log('| Perfil        | Stop Loss | Take Profit | R:B   | Plazo Est.  | Opp Score | Confianza Total |');
  console.log('----------------------------------------------------------------------------------------');

  for (const preset of STRATEGY_PRESETS) {
    const analysis = analyzeAsset(candles, preset.config);
    const backtestConfig = { ...DEFAULT_BACKTEST_CONFIG, ...preset.config };
    const backtest = runBacktest(candles, backtestConfig);

    const confidence = calculateConfidence({
      opportunityScore: analysis.opportunityScore,
      reliabilityScore: backtest.reliabilityScore,
      lowSampleWarning: backtest.lowSampleWarning,
      isSimulated: false,
    });

    const slStr = `-${analysis.orderSetup.suggestedStopLossPct}%`.padEnd(9);
    const tpStr = `+${analysis.orderSetup.suggestedTakeProfitPct}%`.padEnd(11);
    const rrStr = `1:${analysis.orderSetup.riskRewardRatio}`.padEnd(5);
    const horizonStr = `${analysis.orderSetup.horizonSuggestion.durationLabel}`.padEnd(11);
    const oppScoreStr = `${analysis.opportunityScore}/100`.padEnd(9);
    const confStr = `${confidence.label} (${confidence.compositeScore}/100)`.padEnd(20);

    console.log(`| ${preset.name.padEnd(13)} | ${slStr} | ${tpStr} | ${rrStr} | ${horizonStr} | ${oppScoreStr} | ${confStr} |`);
  }
  console.log('----------------------------------------------------------------------------------------\n');
}
