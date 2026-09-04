import { evaluateEntryCondition, calculateSuggestedEntry, DEFAULT_STRATEGY_CONFIG, STRATEGY_PRESETS } from './src/lib/quant/strategy-rules';
import { analyzeAsset } from './src/lib/quant/trend-analyzer';
import { Candle } from './src/lib/types/market';

console.log('🧪 Starting Tolerance Zone (±1.0%) Verification...\n');

// Test 1: Price is 0.7% above EMA 20 (within 1% tolerance), RSI is 60 (healthy), Weekly is Bullish
const test1 = evaluateEntryCondition({
  currentPrice: 100.7,
  currentEmaFast: 100.0,
  currentEmaSlow: 95.0,
  currentRsi: 60,
  prevRsi: 59,
  currentAdx: 25,
  volumeConfirmed: true,
  weeklyTrend: 'BULLISH',
  config: { entryTolerancePct: 1.0 },
});

console.log('Test 1 (Price +0.7% over EMA 20, RSI 60):', test1);
if (!test1.shouldEnter) {
  throw new Error('Test 1 Failed: Expected shouldEnter=true within ±1% tolerance zone');
}

// Test 2: Price is 2.5% above EMA 20 (outside 1% tolerance), RSI is 60 (not in standard pullback)
const test2 = evaluateEntryCondition({
  currentPrice: 102.5,
  currentEmaFast: 100.0,
  currentEmaSlow: 95.0,
  currentRsi: 60,
  prevRsi: 59,
  currentAdx: 25,
  volumeConfirmed: true,
  weeklyTrend: 'BULLISH',
  config: { entryTolerancePct: 1.0 },
});

console.log('Test 2 (Price +2.5% over EMA 20, RSI 60 - outside tolerance):', test2);
if (test2.shouldEnter) {
  throw new Error('Test 2 Failed: Expected shouldEnter=false when price is extended beyond tolerance');
}

// Test 3: Price is +0.5% above EMA 20, check suggested entry labeling
const suggestedEntry1 = calculateSuggestedEntry(100.5, 100.0, 2.0, 'BULLISH', 'OPORTUNIDAD DE ENTRADA', 1.0);
console.log('Test 3 (Suggested Entry in zone):', suggestedEntry1);
if (!suggestedEntry1.entryLabel.includes('Zona de Compra')) {
  throw new Error('Test 3 Failed: Expected entryLabel to mention "Zona de Compra"');
}

// Test 4: Presets check
console.log('\nStrategy Presets tolerance configurations:');
STRATEGY_PRESETS.forEach((p) => {
  console.log(` - ${p.name}: entryTolerancePct = ${p.config.entryTolerancePct}%`);
});

// Test 5: End-to-end analyzeAsset with synthetic candles
const mockCandles: Candle[] = [];
let price = 100;
for (let i = 0; i < 60; i++) {
  // gradual uptrend
  price = price * 1.004;
  const d = new Date(Date.UTC(2026, 0, 1 + i));
  mockCandles.push({
    time: d.toISOString().split('T')[0],
    open: price * 0.998,
    high: price * 1.006,
    low: price * 0.995,
    close: price,
    volume: 10000 + Math.random() * 2000,
  });
}
const analysis = analyzeAsset(mockCandles, DEFAULT_STRATEGY_CONFIG);
console.log('\nTest 5: Synthetic asset analysis completed with signal:', analysis.signal, '| Label:', analysis.orderSetup.entryLabel);

console.log('\n✅ ALL TOLERANCE ZONE TESTS PASSED SUCCESSFULLY!');
