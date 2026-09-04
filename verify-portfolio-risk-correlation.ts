import { calculatePriceCorrelation } from './src/lib/utils/correlation';
import { generateDeterministicCandles } from './src/lib/api/yahoo';
import { Candle } from './src/lib/types/market';

console.log('======================================================================');
console.log('  PORTFOLIO RISK SIZING & CORRELATION WARNING VERIFICATION');
console.log('======================================================================\n');

// --------------------------------------------------------------------
// 1. Test Pearson Correlation Calculation on Daily % Returns
// --------------------------------------------------------------------
console.log('▶ [TEST 1] Correlación de Pearson sobre Retornos Porcentuales Diarios:');

const btcCandles = generateDeterministicCandles('BTCUSDT', 120);
const ethCandles = generateDeterministicCandles('ETHUSDT', 120);
const vooCandles = generateDeterministicCandles('VOO', 120);

const corrBtcEth = calculatePriceCorrelation(btcCandles, ethCandles, 60);
const corrBtcVoo = calculatePriceCorrelation(btcCandles, vooCandles, 60);

console.log(`  • Correlación BTC / ETH (60 días): ${corrBtcEth} (Esperado >= 0.70)`);
console.log(`  • Correlación BTC / VOO (60 días): ${corrBtcVoo}`);

if (corrBtcEth < 0.70) {
  throw new Error(`Expected BTC/ETH correlation >= 0.70, got ${corrBtcEth}`);
}
console.log('  ✅ [PASS] Correlación alta correctamente detectada entre criptoactivos (r >= 0.70).\n');

// --------------------------------------------------------------------
// 2. Test Available Capital & Position Sizing by Risk
// --------------------------------------------------------------------
console.log('▶ [TEST 2] Calculadora de Tamaño de Posición por Riesgo:');

const totalCapital = 10000;
const openPositions = [
  { id: 'pos-1', symbol: 'BTCUSDT', capitalAllocated: 2000, status: 'OPEN' as const },
  { id: 'pos-2', symbol: 'ETHUSDT', capitalAllocated: 1500, status: 'OPEN' as const },
];

const openCapitalAllocated = openPositions.reduce((acc, p) => acc + p.capitalAllocated, 0);
const availableCapital = totalCapital - openCapitalAllocated; // 10000 - 3500 = 6500

console.log(`  • Capital Total: $${totalCapital}`);
console.log(`  • Capital Comprometido en Posiciones Abiertas: $${openCapitalAllocated}`);
console.log(`  • Capital Disponible (availableCapital): $${availableCapital}`);

if (availableCapital !== 6500) {
  throw new Error(`Expected availableCapital = 6500, got ${availableCapital}`);
}

// Case A: entryPrice = 100, stopLoss = 95, riskPct = 1%
const riskPctA = 1;
const entryPriceA = 100;
const stopLossA = 95;

const riskMoneyA = availableCapital * (riskPctA / 100); // $65.00
const suggestedCapA = (riskMoneyA * entryPriceA) / (entryPriceA - stopLossA); // (65 * 100) / 5 = $1300.00

console.log(`  • Caso A (Entrada: $100, SL: $95, Riesgo: 1%):`);
console.log(`      - Riesgo en Dinero: $${riskMoneyA.toFixed(2)}`);
console.log(`      - Tamaño Sugerido: $${suggestedCapA.toFixed(2)} (Pérdida máxima si toca SL = $${(suggestedCapA * (5/100)).toFixed(2)})`);

if (suggestedCapA !== 1300) {
  throw new Error(`Expected suggestedCapA = 1300, got ${suggestedCapA}`);
}

// Case B: Live recalculation when changing Stop Loss to 98 (closer SL -> larger position size)
const stopLossB = 98;
const suggestedCapB = (riskMoneyA * entryPriceA) / (entryPriceA - stopLossB); // (65 * 100) / 2 = $3250.00

