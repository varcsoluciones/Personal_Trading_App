import { evaluateEntryCondition, calculateSuggestedEntry, DEFAULT_STRATEGY_CONFIG } from './src/lib/quant/strategy-rules';

console.log('🧪 Testing Unified Tolerance Zone Logic (±% Symmetric around EMA Fast)...\n');

const emaFast = 100;
const emaSlow = 90; // Bullish structure: EMA20 (100) > EMA50 (90)
const adx = 25;
const rsi = 45;

const baseParams = {
  currentEmaFast: emaFast,
  currentEmaSlow: emaSlow,
  currentRsi: rsi,
  prevRsi: 44,
  currentAdx: adx,
  volumeConfirmed: true,
  weeklyTrend: 'BULLISH' as const,
  config: {
    ...DEFAULT_STRATEGY_CONFIG,
    entryTolerancePct: 1.0, // ±1.0% tolerance zone [99.00 to 101.00]
  },
};

// Case 1: Exact support ($100.00 -> 0.00% distance)
const res1 = evaluateEntryCondition({ ...baseParams, currentPrice: 100.0 });
const entry1 = calculateSuggestedEntry(100.0, emaFast, 2.0, 'BULLISH', 'OPORTUNIDAD DE ENTRADA', 1.0);
console.log('Test 1 (Exact support $100.00):', res1.shouldEnter ? '✅ ENTER' : '❌ REJECT', '| Label:', entry1.entryLabel);
if (!res1.shouldEnter) throw new Error('Test 1 failed');

// Case 2: +0.8% above EMA Fast ($100.80 -> within +1.0% tolerance)
const res2 = evaluateEntryCondition({ ...baseParams, currentPrice: 100.8 });
const entry2 = calculateSuggestedEntry(100.8, emaFast, 2.0, 'BULLISH', 'OPORTUNIDAD DE ENTRADA', 1.0);
console.log('Test 2 (+0.8% above EMA20 $100.80):', res2.shouldEnter ? '✅ ENTER' : '❌ REJECT', '| Label:', entry2.entryLabel);
if (!res2.shouldEnter) throw new Error('Test 2 failed');

// Case 3: -0.8% below EMA Fast ($99.20 -> within -1.0% tolerance)
const res3 = evaluateEntryCondition({ ...baseParams, currentPrice: 99.2 });
const entry3 = calculateSuggestedEntry(99.2, emaFast, 2.0, 'BULLISH', 'OPORTUNIDAD DE ENTRADA', 1.0);
console.log('Test 3 (-0.8% below EMA20 $99.20):', res3.shouldEnter ? '✅ ENTER' : '❌ REJECT', '| Label:', entry3.entryLabel);
if (!res3.shouldEnter) throw new Error('Test 3 failed');

// Case 4: +1.5% above EMA Fast ($101.50 -> OUTSIDE 1.0% tolerance)
// Note: with RSI 45, rsiPullback is true (rsi between 38 and 58), so to isolate proximityZoneTrigger test with RSI 60
const res4ProximityOnly = evaluateEntryCondition({
  ...baseParams,
  currentPrice: 101.5,
  currentRsi: 60, // not in rsiPullback (38-58)
  prevRsi: 60,
});
console.log('Test 4 (+1.5% above EMA20 $101.50 with RSI 60):', res4ProximityOnly.shouldEnter ? '❌ INCORRECTLY ENTERED' : '✅ REJECTED (Outside tolerance)');
if (res4ProximityOnly.shouldEnter) throw new Error('Test 4 failed: should have been rejected outside ±1% tolerance zone');

// Case 5: $95.00 (5% below EMA Fast, but above EMA Slow $90)
// With the old buggy formula, $95 was allowed because 95 >= 90 * 0.99.
// With the new symmetric formula, $95 is 5% below EMA20 so it MUST be rejected for proximity!
const res5ProximityOnly = evaluateEntryCondition({
  ...baseParams,
  currentPrice: 95.0,
  currentRsi: 60,
  prevRsi: 60,
});
console.log('Test 5 ($95.00 = 5% below EMA20, but above EMA50 $90):', res5ProximityOnly.shouldEnter ? '❌ INCORRECTLY ENTERED (Old bug)' : '✅ REJECTED (New symmetric tolerance enforced)');
if (res5ProximityOnly.shouldEnter) throw new Error('Test 5 failed: old bug allowed price 5% below EMA20');

console.log('\n✨ ALL TOLERANCE ZONE TESTS PASSED WITH 100% MATHEMATICAL SYMMETRY!');
