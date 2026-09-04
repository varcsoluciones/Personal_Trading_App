export interface PortfolioWallet {
  id: string; // e.g. 'wallet_main', 'wallet_1712345678_abc'
  name: string; // e.g. 'Cartera Principal', 'Binance Spot', 'Interactive Brokers'
  brokerOrExchange?: string; // 'Binance' | 'Interactive Brokers' | 'Coinbase' | 'Bybit' | 'Robinhood' | 'KuCoin' | 'MetaTrader' | 'Otro'
  color?: string;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface CapitalMovement {
  id: string;
  portfolioId?: string; // Cartera a la que pertenece el movimiento (si no existe, pertenece a la principal)
  targetPortfolioId?: string; // Solo para type === 'TRANSFER', cartera destino
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number; // positivo para depósito/ajuste hacia arriba, negativo para retiro/ajuste hacia abajo, monto en transferencias
  note?: string;
  date: string;
}

export interface RealPosition {
  id: string;
  portfolioId?: string; // Cartera a la que pertenece la posición
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

export interface WalletMetrics {
  walletId: string;
  netContributions: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTradingPnl: number;
  settledCapital: number;
  usedCapital: number;
  availableCash: number;
  totalPortfolioValue: number;
  openPositionsCount: number;
  closedPositionsCount: number;
}