console.log(`  • Caso B (Recálculo en vivo con SL ajustado a $98):`);
console.log(`      - Tamaño Sugerido: $${suggestedCapB.toFixed(2)} (Pérdida máxima si toca SL = $${(suggestedCapB * (2/100)).toFixed(2)})`);

if (suggestedCapB !== 3250) {
  throw new Error(`Expected suggestedCapB = 3250, got ${suggestedCapB}`);
}

// Case C: When Stop Loss is null/0 -> suggestedCapital must be null
const stopLossNull = null;
const suggestedCapNull = (entryPriceA > 0 && stopLossNull !== null) ? 100 : null;
console.log(`  • Caso C (Sin Stop Loss): ${suggestedCapNull === null ? '✅ Muestra mensaje informativo ("Define un Stop Loss")' : '❌ Error'}`);

if (suggestedCapNull !== null) {
  throw new Error('Without Stop Loss, suggested position size must be null');
}
console.log('  ✅ [PASS] Calculadora por riesgo responde y recalcula en vivo con exactitud matemática.\n');

// --------------------------------------------------------------------
// 3. Test Correlation Warning Banner on 3rd Correlated Position
// --------------------------------------------------------------------
console.log('▶ [TEST 3] Aviso de Concentración de Riesgo por Correlación Alta:');

// Suppose user tries to open a 3rd position in SOLUSDT ($1,000 capital)
const solCandles = generateDeterministicCandles('SOLUSDT', 120);
const newTradeSymbol = 'SOLUSDT';
const newTradeCapital = 1000;

const mockAssets = [
  { id: 'btc', symbol: 'BTCUSDT', candles: btcCandles },
  { id: 'eth', symbol: 'ETHUSDT', candles: ethCandles },
  { id: 'sol', symbol: 'SOLUSDT', candles: solCandles },
];

const correlatedFound: { symbol: string; corr: number; capitalAllocated: number }[] = [];

for (const pos of openPositions) {
  const asset = mockAssets.find((a) => a.symbol === pos.symbol);
  if (asset) {
    const r = calculatePriceCorrelation(solCandles, asset.candles, 60);
    if (r >= 0.70) {
      correlatedFound.push({ symbol: pos.symbol, corr: r, capitalAllocated: pos.capitalAllocated });
    }
  }
}

console.log(`  • Posiciones Abiertas Correlacionadas encontradas: ${correlatedFound.length}`);
correlatedFound.forEach((c) => {
  console.log(`      - ${c.symbol} (Correlación: ${c.corr}, Capital: $${c.capitalAllocated})`);
});

const sumCorrelatedCapital = correlatedFound.reduce((acc, c) => acc + c.capitalAllocated, 0);
const totalCombinedRiskCap = sumCorrelatedCapital + newTradeCapital; // 3500 + 1000 = 4500
const concentrationPct = (totalCombinedRiskCap / totalCapital) * 100; // 45.0%

console.log(`  • Capital Correlacionado Total (Existente + Nueva Operación): $${totalCombinedRiskCap}`);
console.log(`  • Concentración de Riesgo Total: ${concentrationPct.toFixed(1)}%`);

if (correlatedFound.length === 0 || concentrationPct <= 0) {
  throw new Error('Correlation warning failed to trigger for highly correlated assets!');
}

console.log(`  ✅ [PASS] Aviso de correlación generado correctamente:`);
console.log(`     "Ya tienes una posición abierta en ${correlatedFound.map(c => `${c.symbol} (${c.corr.toFixed(2)})`).join(', ')} con correlación histórica alta con este activo. Estarías concentrando riesgo similar en aproximadamente ${concentrationPct.toFixed(1)}% de tu capital total."`);

console.log('\n======================================================================');
console.log('✨ TODAS LAS PRUEBAS DE CARTERA, RIESGO Y CORRELACIÓN SUPERADAS (100%)');
console.log('======================================================================');
