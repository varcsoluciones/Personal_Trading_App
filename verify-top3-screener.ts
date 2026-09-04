console.log('🧪 Testing Top 3 Screener Ranking Filter (Exclusion of Undefined Reliability Scores)...\n');

interface MockAsset {
  id: string;
  symbol: string;
  name: string;
  analysis?: {
    opportunityScore: number;
    signal: string;
  };
  backtestReliabilityScore?: number;
}

const mockAssets: MockAsset[] = [
  {
    id: 'asset-1',
    symbol: 'UNTESTED_HIGH_SCORE',
    name: 'Untested Asset with High Technical Score',
    analysis: { opportunityScore: 92, signal: 'OPORTUNIDAD DE ENTRADA' },
    backtestReliabilityScore: undefined, // NOT tested yet
  },
  {
    id: 'asset-2',
    symbol: 'PROVEN_SOLID',
    name: 'Proven Solid Asset',
    analysis: { opportunityScore: 84, signal: 'OPORTUNIDAD DE ENTRADA' },
    backtestReliabilityScore: 78, // Proven HIGH
  },
  {
    id: 'asset-3',
    symbol: 'PROVEN_MODERATE',
    name: 'Proven Moderate Asset',
    analysis: { opportunityScore: 75, signal: 'OPORTUNIDAD DE ENTRADA' },
    backtestReliabilityScore: 65, // Proven MEDIUM
  },
  {
    id: 'asset-4',
    symbol: 'PROVEN_LOW',
    name: 'Proven Low Reliability Asset',
    analysis: { opportunityScore: 88, signal: 'OPORTUNIDAD DE ENTRADA' },
    backtestReliabilityScore: 32, // Proven LOW (Overfit / poor walk-forward)
  },
  {
    id: 'asset-5',
    symbol: 'UNTESTED_LOW_SCORE',
    name: 'Untested Low Score',
    analysis: { opportunityScore: 40, signal: 'ESPERAR / MANTENER' },
    backtestReliabilityScore: undefined,
  },
];

// Logic matching opportunity-screener.tsx top3Recommended
const top3Recommended = [...mockAssets]
  .filter((a) => a.analysis && a.analysis.opportunityScore >= 50 && typeof a.backtestReliabilityScore === 'number')
  .sort((a, b) => {
    const relA = a.backtestReliabilityScore!;
    const relB = b.backtestReliabilityScore!;
    const scoreA = (a.analysis?.opportunityScore || 50) * 0.6 + relA * 0.4;
    const scoreB = (b.analysis?.opportunityScore || 50) * 0.6 + relB * 0.4;
    return scoreB - scoreA;
  })
  .slice(0, 3);

console.log('Top 3 Result:');
top3Recommended.forEach((item, index) => {
  const combinedScore = (item.analysis!.opportunityScore * 0.6) + (item.backtestReliabilityScore! * 0.4);
  console.log(` #${index + 1}: ${item.symbol} | Score: ${item.analysis?.opportunityScore} | Reliability: ${item.backtestReliabilityScore} | Combined: ${combinedScore.toFixed(1)}`);
});

// Assertions
const containsUntested = top3Recommended.some((a) => typeof a.backtestReliabilityScore !== 'number');
if (containsUntested) {
  throw new Error('❌ Test Failed: Top 3 contains an asset with undefined backtestReliabilityScore!');
}
console.log('\n✅ Assertion 1 Passed: No untested/undefined asset appears in Top 3.');

if (top3Recommended.length !== 3) {
  throw new Error(`❌ Test Failed: Expected 3 assets, got ${top3Recommended.length}`);
}
console.log('✅ Assertion 2 Passed: Exactly 3 verified assets selected.');

if (top3Recommended[0].symbol !== 'PROVEN_SOLID') {
  throw new Error(`❌ Test Failed: Expected PROVEN_SOLID as #1, got ${top3Recommended[0].symbol}`);
}
console.log('✅ Assertion 3 Passed: Highest verified composite score correctly ranked #1.');

console.log('\n✨ ALL TOP 3 SCREENER RELIABILITY FILTER TESTS PASSED SUCCESSFULLY!');
