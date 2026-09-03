import fs from 'fs';

console.log("======================================================================");
console.log("  TEST DE DIAGNÓSTICO CUANTITATIVO & RESUMEN GERENCIAL DEL ACTIVO     ");
console.log("======================================================================");

// 1. Verify chart-executive-analysis.tsx file
const execAnalysisCode = fs.readFileSync("src/components/chart/chart-executive-analysis.tsx", "utf-8");

// Check 6 analytical pillars
const requiredPillars = [
  "Medias Móviles (EMAs)",
  "Bandas de Bollinger (20, 2)",
  "Momentum Relativo (RSI 14)",
  "Fuerza de Tendencia (ADX 14)",
  "Convergencia / Momentum (MACD)",
  "Volumen & Liquidez"
];

for (const pillar of requiredPillars) {
  if (execAnalysisCode.includes(pillar)) {
    console.log(`✅ [1.x] Pilar técnico presente: "${pillar}"`);
  } else {
    console.error(`❌ Falta pilar técnico: "${pillar}"`);
    process.exit(1);
  }
}

// Check signal evaluations (Favorable, Neutro, Desfavorable)
if (
  execAnalysisCode.includes("Favorable") &&
  execAnalysisCode.includes("Neutro") &&
  execAnalysisCode.includes("Desfavorable")
) {
  console.log("✅ [2] Badges de evaluación (Favorable / Neutro / Desfavorable) implementados.");
} else {
  console.error("❌ Faltan badges de evaluación.");
  process.exit(1);
}

// Check executive summary & score justification
if (
  execAnalysisCode.includes("Conclusión Gerencial & Justificación del Score") &&
  execAnalysisCode.includes("Entrada Sugerida") &&
  execAnalysisCode.includes("Stop Loss Límit") &&
  execAnalysisCode.includes("Take Profit Obj.") &&
  execAnalysisCode.includes("Horizonte")
) {
  console.log("✅ [3] Resumen gerencial, justificación del score y plan de ejecución en 4 cajas presentes.");
} else {
  console.error("❌ Falta resumen gerencial o plan de ejecución.");
  process.exit(1);
}

// Check integration in trading-chart.tsx
const tradingChartCode = fs.readFileSync("src/components/chart/trading-chart.tsx", "utf-8");
if (
  tradingChartCode.includes("ChartExecutiveAnalysis") &&
  tradingChartCode.includes("<ChartExecutiveAnalysis")
) {
  console.log("✅ [4] Integración en trading-chart.tsx verificada exitosamente.");
} else {
  console.error("❌ Falta integración en trading-chart.tsx.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODAS LAS PRUEBAS DE DIAGNÓSTICO GERENCIAL PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
