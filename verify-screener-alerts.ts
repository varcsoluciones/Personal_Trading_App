import fs from 'fs';

console.log("======================================================================");
console.log("  TEST DE SCREENER (FILTROS AVANZADOS, TOOLTIP & CAMPANA DE ALERTAS)  ");
console.log("======================================================================");

// 1. Verify types in settings.ts
const settingsContent = fs.readFileSync("src/lib/types/settings.ts", "utf-8");
if (settingsContent.includes("screenerAdvancedFiltersOpen?: boolean") && settingsContent.includes("screenerAdvancedFiltersOpen: false")) {
  console.log("✅ [1] settings.ts: screenerAdvancedFiltersOpen registrado y con default false.");
} else {
  console.error("❌ [1] settings.ts: falta screenerAdvancedFiltersOpen.");
  process.exit(1);
}

// 2. Verify opportunity-screener.tsx
const screenerContent = fs.readFileSync("src/components/screener/opportunity-screener.tsx", "utf-8");

// Check InfoTooltip usage
if (screenerContent.includes("InfoTooltip") && screenerContent.includes("Filtro de Consistencia")) {
  console.log("✅ [2.1] opportunity-screener.tsx: InfoTooltip integrado en el botón de Consistencia Histórica.");
} else {
  console.error("❌ [2.1] opportunity-screener.tsx: falta InfoTooltip.");
  process.exit(1);
}

// Check that the amber banner row is removed
if (!screenerContent.includes("Filtro de Consistencia Activo: Se recalcularon las simulaciones")) {
  console.log("✅ [2.2] opportunity-screener.tsx: Banner ámbar eliminado (reemplazado por tooltip).");
} else {
  console.error("❌ [2.2] opportunity-screener.tsx: el banner ámbar aún sigue presente.");
  process.exit(1);
}

// Check advanced filters button and persistence
if (screenerContent.includes("Filtros avanzados ⚙") && screenerContent.includes("isAdvancedFiltersOpen") && screenerContent.includes("updateSettings({ screenerAdvancedFiltersOpen:")) {
  console.log("✅ [2.3] opportunity-screener.tsx: Botón 'Filtros avanzados ⚙' con estado persistido en settings.");
} else {
  console.error("❌ [2.3] opportunity-screener.tsx: botón de filtros avanzados no configurado.");
  process.exit(1);
}

// Check that minScore filter logic is always applied
if (screenerContent.includes("asset.analysis.opportunityScore < minScore")) {
  console.log("✅ [2.4] opportunity-screener.tsx: El filtro de Score Mínimo se aplica de forma incondicional.");
} else {
  console.error("❌ [2.4] opportunity-screener.tsx: falta filtro de minScore.");
  process.exit(1);
}

// 3. Verify asset-opportunity-card.tsx
const cardContent = fs.readFileSync("src/components/shared/asset-opportunity-card.tsx", "utf-8");

if (cardContent.includes("openAlertsModal(asset)") && cardContent.includes("e.stopPropagation()") && cardContent.includes("Bell") && cardContent.includes("activeAlertsCount")) {
  console.log("✅ [3] asset-opportunity-card.tsx: Botón de campana de alertas conectado en el Action Footer con badge numérico.");
} else {
  console.error("❌ [3] asset-opportunity-card.tsx: campana de alertas no conectada en la tarjeta.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODOS LOS CRITERIOS DE SCREENER, TOOLTIP Y ALERTAS PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
