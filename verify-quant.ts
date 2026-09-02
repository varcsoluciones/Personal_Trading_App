import { runBacktest, DEFAULT_BACKTEST_CONFIG, runWalkForwardValidation } from './src/lib/quant/backtest-engine';
import { generateDeterministicCandles } from './src/lib/api/yahoo';
import { calculateConfidence } from './src/components/ui/confidence-badge';

console.log('======================================================================');
console.log('  QUANT ENGINE & WALK-FORWARD REGRESSION TEST SUITE');
console.log('======================================================================\n');

const TEST_SYMBOLS = [
  { symbol: 'BTCUSDT', type: 'crypto', desc: 'Cripto Alta Volatilidad' },
  { symbol: 'ETHUSDT', type: 'crypto', desc: 'Cripto Momentum' },
  { symbol: 'SOLUSDT', type: 'crypto', desc: 'Cripto Swing' },
  { symbol: 'VOO',     type: 'etf',    desc: 'ETF S&P 500 Índice' },
  { symbol: 'QQQ',     type: 'etf',    desc: 'ETF Nasdaq Tecnológico' },
  { symbol: 'SCHD',    type: 'etf',    desc: 'ETF Rango / Dividendos' },
  { symbol: 'NVDA',    type: 'stock',  desc: 'Acción Alta Beta / Crecimiento' },
  { symbol: 'AAPL',    type: 'stock',  desc: 'Acción Mega-Cap Alcista' },
  { symbol: 'TSLA',    type: 'stock',  desc: 'Acción Alta Volatilidad Swing' },
  { symbol: 'GOOGL',   type: 'stock',  desc: 'Acción Consolidación / Rango' },
];

let totalTests = 0;
let passedTests = 0;
const detailedSamples: any[] = [];

for (const { symbol, type, desc } of TEST_SYMBOLS) {
  totalTests++;
  const candles = generateDeterministicCandles(symbol, 380);
  const result = runBacktest(candles, DEFAULT_BACKTEST_CONFIG);

  const errors: string[] = [];

  // Check 1: lowSampleWarning presence
  if (result.lowSampleWarning === undefined || typeof result.lowSampleWarning !== 'boolean') {
    errors.push('lowSampleWarning no está presente o no es booleano');
  }

  // Check 2: reliabilityScore and label
  if (
    typeof result.reliabilityScore !== 'number' ||
    result.reliabilityScore < 0 ||
    result.reliabilityScore > 100 ||
    !['ALTA', 'MEDIA', 'BAJA'].includes(result.reliabilityLabel)
  ) {
    errors.push(`reliabilityScore/Label inválido: score=${result.reliabilityScore}, label=${result.reliabilityLabel}`);
  }

  // Check 3: Walk-forward metrics existence
  if (!result.walkForwardMetrics) {
    errors.push('walkForwardMetrics no presente en BacktestResult');
  }

  // Check 4: Individual Trade Fees & Sequence integrity
  let sumTradeFees = 0;
  for (const trade of result.trades) {
    sumTradeFees += trade.fees;

    // Check entry/exit fees combined
    if (trade.fees <= 0 && trade.shares > 0) {
      errors.push(`Trade ${trade.id} tiene comisiones <= 0 (${trade.fees})`);
    }

    // Check Date sequence (entryDate <= exitDate)
    if (new Date(trade.entryDate).getTime() > new Date(trade.exitDate).getTime()) {
      errors.push(`Secuencia invertida en trade ${trade.id}: entry=${trade.entryDate} > exit=${trade.exitDate}`);
    }
  }

  // Check 5: Total fees aggregated vs sum of trades fees
  const diffFees = Math.abs(result.totalFeesPaid - Number(sumTradeFees.toFixed(2)));
  if (diffFees > 0.05) {
    errors.push(`totalFeesPaid (${result.totalFeesPaid}) no coincide con suma de trades (${sumTradeFees.toFixed(2)})`);
  }

  if (errors.length === 0) {
    passedTests++;
    console.log(`✅ [PASS] ${symbol.padEnd(8)} (${type.padEnd(6)}) | Trades: ${String(result.totalTrades).padStart(2)} | Net Profit: ${result.totalNetProfitPct.toFixed(2).padStart(6)}% | WinRate: ${result.winRate.toFixed(1).padStart(5)}% | PF: ${result.profitFactor.toFixed(2).padStart(5)}x | Reliability: ${result.reliabilityScore}/100 (${result.reliabilityLabel})`);
  } else {
    console.error(`❌ [FAIL] ${symbol.padEnd(8)}:`);
    errors.forEach((err) => console.error(`    - ${err}`));
  }

  // Save for detailed reporting
  if (detailedSamples.length < 4) {
    const confidence = calculateConfidence({
      opportunityScore: 80,
      reliabilityScore: result.reliabilityScore,
      lowSampleWarning: result.lowSampleWarning,
      isSimulated: false,
    });

    detailedSamples.push({
      symbol,
      desc,
      trades: result.totalTrades,
      profitFactor: result.profitFactor,
      winRate: result.winRate,
      maxDrawdown: result.maxDrawdown,
      totalFees: result.totalFeesPaid,
      reliabilityScore: result.reliabilityScore,
      reliabilityLabel: result.reliabilityLabel,
      walkForward: result.walkForwardMetrics,
      confidenceBadge: confidence,
    });
  }
}

console.log(`\n----------------------------------------------------------------------`);
console.log(`Resumen de Suite: ${passedTests}/${totalTests} pruebas superadas.`);
console.log(`----------------------------------------------------------------------\n`);

console.log('======================================================================');
console.log('  DETALLE DE VALIDACIÓN WALK-FORWARD & SEMÁFORO DE CONFIANZA');
console.log('======================================================================\n');

for (const s of detailedSamples) {
  console.log(`▶ Símbolo: ${s.symbol} (${s.desc})`);
  console.log(`  • Trades Totales: ${s.trades} | Win Rate: ${s.winRate.toFixed(1)}% | Profit Factor: ${s.profitFactor.toFixed(2)}x | Max DD: -${s.maxDrawdown.toFixed(2)}%`);
  console.log(`  • Comisiones Deducidas (IBKR): $${s.totalFees}`);
  console.log(`  • Walk-Forward:`);
  console.log(`      - Calibración (70%): PF = ${s.walkForward.inSampleProfitFactor.toFixed(2)}x | Win Rate = ${s.walkForward.inSampleWinRate.toFixed(1)}% (n=${s.walkForward.inSampleTrades})`);
  console.log(`      - Validación  (30%): PF = ${s.walkForward.outOfSampleProfitFactor.toFixed(2)}x | Win Rate = ${s.walkForward.outOfSampleWinRate.toFixed(1)}% (n=${s.walkForward.outOfSampleTrades})`);
  console.log(`  • Reliability Score (Robustez Fuera de Muestra): ${s.reliabilityScore}/100 [${s.reliabilityLabel}]`);
  console.log(`  • Semáforo de Confianza Integrado: ${s.confidenceBadge.label} (${s.confidenceBadge.compositeScore}/100) -> ${s.confidenceBadge.sublabel}\n`);
}

if (passedTests < totalTests) {
  process.exit(1);
} else {
  console.log('✨ Todos los criterios de regresión cuantitativa pasaron al 100% exitosamente.\n');
}
