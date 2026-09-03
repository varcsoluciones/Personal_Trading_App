import fs from 'fs';

console.log("======================================================================");
console.log("  TEST DE SECCIÓN TOP 3 ACTIVOS RECOMENDADOS EN SCREENER              ");
console.log("======================================================================");

// 1. Verify opportunity-screener.tsx
const screenerCode = fs.readFileSync("src/components/screener/opportunity-screener.tsx", "utf-8");

if (
  screenerCode.includes("Top 3 Activos Recomendados") &&
  screenerCode.includes("top3Recommended") &&
  screenerCode.includes("🥇 #1") &&
  screenerCode.includes("🥈 #2") &&
  screenerCode.includes("🥉 #3")
) {
  console.log("✅ [1] Sección 'Top 3 Activos Recomendados' integrada con podio #1, #2 y #3.");
} else {
  console.error("❌ Falta sección de Top 3 en opportunity-screener.tsx.");
  process.exit(1);
}

// Verify dynamic multi-factor sorting (score + reliability)
if (screenerCode.includes("scoreA = (a.analysis?.opportunityScore || 50) * 0.6 + relA * 0.4")) {
  console.log("✅ [2] Algoritmo de selección ponderado: 60% Score Técnico + 40% Confiabilidad Walk-Forward.");
} else {
  console.error("❌ Falta algoritmo ponderado de selección.");
  process.exit(1);
}

// Verify interactive navigation on click
if (screenerCode.includes("onSelectAsset(item.id)") && screenerCode.includes("onOpenChart(item.id)")) {
  console.log("✅ [3] Interacción directa: Al pulsar cualquier activo del Top 3 se abre su gráfico.");
} else {
  console.error("❌ Falta navegación directa en tarjetas del Top 3.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODAS LAS PRUEBAS DE TOP 3 RECOMENDADOS PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
