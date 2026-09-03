import fs from 'fs';
import { calculateBollingerBands, calculateSMA } from './src/lib/quant/indicators';

console.log("======================================================================");
console.log("  TEST DE BANDAS DE BOLLINGER (BOLL 20, 2) EN GRÁFICA PRINCIPAL       ");
console.log("======================================================================");

// 1. Math verification of calculateBollingerBands
console.log("\n▶ [Prueba 1] Verificación matemática de calculateBollingerBands (20, 2):");
const mockPrices: number[] = [];
let p = 100;
for (let i = 0; i < 50; i++) {
  p += Math.sin(i / 3) * 3 + (i % 2 === 0 ? 1 : -1);
  mockPrices.push(Number(p.toFixed(2)));
}

const bollResult = calculateBollingerBands(mockPrices, 20, 2);
const sma20 = calculateSMA(mockPrices, 20);
const lastIdx = mockPrices.length - 1;

console.log(`  • Precios evaluados: ${mockPrices.length}`);
console.log(`  • Banda Superior: ${bollResult.upper[lastIdx].toFixed(4)}`);
console.log(`  • Banda Media (SMA 20): ${bollResult.middle[lastIdx].toFixed(4)}`);
console.log(`  • Banda Inferior: ${bollResult.lower[lastIdx].toFixed(4)}`);

// Verify Middle === SMA 20
if (Math.abs(bollResult.middle[lastIdx] - sma20[lastIdx]) < 0.0001) {
  console.log("✅ [1.1] Banda Media coincide exactamente con la SMA de 20 periodos.");
} else {
  console.error("❌ [1.1] Error: Banda Media no coincide con SMA 20.");
  process.exit(1);
}

// Verify Upper > Middle > Lower
if (bollResult.upper[lastIdx] > bollResult.middle[lastIdx] && bollResult.middle[lastIdx] > bollResult.lower[lastIdx]) {
  console.log("✅ [1.2] Jerarquía de bandas correcta: Superior > Media > Inferior.");
} else {
  console.error("❌ [1.2] Error en jerarquía de bandas.");
  process.exit(1);
}

// Verify symmetry: Upper - Middle === Middle - Lower
const distUp = bollResult.upper[lastIdx] - bollResult.middle[lastIdx];
const distLow = bollResult.middle[lastIdx] - bollResult.lower[lastIdx];
if (Math.abs(distUp - distLow) < 0.0001) {
  console.log(`✅ [1.3] Simetría de banda ancha (2x StdDev = ${distUp.toFixed(4)}) exacta.`);
} else {
  console.error("❌ [1.3] Error de simetría en bandas.");
  process.exit(1);
}

// 2. Static check in trading-chart.tsx
console.log("\n▶ [Prueba 2] Verificación de integración en trading-chart.tsx:");
const chartCode = fs.readFileSync("src/components/chart/trading-chart.tsx", "utf-8");

if (
  chartCode.includes("calculateBollingerBands") &&
  chartCode.includes("bollUpperSeries") &&
  chartCode.includes("bollMiddleSeries") &&
  chartCode.includes("bollLowerSeries") &&
  chartCode.includes("BOLL (20, 2)")
) {
  console.log("✅ [2.1] trading-chart.tsx: Series de bandas de Bollinger y botón toggle 'BOLL (20, 2)' integrados correctamente.");
} else {
  console.error("❌ [2.1] Falta integración de Bollinger en trading-chart.tsx.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODAS LAS PRUEBAS DE BANDAS DE BOLLINGER PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
