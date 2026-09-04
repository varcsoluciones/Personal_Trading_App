import { AssetType } from '../types/market';

export interface AssetDefinition {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  defaultCategory: 'stable' | 'range' | 'trend' | 'volatile';
}

export const POPULAR_ASSETS_CATALOG: AssetDefinition[] = [
  // Minerales, Metales & Materias Primas (Commodities)
  { id: 'GC=F', symbol: 'GC=F', name: 'Oro (Futuros Gold)', type: 'commodity', defaultCategory: 'stable' },
  { id: 'SI=F', symbol: 'SI=F', name: 'Plata (Futuros Silver)', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'CL=F', symbol: 'CL=F', name: 'Petróleo Crudo WTI', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'BZ=F', symbol: 'BZ=F', name: 'Petróleo Brent', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'HG=F', symbol: 'HG=F', name: 'Cobre (Copper Futures)', type: 'commodity', defaultCategory: 'stable' },
  { id: 'NG=F', symbol: 'NG=F', name: 'Gas Natural (Natural Gas)', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'PL=F', symbol: 'PL=F', name: 'Platino (Platinum Futures)', type: 'commodity', defaultCategory: 'stable' },
  { id: 'PA=F', symbol: 'PA=F', name: 'Paladio (Palladium Futures)', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'GLD', symbol: 'GLD', name: 'SPDR Gold Trust (Oro)', type: 'commodity', defaultCategory: 'stable' },
  { id: 'SLV', symbol: 'SLV', name: 'iShares Silver Trust (Plata)', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'USO', symbol: 'USO', name: 'United States Oil Fund (Petróleo)', type: 'commodity', defaultCategory: 'volatile' },
  { id: 'PAXGUSDT', symbol: 'PAXG/USDT', name: 'PAX Gold (Oro Tokenizado)', type: 'commodity', defaultCategory: 'stable' },

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
  { id: 'DOTUSDT', symbol: 'DOT/USDT', name: 'Polkadot', type: 'crypto', defaultCategory: 'range' },
  { id: 'PEPEUSDT', symbol: 'PEPE/USDT', name: 'Pepe', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'SHIBUSDT', symbol: 'SHIB/USDT', name: 'Shiba Inu', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'RENDERUSDT', symbol: 'RENDER/USDT', name: 'Render Token', type: 'crypto', defaultCategory: 'trend' },
  { id: 'FETUSDT', symbol: 'FET/USDT', name: 'Artificial Superintelligence Alliance', type: 'crypto', defaultCategory: 'trend' },
  { id: 'TAOUSDT', symbol: 'TAO/USDT', name: 'Bittensor', type: 'crypto', defaultCategory: 'volatile' },
  { id: 'AAVEUSDT', symbol: 'AAVE/USDT', name: 'Aave', type: 'crypto', defaultCategory: 'trend' },

  // ETFs Populares
  { id: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ (Nasdaq 100)', type: 'etf', defaultCategory: 'trend' },
  { id: 'SCHD', symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', defaultCategory: 'stable' },
  { id: 'DIA', symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'IWM', symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf', defaultCategory: 'range' },
  { id: 'SMH', symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'etf', defaultCategory: 'trend' },
  { id: 'SOXX', symbol: 'SOXX', name: 'iShares Semiconductor ETF', type: 'etf', defaultCategory: 'trend' },
  { id: 'TLT', symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'etf', defaultCategory: 'stable' },
  { id: 'XLK', symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', type: 'etf', defaultCategory: 'trend' },
  { id: 'XLE', symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', type: 'etf', defaultCategory: 'range' },
  { id: 'XLF', symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', type: 'etf', defaultCategory: 'stable' },
  { id: 'IBIT', symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', type: 'etf', defaultCategory: 'volatile' },
  { id: 'ETHA', symbol: 'ETHA', name: 'iShares Ethereum Trust ETF', type: 'etf', defaultCategory: 'volatile' },

  // Acciones Populares - Consumo, Defensivas & Financieras
  { id: 'KO', symbol: 'KO', name: 'The Coca-Cola Company', type: 'stock', defaultCategory: 'stable' },
  { id: 'IBKR', symbol: 'IBKR', name: 'Interactive Brokers Group Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'PEP', symbol: 'PEP', name: 'PepsiCo Inc.', type: 'stock', defaultCategory: 'stable' },
  { id: 'MCD', symbol: 'MCD', name: "McDonald's Corporation", type: 'stock', defaultCategory: 'stable' },
  { id: 'JNJ', symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', defaultCategory: 'stable' },
  { id: 'PG', symbol: 'PG', name: 'Procter & Gamble Company', type: 'stock', defaultCategory: 'stable' },
  { id: 'WMT', symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', defaultCategory: 'stable' },
  { id: 'COST', symbol: 'COST', name: 'Costco Wholesale Corporation', type: 'stock', defaultCategory: 'trend' },
  { id: 'JPM', symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', defaultCategory: 'trend' },
  { id: 'V', symbol: 'V', name: 'Visa Inc.', type: 'stock', defaultCategory: 'stable' },
  { id: 'MA', symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', defaultCategory: 'stable' },
  { id: 'BAC', symbol: 'BAC', name: 'Bank of America Corporation', type: 'stock', defaultCategory: 'range' },
  { id: 'GS', symbol: 'GS', name: 'The Goldman Sachs Group Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'SCHW', symbol: 'SCHW', name: 'The Charles Schwab Corporation', type: 'stock', defaultCategory: 'trend' },
  { id: 'HOOD', symbol: 'HOOD', name: 'Robinhood Markets Inc.', type: 'stock', defaultCategory: 'volatile' },
  { id: 'DIS', symbol: 'DIS', name: 'The Walt Disney Company', type: 'stock', defaultCategory: 'range' },

  // Acciones Populares - Tecnología & Crecimiento
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
  { id: 'AVGO', symbol: 'AVGO', name: 'Broadcom Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'TSM', symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing', type: 'stock', defaultCategory: 'trend' },
  { id: 'ARM', symbol: 'ARM', name: 'Arm Holdings plc', type: 'stock', defaultCategory: 'volatile' },
  { id: 'SMCI', symbol: 'SMCI', name: 'Super Micro Computer Inc.', type: 'stock', defaultCategory: 'volatile' },
  { id: 'UBER', symbol: 'UBER', name: 'Uber Technologies Inc.', type: 'stock', defaultCategory: 'trend' },
  { id: 'MELI', symbol: 'MELI', name: 'MercadoLibre Inc.', type: 'stock', defaultCategory: 'trend' },
];

export const DEFAULT_ASSETS_LIST: AssetDefinition[] = POPULAR_ASSETS_CATALOG.slice(0, 10);
