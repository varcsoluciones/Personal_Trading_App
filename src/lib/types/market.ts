export type AssetType = 'crypto' | 'stock' | 'etf';

export interface Candle {
  time: string | number; // 'YYYY-MM-DD' or unix timestamp seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';
export type SignalType = 'OPORTUNIDAD DE ENTRADA' | 'ESPERAR / MANTENER' | 'OPORTUNIDAD DE SALIDA';
export type AssetCategory = 'stable' | 'range' | 'trend' | 'volatile';

export type TradingHorizon = 'CORTO_PLAZO' | 'MEDIANO_PLAZO' | 'LARGO_PLAZO';

export interface HorizonSuggestion {
  horizon: TradingHorizon;
  horizonLabel: 'Corto Plazo' | 'Mediano Plazo' | 'Largo Plazo';
  horizonSubtitle: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedDaysAvg: number;
  durationLabel: string;
  rationale: string;
}

export interface ScoreCriterionBreakdown {
  id: string;
  name: string;
  points: number;
  maxPoints: number;
  status: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface ScoreBreakdown {
  baseScore: number;
  totalScore: number;
  criteria: ScoreCriterionBreakdown[];
}

export interface TrendAnalysis {
  trend: TrendDirection;
  trendLabel: 'Alcista' | 'Bajista' | 'Lateral';
  daysInTrend: number;
  reversalRisk: {
    level: RiskLevel;
    percentage: number;
    reasons: string[];
  };
  volatilityMetrics: {
    adx: number;
    plusDI: number;
    minusDI: number;
    atr: number;
    atrPct: number;
    strengthLabel: 'Muy Fuerte' | 'Fuerte' | 'Moderada' | 'Débil / Rango';
  };
  indicators: {
    ema20: number;
    ema50: number;
    ema200?: number;
    rsi: number;
    rsiDivergence?: 'BULLISH' | 'BEARISH' | 'NONE';
  };
  signal: SignalType;
  signalReason: string;
  opportunityScore: number; // 0 - 100
  scoreBreakdown?: ScoreBreakdown;
  opportunityCategory: AssetCategory;
  categoryLabel: string;
  orderSetup: {
    currentPrice: number;
    suggestedEntryPrice: number;
    entryType: 'INMEDIATA' | 'PULLBACK_ESPERADO' | 'REBOTE_SOPORTE';
    entryLabel: string;
    distanceToEntryPct: number;
    suggestedStopLoss: number;
    suggestedStopLossPct: number;
    suggestedTakeProfit: number;
    suggestedTakeProfitPct: number;
    riskRewardRatio: number;
    potentialRiskUSD: number;
    potentialRewardUSD: number;
    horizonSuggestion: HorizonSuggestion;
  };
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  candles: Candle[];
  analysis?: TrendAnalysis;
  isSimulated?: boolean;
  backtestReliabilityScore?: number;
  backtestReliabilityLabel?: 'ALTA' | 'MEDIA' | 'BAJA';
  backtestLowSampleWarning?: boolean;
}

export interface BacktestConfig {
  initialCapital: number;
  brokerPreset?: 'IBKR_TIERED' | 'IBKR_FIXED' | 'CRYPTO' | 'CUSTOM';
  commissionRate: number; // e.g. 0.0005 (0.05% IBKR Tiered)
  slippageRate: number;   // e.g. 0.0002 (0.02% IBKR SmartRouting)
  rsiPeriod: number;      // default 14
  rsiOversold: number;    // default 35
  rsiOverbought: number;  // default 68
  emaFastPeriod: number;  // default 20
  emaSlowPeriod: number;  // default 50
  stopLossPct: number;    // default 3.5%
  takeProfitRatio: number;// default 2.0 (1:2 R:R)
  useAtrStop: boolean;    // optional ATR dynamic stop
  entryTolerancePct?: number; // default 1.0 (±1% tolerance zone)
}

export interface Trade {
  id: string;
  entryDate: string;
  exitDate: string;
  type: 'LONG';
  entryPrice: number;
  exitPrice: number;
  shares: number;
  grossPnl: number;
  fees: number;
  slippageCost: number;
  netPnl: number;
  netPnlPct: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'END_OF_DATA';
  capitalAfter: number;
  holdingDays: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  buyAndHoldEquity: number;
  drawdownPct: number;
}

export interface WalkForwardMetrics {
  inSampleProfitFactor: number;
  outOfSampleProfitFactor: number;
  inSampleWinRate: number;
  outOfSampleWinRate: number;
  inSampleTrades: number;
  outOfSampleTrades: number;
}

export interface BacktestResult {
  initialCapital: number;
  finalCapital: number;
  totalNetProfit: number;
  totalNetProfitPct: number;
  buyAndHoldProfit: number;
  buyAndHoldProfitPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // in %
  profitFactor: number;
  maxDrawdown: number; // in %
  maxDrawdownUSD: number;
  avgTradeProfit: number;
  avgWinUSD: number;
  avgLossUSD: number;
  riskRewardRatio: number;
  totalFeesPaid: number;
  equityCurve: EquityPoint[];
  trades: Trade[];
  lowSampleWarning?: boolean;
  ambiguousBarsCount?: number;
  reliabilityScore: number; // 0 - 100
  reliabilityLabel: 'ALTA' | 'MEDIA' | 'BAJA';
  walkForwardMetrics?: WalkForwardMetrics;
}
