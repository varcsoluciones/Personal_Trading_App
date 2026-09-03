/**
 * Normalizes any crypto symbol variant to standard Binance format (ends in USDT).
 * Examples:
 * - "ETHUSD"  -> "ETHUSDT"
 * - "ETH-USD" -> "ETHUSDT"
 * - "ETH/USD" -> "ETHUSDT"
 * - "ETH"     -> "ETHUSDT"
 * - "ETHUSDT" -> "ETHUSDT"
 * - "eth-usd" -> "ETHUSDT"
 * - "btcusdt" -> "BTCUSDT"
 * - "SOL/USDT" -> "SOLUSDT"
 */
export function normalizeCryptoSymbol(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let clean = input.trim().toUpperCase();

  // Remove common separators (/, -, _, spaces)
  clean = clean.replace(/[\/\-\s_]/g, '');

  // Strip trailing USDT or USD to extract the pure base asset
  if (clean.endsWith('USDT')) {
    const base = clean.slice(0, -4);
    return `${base}USDT`;
  }

  if (clean.endsWith('USD')) {
    const base = clean.slice(0, -3);
    return `${base}USDT`;
  }

  if (clean.endsWith('USDC')) {
    const base = clean.slice(0, -4);
    return `${base}USDT`;
  }

  // Raw ticker without quote currency (e.g. "BTC", "ETH", "SOL", "ADA")
  return `${clean}USDT`;
}
