import { PositionPurchaseLot } from '../types/portfolio';

export interface LotWithDetails extends PositionPurchaseLot {
  weightPct: number; // Porcentaje del capital total que representa este lote
}

export interface WeightedCalculationResult {
  totalCapital: number;
  totalShares: number;
  weightedAveragePrice: number;
  lots: LotWithDetails[];
  formulaString: string;
  valuesString: string;
}

/**
 * Calcula el precio promedio ponderado de entrada (Dollar Cost Averaging - DCA),
 * el capital total acumulado y el número total de acciones o unidades compradas.
 * 
 * Fórmula:
 * Precio Ponderado = Capital Total Invertido / Total de Acciones Adquiridas
 *                 = Sum(Capital_i) / Sum(Capital_i / Precio_i)
 */
export function calculateWeightedAveragePosition(
  lots: PositionPurchaseLot[]
): WeightedCalculationResult {
  if (!lots || lots.length === 0) {
    return {
      totalCapital: 0,
      totalShares: 0,
      weightedAveragePrice: 0,
      lots: [],
      formulaString: 'Precio Ponderado = 0',
      valuesString: 'Sin compras registradas',
    };
  }

  // Sanitizar lotes asegurando números válidos
  const sanitizedLots = lots.map((lot, index) => {
    const price = Math.max(0.000001, Number(lot.price) || 0);
    const capital = Math.max(0, Number(lot.capitalAllocated) || 0);
    const shares = lot.shares && lot.shares > 0 ? Number(lot.shares) : capital / price;
    return {
      ...lot,
      id: lot.id || `lot_${index + 1}`,
      price,
      capitalAllocated: capital,
      shares,
    };
  });

  const totalCapital = sanitizedLots.reduce((acc, l) => acc + l.capitalAllocated, 0);
  const totalShares = sanitizedLots.reduce((acc, l) => acc + l.shares, 0);

  const weightedAveragePrice =
    totalShares > 0 ? totalCapital / totalShares : sanitizedLots[0]?.price || 0;

  const lotsWithDetails: LotWithDetails[] = sanitizedLots.map((lot) => ({
    ...lot,
    weightPct: totalCapital > 0 ? (lot.capitalAllocated / totalCapital) * 100 : 0,
  }));

  // Generar cadena descriptiva de la fórmula
  const formulaString = `Precio Promedio = Capital Total ($${totalCapital.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}) ÷ Total Unidades (${totalShares.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })})`;

  const parts = sanitizedLots.map(
    (l, idx) => `Lote ${idx + 1}: $${l.capitalAllocated.toFixed(2)} @ $${l.price.toFixed(2)}`
  );
  const valuesString = parts.join(' + ');

  return {
    totalCapital: Number(totalCapital.toFixed(2)),
    totalShares: Number(totalShares.toFixed(6)),
    weightedAveragePrice: Number(weightedAveragePrice.toFixed(4)),
    lots: lotsWithDetails,
    formulaString,
    valuesString,
  };
}

/**
 * Simula el resultado de agregar una nueva compra a una posición existente o a un conjunto de lotes.
 */
export function previewAddPurchase(
  existingPurchases: PositionPurchaseLot[] | undefined,
  existingFallback: { price: number; capitalAllocated: number; date?: string },
  newPurchase: { price: number; capitalAllocated: number; date?: string; note?: string }
): {
  currentCapital: number;
  currentShares: number;
  currentPrice: number;
  newTotalCapital: number;
  newTotalShares: number;
  newWeightedPrice: number;
  priceDeltaPct: number;
  simulatedLots: PositionPurchaseLot[];
} {
  // Construir lotes base
  let baseLots: PositionPurchaseLot[] = [];
  if (existingPurchases && existingPurchases.length > 0) {
    baseLots = [...existingPurchases];
  } else if (existingFallback.capitalAllocated > 0 && existingFallback.price > 0) {
    baseLots = [
      {
        id: 'lot_init',
        date: existingFallback.date || new Date().toISOString().split('T')[0],
        price: existingFallback.price,
        capitalAllocated: existingFallback.capitalAllocated,
        shares: existingFallback.capitalAllocated / existingFallback.price,
        note: 'Compra inicial',
      },
    ];
  }

  const currentResult = calculateWeightedAveragePosition(baseLots);

  const newLotShares =
    newPurchase.price > 0 ? newPurchase.capitalAllocated / newPurchase.price : 0;

  const nextLot: PositionPurchaseLot = {
    id: `lot_preview_${Date.now()}`,
    date: newPurchase.date || new Date().toISOString().split('T')[0],
    price: newPurchase.price,
    capitalAllocated: newPurchase.capitalAllocated,
    shares: newLotShares,
    note: newPurchase.note || 'Nueva compra DCA',
  };

  const simulatedLots = [...baseLots, nextLot];
  const nextResult = calculateWeightedAveragePosition(simulatedLots);

  const currentAvg = currentResult.weightedAveragePrice || existingFallback.price || 1;
  const priceDeltaPct =
    currentAvg > 0 ? ((nextResult.weightedAveragePrice - currentAvg) / currentAvg) * 100 : 0;

  return {
    currentCapital: currentResult.totalCapital,
    currentShares: currentResult.totalShares,
    currentPrice: currentAvg,
    newTotalCapital: nextResult.totalCapital,
    newTotalShares: nextResult.totalShares,
    newWeightedPrice: nextResult.weightedAveragePrice,
    priceDeltaPct: Number(priceDeltaPct.toFixed(2)),
    simulatedLots,
  };
}
