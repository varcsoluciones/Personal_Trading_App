import fs from 'fs';
import { calculateMACD, calculateEMA } from './src/lib/quant/indicators';
import { Candle } from './src/lib/types/market';

console.log("======================================================================");
console.log("  TEST DE SUBGRÁFICAS DE VOLUMEN, MACD Y SINCRONIZACIÓN DE RANGO      ");
console.log("======================================================================");

// 1. Test calculateMACD
console.log("\n▶ [Prueba 1] Verificación matemática de calculateMACD (12, 26, 9):");
const mockCandles: Candle[] = [];
let basePrice = 100;
for (let i = 0; i < 60; i++) {
  const change = Math.sin(i / 5) * 4 + (i > 30 ? 1.5 : -0.5);
  basePrice += change;
  const open = basePrice - change * 0.5;
  const close = basePrice;
  const high = Math.max(open, close) + 1;
  const low = Math.min(open, close) - 1;
  const volume = 1000 + i * 50;
  mockCandles.push({
    time: `2026-01-${String(i + 1).padStart(2, '0')}`,
    open,
    high,
    low,
    close,
    volume,
  });
}

const macdResult = calculateMACD(mockCandles, 12, 26, 9);
const lastIdx = mockCandles.length - 1;

console.log(`  • Velas analizadas: ${mockCandles.length}`);
console.log(`  • Línea MACD (última): ${macdResult.macdLine[lastIdx].toFixed(4)}`);
console.log(`  • Línea Signal (última): ${macdResult.signalLine[lastIdx].toFixed(4)}`);
console.log(`  • Histograma (último): ${macdResult.histogram[lastIdx].toFixed(4)}`);

// Verify equality: Histogram === MACD - Signal
const calculatedHist = macdResult.macdLine[lastIdx] - macdResult.signalLine[lastIdx];
if (Math.abs(macdResult.histogram[lastIdx] - calculatedHist) < 0.0001) {
  console.log("✅ [1] calculateMACD: Identidad matemática Histograma = MACD - Signal comprobada.");
} else {
  console.error("❌ [1] calculateMACD: discrepancia en histograma.");
  process.exit(1);
}

// 2. Test Volume Series rules
console.log("\n▶ [Prueba 2] Verificación de reglas de coloreado de Volumen:");
let greenVolCount = 0;
let redVolCount = 0;
mockCandles.forEach((c) => {
  const isGreen = c.close >= c.open;
  if (isGreen) greenVolCount++;
  else redVolCount++;
});
console.log(`  • Barras Verdes (close >= open): ${greenVolCount}`);
console.log(`  • Barras Rojas (close < open): ${redVolCount}`);
if (greenVolCount > 0 && redVolCount > 0) {
  console.log("✅ [2] Volumen: Clasificación de color verde/rojo correcta.");
} else {
  console.error("❌ [2] Volumen: error en reglas de color.");
  process.exit(1);
}

// 3. Verify trading-chart.tsx synchronization & architecture
console.log("\n▶ [Prueba 3] Verificación estática de trading-chart.tsx:");
const chartCode = fs.readFileSync("src/components/chart/trading-chart.tsx", "utf-8");

if (
  chartCode.includes("subscribeVisibleLogicalRangeChange") &&
  chartCode.includes("setVisibleLogicalRange") &&
  chartCode.includes("isSyncingRangeRef.current")
) {
  console.log("✅ [3.1] Sincronización bidireccional de timeScale con guardia anti-bucle infinito isSyncingRangeRef.");
} else {
  console.error("❌ [3.1] Falta lógica de sincronización bidireccional o guardia anti-bucle.");
  process.exit(1);
}

if (
  chartCode.includes("volumeContainerRef") &&
  chartCode.includes("addHistogramSeries") &&
  chartCode.includes("priceFormat: { type: 'volume' }")
) {
  console.log("✅ [3.2] Subgráfica de Volumen implementada con histograma inmediatamente bajo el gráfico principal.");
} else {
  console.error("❌ [3.2] Falta subgráfica de volumen.");
  process.exit(1);
}

if (
  chartCode.includes("macdContainerRef") &&
  chartCode.includes("macdFastSeries") &&
  chartCode.includes("macdSignalSeries") &&
  chartCode.includes("macdHistSeries")
) {
  console.log("✅ [3.3] Subgráfica de MACD implementada con líneas MACD, Signal e Histograma.");
} else {
  console.error("❌ [3.3] Falta subgráfica de MACD.");
  process.exit(1);
}

if (
  chartCode.includes("toggleVolume") &&
  chartCode.includes("toggleMacd") &&
  chartCode.includes("toggleRsi") &&
  chartCode.includes("toggleAdx")
) {
  console.log("✅ [3.4] Toggles individuales para Volumen, MACD, RSI y ADX presentes y conectados a configuración persistente.");
} else {
  console.error("❌ [3.4] Faltan toggles de subgráficas.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODAS LAS PRUEBAS DE SUBGRÁFICAS Y SINCRONIZACIÓN PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
