import { exportAppBackup, importAppBackup, BACKUP_STORAGE_KEYS } from './src/lib/utils/backup-manager';

console.log('🧪 Testing Backup Manager (Export & Import Migration)...\n');

// Mock browser localStorage in Node environment
const mockStorage: Record<string, string> = {};
(globalThis as any).window = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
};

// 1. Setup sample state
mockStorage[BACKUP_STORAGE_KEYS.settings] = JSON.stringify({
  theme: 'dark',
  accentColor: 'emerald',
  currency: 'USD',
  refreshInterval: 60,
});

mockStorage[BACKUP_STORAGE_KEYS.portfolio] = JSON.stringify({
  initialCapital: 10000,
  cashBalance: 8500,
  positions: [{ id: 'pos-1', symbol: 'VOO', shares: 10, buyPrice: 700 }],
  movements: [],
});

mockStorage[BACKUP_STORAGE_KEYS.watchlist] = JSON.stringify([
  { symbol: 'VOO', category: 'etf' },
  { symbol: 'BTCUSDT', category: 'crypto' },
]);

mockStorage[BACKUP_STORAGE_KEYS.alerts] = JSON.stringify([
  { id: 'alert-1', assetId: 'VOO', targetPrice: 710, condition: 'ABOVE' },
]);

console.log('✅ Initial Mock LocalStorage prepared:');
console.log(' - Watchlist count:', JSON.parse(mockStorage[BACKUP_STORAGE_KEYS.watchlist]).length);
console.log(' - Portfolio positions:', JSON.parse(mockStorage[BACKUP_STORAGE_KEYS.portfolio]).positions.length);
console.log(' - Alerts count:', JSON.parse(mockStorage[BACKUP_STORAGE_KEYS.alerts]).length);

// 2. Test Import logic with a new sample JSON payload
const sampleBackupPayload = {
  appName: 'Personal Trading Pro',
  appVersion: 'v2.6.0',
  exportedAt: new Date().toISOString(),
  data: {
    settings: { theme: 'light', accentColor: 'purple', currency: 'EUR' },
    portfolio: {
      initialCapital: 25000,
      cashBalance: 15000,
      positions: [
        { id: 'pos-1', symbol: 'NVDA', shares: 50, buyPrice: 120 },
        { id: 'pos-2', symbol: 'AAPL', shares: 30, buyPrice: 220 },
      ],
      movements: [],
    },
    watchlist: [
      { symbol: 'NVDA', category: 'stock' },
      { symbol: 'AAPL', category: 'stock' },
      { symbol: 'SOLUSDT', category: 'crypto' },
    ],
    alerts: [
      { id: 'alert-1', assetId: 'NVDA', targetPrice: 130, condition: 'ABOVE' },
      { id: 'alert-2', assetId: 'AAPL', targetPrice: 215, condition: 'BELOW' },
    ],
  },
};

const importResult = importAppBackup(JSON.stringify(sampleBackupPayload));
console.log('\nResult of Import:', importResult);

if (!importResult.success) {
  throw new Error('Verification failed: import should have succeeded!');
}

if (importResult.stats?.portfolioPositionsCount !== 2) {
  throw new Error(`Expected 2 portfolio positions, got ${importResult.stats?.portfolioPositionsCount}`);
}

if (importResult.stats?.watchlistCount !== 3) {
  throw new Error(`Expected 3 watchlist items, got ${importResult.stats?.watchlistCount}`);
}

if (importResult.stats?.alertsCount !== 2) {
  throw new Error(`Expected 2 alerts, got ${importResult.stats?.alertsCount}`);
}

// Check restored values in localStorage
const restoredSettings = JSON.parse(mockStorage[BACKUP_STORAGE_KEYS.settings]);
if (restoredSettings.accentColor !== 'purple' || restoredSettings.currency !== 'EUR') {
  throw new Error('Settings restoration mismatch!');
}

// 3. Test Invalid JSON rejection
const invalidResult = importAppBackup('invalid json content');
if (invalidResult.success) {
  throw new Error('Invalid JSON should have failed!');
}
console.log('✅ Correctly rejected malformed JSON:', invalidResult.message);

console.log('\n✨ ALL BACKUP & RESTORE IMPORT/EXPORT TESTS PASSED SUCCESSFULLY!');
