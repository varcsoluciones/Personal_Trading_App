export interface CapitalMovement {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'; // ADJUSTMENT = corrección manual de saldo
  amount: number; // positivo para depósito/ajuste hacia arriba, negativo para retiro/ajuste hacia abajo
  note?: string;
  date: string;
}

export interface RealPosition {
  id: string;
  assetId: string;
  symbol: string;
  entryPrice: number;
  entryDate: string;
  capitalAllocated: number; // capital real que el usuario invirtió en esta operación
  stopLoss: number | null; // null = el usuario decidió no poner SL
  takeProfit: number | null; // null = el usuario decidió no poner TP
  status: 'OPEN' | 'CLOSED';
  exitPrice?: number;
  exitDate?: string;
  closeReason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL'; // cómo se cerró
  realizedPnl?: number; // solo cuando status === 'CLOSED'
  realizedPnlPct?: number;
  sourceSuggestion?: { // los valores originales que sugería la app al momento de aplicar, para referencia/comparación
    suggestedEntryPrice: number;
    suggestedStopLoss: number;
    suggestedTakeProfit: number;
  };
}
