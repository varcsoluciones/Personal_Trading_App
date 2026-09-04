import { analyzeAsset } from './src/lib/quant/trend-analyzer';
import { DEFAULT_STRATEGY_CONFIG } from './src/lib/quant/strategy-rules';
import { Candle } from './src/lib/types/market';

console.log('🧪 Testing Score Breakdown Generation...\n');

const mockCandles: Candle[] = [];
let price = 100;
for (let i = 0; i < 60; i++) {
  price = price * 1.003;
  const d = new Date(Date.UTC(2026, 0, 1 + i));
  mockCandles.push({
    time: d.toISOString().split('T')[0],
    open: price * 0.998,
    high: price * 1.006,
    low: price * 0.995,
    close: price,
    volume: 15000,
  });
}

const analysis = analyzeAsset(mockCandles, DEFAULT_STRATEGY_CONFIG);
console.log(`Opportunity Score: ${analysis.opportunityScore}`);
console.log('\nScore Breakdown:');
console.log(` - Base Score: ${analysis.scoreBreakdown?.baseScore}`);
console.log(` - Total Score: ${analysis.scoreBreakdown?.totalScore}`);
console.log(` - Number of criteria: ${analysis.scoreBreakdown?.criteria.length}`);

if (!analysis.scoreBreakdown || analysis.scoreBreakdown.criteria.length === 0) {
  throw new Error('Verification failed: scoreBreakdown is empty!');
}

analysis.scoreBreakdown.criteria.forEach((c) => {
  console.log(`   [${c.name}]: ${c.points > 0 ? '+' : ''}${c.points} / ${c.maxPoints} pts | Status: ${c.status} | "${c.description}"`);
});

console.log('\n✅ SCORE BREAKDOWN TESTS PASSED SUCCESSFULLY!');
