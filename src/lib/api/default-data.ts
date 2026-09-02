export interface AssetDefinition {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'etf';
  defaultCategory: 'stable' | 'range' | 'trend' | 'volatile';
}

export const POPULAR_ASSETS_CATALOG: AssetDefinition[] = [
  // Criptomonedas Populares
  { id: 'BTCUSDT', symbol: 'BTC/USDT', name: 'Bitcoin', type: 'crypto', defaultCategory: 'trend' },
  { id: 'ETHUSDT', symbol: 'ETH/USDT', name: 'Ethereum', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'SOLUSDT', symbol: 'SOL/USDT', name: 'Solana', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'BNBUSDT', symbol: 'BNB/USDT', name: 'Binance Coin', type: 'crypto', defaultCategory: 'stable' },
  { id: 'XRPUSDT', symbol: 'XRP/USDT', name: 'Ripple', type: 'crypto', defaultCategory: 'range' },
  { id: 'ADAUSDT', symbol: 'ADA/USDT', name: 'Cardano', type: 'crypto', defaultCategory: 'range' },
  { id: 'DOGEUSDT', symbol: 'DOGE/USDT', name: 'Dogecoin', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'AVAXUSDT', symbol: 'AVAX/USDT', name: 'Avalanche', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'LINKUSDT', symbol: 'LINK/USDT', name: 'Chainlink', type: 'crypto', defaultCategory: 'trend' },
  { id: 'SUIUSDT', symbol: 'SUI/USDT', name: 'Sui Network', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'NEARUSDT', symbol: 'NEAR/USDT', name: 'NEAR Protocol', type: 'crypto', defaultCategory: 'trend' },

  // ETFs Populares
  { id: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ (Nasdaq 100)', type: 'etf', defaultCategory: 'trend' },
  { id: 'SCHD', symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', defaultCategory: 'stable' },
  { id: 'DIA', symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'IWM', symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf', defaultCategory: 'range' },
  { id: 'SMH', symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'etf', defaultCategory: 'trend' },
  { id: 'GLD', symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf', defaultCategory: 'stable' },
  { id: 'TLT', symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'XLK', symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', type: 'etf', defaultCategory: 'trend' },
  { id: 'XLE', symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', type: 'etf', defaultCategory: 'range' },

  // Acciones Populares
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', defaultCategory: 'trend' },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', defaultCategory: 'stable' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', defaultCategory: 'stable' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', type: 'stock', defaultCategory: 'stable' },
  { id: 'META', symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', defaultCategory: 'volatile' },
  { id: 'AMD', symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', defaultCategory: 'volatile' },
  { id: 'NFLX', symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'COIN', symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'stock', defaultCategory: 'volatile' },
  { id: 'PLTR', symbol: 'PLTR', name: 'Palantir Technologies', type: 'stock', defaultCategory: 'trend' },
  { id: 'BABA', symbol: 'BABA', name: 'Alibaba Group Holding', type: 'stock', defaultCategory: 'range' },
];

export const DEFAULT_ASSETS_LIST: AssetDefinition[] = POPULAR_ASSETS_CATALOG.slice(0, 10);
