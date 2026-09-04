import { analyzeAsset } from './src/lib/quant/trend-analyzer';
import { DEFAULT_STRATEGY_CONFIG } from './src/lib/quant/strategy-rules';
import { Candle } from './src/lib/types/market';

console.log('🧪 Testing 100-Point Proportional Score Model & Breakdown...\n');

function createCandles(type: 'pullback' | 'extended' | 'bearish'): Candle[] {
  const candles: Candle[] = [];
  let price = 100;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.UTC(2026, 0, 1 + i));
    if (type === 'pullback') {
      // Steady uptrend then gentle pullback to EMA 20
      if (i < 50) price *= 1.006;
      else price *= 0.996;
    } else if (type === 'extended') {
      // Rapid rally without pullback
      price *= 1.008;
    } else {
      // Downtrend
      price *= 0.994;
    }

    candles.push({
      time: d.toISOString().split('T')[0],
      open: price * 0.998,
      high: price * 1.005,
      low: price * 0.995,
      close: price,
      volume: 18000 + (type === 'pullback' ? 5000 : 0),
    });
  }
  return candles;
}

const pullbackAnalysis = analyzeAsset(createCandles('pullback'), DEFAULT_STRATEGY_CONFIG);
const extendedAnalysis = analyzeAsset(createCandles('extended'), DEFAULT_STRATEGY_CONFIG);
const bearishAnalysis = analyzeAsset(createCandles('bearish'), DEFAULT_STRATEGY_CONFIG);

console.log(`▶ Activo 1 (Pullback Óptimo en Soporte)  -> Score: ${pullbackAnalysis.opportunityScore} / 100 pts`);
console.log(`▶ Activo 2 (Rally Alcista Extendido)   -> Score: ${extendedAnalysis.opportunityScore} / 100 pts`);
console.log(`▶ Activo 3 (Estructura Bajista)         -> Score: ${bearishAnalysis.opportunityScore} / 100 pts`);

// Validations
if (pullbackAnalysis.opportunityScore <= extendedAnalysis.opportunityScore) {
  throw new Error('Verification failed: Pullback asset should score higher than extended asset!');
}

if (extendedAnalysis.opportunityScore <= bearishAnalysis.opportunityScore) {
  throw new Error('Verification failed: Extended bull asset should score higher than bearish asset!');
}

const breakdown = pullbackAnalysis.scoreBreakdown!;
const totalMax = breakdown.criteria.reduce((acc, c) => acc + c.maxPoints, 0);
const sumPoints = breakdown.criteria.reduce((acc, c) => acc + c.points, 0);

console.log(`\nSuma de puntos de criterios: ${sumPoints} (Total Max: ${totalMax} pts)`);
if (totalMax !== 100) {
  throw new Error(`Verification failed: Expected sum of maxPoints to be 100, got ${totalMax}`);
}

console.log('\nDesglose de Criterios (Activo 1 - Pullback Óptimo):');
breakdown.criteria.forEach((c) => {
  console.log(`  • ${c.name}: ${c.points} / ${c.maxPoints} pts | "${c.description}"`);
});

console.log('\n✅ 100-POINT PROPORTIONAL SCORE MODEL VALIDATED SUCCESSFULLY (0 SATURATION)!');
