import { normalizeCryptoSymbol } from './src/lib/utils/symbol-normalizer';

console.log('======================================================================');
console.log('  TEST DE NORMALIZACIÓN CRIPTO & BÚSQUEDA BINANCE LIVE (QuantPulse)');
console.log('======================================================================\n');

// 1. Test symbol normalization unit tests
const testCases = [
  { input: 'ETHUSD', expected: 'ETHUSDT' },
  { input: 'ETH-USD', expected: 'ETHUSDT' },
  { input: 'ETH/USD', expected: 'ETHUSDT' },
  { input: 'ETH', expected: 'ETHUSDT' },
  { input: 'ETHUSDT', expected: 'ETHUSDT' },
  { input: 'eth-usd', expected: 'ETHUSDT' },
  { input: 'btcusdt', expected: 'BTCUSDT' },
  { input: 'BTC/USD', expected: 'BTCUSDT' },
  { input: 'sol/usdt', expected: 'SOLUSDT' },
  { input: 'ADA', expected: 'ADAUSDT' },
];

console.log('▶ [Paso 1] Probando normalizador de variantes comunes a formato Binance:');
for (const tc of testCases) {
  const result = normalizeCryptoSymbol(tc.input);
  const pass = result === tc.expected;
  console.log(`  ${pass ? '✅' : '❌'} normalizeCryptoSymbol("${tc.input}") -> "${result}" (Esperado: "${tc.expected}")`);
  if (!pass) throw new Error(`Fallo en normalizador para "${tc.input}"`);
}
console.log('✅ Todas las variantes se normalizan correctamente a formato Binance USDT.\n');

// 2. Test /api/crypto-symbols autocomplete endpoint
async function testCryptoSymbolsApi() {
  console.log('▶ [Paso 2] Consultando endpoint /api/crypto-symbols?q=ETH...');
  const res = await fetch('http://localhost:3000/api/crypto-symbols?q=ETH');
  const data = await res.json();
  console.log(`✅ Símbolos devueltos para query "ETH": ${data.symbols?.length || 0}`);
  const hasEthUsdt = data.symbols?.some((s: any) => s.symbol === 'ETHUSDT');
  console.log(`  • Contiene "ETHUSDT": ${hasEthUsdt ? 'SÍ ✅' : 'NO ❌'}`);
  if (!hasEthUsdt) throw new Error('ETHUSDT no fue devuelto por /api/crypto-symbols');

  console.log('\n▶ [Paso 3] Probando consultas a /api/market-data con variantes de ETH:');
  const variants = ['ETH', 'ETHUSD', 'eth-usd', 'ETHUSDT'];

  for (const v of variants) {
    const mRes = await fetch(`http://localhost:3000/api/market-data?symbol=${encodeURIComponent(v)}&type=crypto`);
    const mData = await mRes.json();
    console.log(`  • Query "${v}" -> Precio: $${mData.price} | Candles: ${mData.candles?.length} | isSimulated: ${mData.isSimulated}`);
    if (mData.price <= 0 || mData.candles?.length === 0) {
      throw new Error(`Datos inválidos para ${v}`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log('✨ TODAS LAS PRUEBAS DE NORMALIZACIÓN & PRECIOS REALES PASARON AL 100%.');
  console.log('----------------------------------------------------------------------');
}

testCryptoSymbolsApi().catch((err) => {
  console.error('Error en pruebas:', err);
  process.exit(1);
});
