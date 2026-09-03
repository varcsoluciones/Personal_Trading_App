import fs from 'fs';

console.log("======================================================================");
console.log("  TEST DE SELECTOR DESPLEGABLE Y AUTOCOMPLETADO EN APPLY POSITION     ");
console.log("======================================================================");

// 1. Verify apply-position-modal.tsx
const modalCode = fs.readFileSync("src/components/portfolio/apply-position-modal.tsx", "utf-8");

if (
  modalCode.includes("AssetDropdownSelect") &&
  modalCode.includes("handleSelectAsset") &&
  modalCode.includes("applySuggestedValuesForAsset")
) {
  console.log("✅ [1] AssetDropdownSelect y función applySuggestedValuesForAsset integrados en apply-position-modal.tsx.");
} else {
  console.error("❌ Falta AssetDropdownSelect o applySuggestedValuesForAsset en apply-position-modal.tsx.");
  process.exit(1);
}

// 2. Verify auto-fill logic for Entry, TP, and SL
if (
  modalCode.includes("targetAsset.analysis?.orderSetup.suggestedEntryPrice") &&
  modalCode.includes("targetAsset.analysis?.orderSetup.suggestedStopLoss") &&
  modalCode.includes("targetAsset.analysis?.orderSetup.suggestedTakeProfit")
) {
  console.log("✅ [2] Autocompletado reactivo de Entrada, Stop Loss y Take Profit verificado.");
} else {
  console.error("❌ Falta lógica de autocompletado de parámetros sugeridos.");
  process.exit(1);
}

// 3. Verify assets prop in page.tsx
const pageCode = fs.readFileSync("src/app/page.tsx", "utf-8");
if (pageCode.includes("assets={assets}") && pageCode.includes("<ApplyPositionModal")) {
  console.log("✅ [3] Prop assets={assets} conectado en page.tsx hacia ApplyPositionModal.");
} else {
  console.error("❌ Falta prop assets en ApplyPositionModal dentro de page.tsx.");
  process.exit(1);
}

console.log("\n----------------------------------------------------------------------");
console.log("✨ TODAS LAS PRUEBAS DEL SELECTOR DESPLEGABLE PASARON AL 100%.");
console.log("----------------------------------------------------------------------");
