import { APP_VERSION } from '@/lib/version';

export const BACKUP_STORAGE_KEYS = {
  settings: 'personal_trading_user_settings_v3',
  settingsFallback: 'quantpulse_user_settings_v2',
  portfolio: 'quantpulse_portfolio_v1',
  watchlist: 'personal_trading_custom_watchlist_v1',
  alerts: 'quantpulse_price_alerts_v1',
  backtestConfig: 'quantpulse_backtest_config_v2',
  activeTab: 'quantpulse_active_tab_v2',
  selectedAsset: 'quantpulse_selected_asset_v2',
};

export interface AppBackupPayload {
  appName: string;
  appVersion: string;
  exportedAt: string;
  data: {
    settings?: any;
    portfolio?: any;
    watchlist?: any;
    alerts?: any;
    backtestConfig?: any;
  };
}

/**
 * Generates and downloads a complete JSON backup of the user's application data
 */
export function exportAppBackup(): void {
  if (typeof window === 'undefined') return;

  const data: AppBackupPayload['data'] = {};

  // 1. Settings
  try {
    const rawSettings =
      localStorage.getItem(BACKUP_STORAGE_KEYS.settings) ||
      localStorage.getItem(BACKUP_STORAGE_KEYS.settingsFallback);
    if (rawSettings) data.settings = JSON.parse(rawSettings);
  } catch (e) {}

  // 2. Portfolio
  try {
    const rawPortfolio = localStorage.getItem(BACKUP_STORAGE_KEYS.portfolio);
    if (rawPortfolio) data.portfolio = JSON.parse(rawPortfolio);
  } catch (e) {}

  // 3. Custom Watchlist
  try {
    const rawWatchlist = localStorage.getItem(BACKUP_STORAGE_KEYS.watchlist);
    if (rawWatchlist) data.watchlist = JSON.parse(rawWatchlist);
  } catch (e) {}

  // 4. Price Alerts
  try {
    const rawAlerts = localStorage.getItem(BACKUP_STORAGE_KEYS.alerts);
    if (rawAlerts) data.alerts = JSON.parse(rawAlerts);
  } catch (e) {}

  // 5. Backtest Configuration
  try {
    const rawBacktest = localStorage.getItem(BACKUP_STORAGE_KEYS.backtestConfig);
    if (rawBacktest) data.backtestConfig = JSON.parse(rawBacktest);
  } catch (e) {}

  const payload: AppBackupPayload = {
    appName: 'Personal Trading Pro',
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `personal_trading_pro_backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportBackupResult {
  success: boolean;
  message: string;
  stats?: {
    hasSettings: boolean;
    portfolioPositionsCount: number;
    watchlistCount: number;
    alertsCount: number;
  };
}

/**
 * Parses and restores user application data from a JSON backup file
 */
export function importAppBackup(jsonContent: string): ImportBackupResult {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Entorno de navegador no disponible.' };
  }

  try {
    const parsed = JSON.parse(jsonContent);

    // Support both direct data envelope or wrapped backup payload
    const backupData = parsed.data || parsed;

    if (!backupData || typeof backupData !== 'object') {
      return { success: false, message: 'El archivo seleccionado no contiene un formato de respaldo válido.' };
    }

    let hasSettings = false;
    let portfolioPositionsCount = 0;
    let watchlistCount = 0;
    let alertsCount = 0;

    // 1. Restore Settings
    if (backupData.settings && typeof backupData.settings === 'object') {
      localStorage.setItem(BACKUP_STORAGE_KEYS.settings, JSON.stringify(backupData.settings));
      hasSettings = true;
    }

    // 2. Restore Portfolio
    if (backupData.portfolio) {
      localStorage.setItem(BACKUP_STORAGE_KEYS.portfolio, JSON.stringify(backupData.portfolio));
      if (Array.isArray(backupData.portfolio.positions)) {
        portfolioPositionsCount = backupData.portfolio.positions.length;
      }
    }

    // 3. Restore Watchlist
    if (Array.isArray(backupData.watchlist)) {
      localStorage.setItem(BACKUP_STORAGE_KEYS.watchlist, JSON.stringify(backupData.watchlist));
      watchlistCount = backupData.watchlist.length;
    }

    // 4. Restore Alerts
    if (Array.isArray(backupData.alerts)) {
      localStorage.setItem(BACKUP_STORAGE_KEYS.alerts, JSON.stringify(backupData.alerts));
      alertsCount = backupData.alerts.length;
    }

    // 5. Restore Backtest Config
    if (backupData.backtestConfig) {
      localStorage.setItem(BACKUP_STORAGE_KEYS.backtestConfig, JSON.stringify(backupData.backtestConfig));
    }

    return {
      success: true,
      message: '¡Datos importados y restaurados exitosamente!',
      stats: {
        hasSettings,
        portfolioPositionsCount,
        watchlistCount,
        alertsCount,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al procesar el archivo: ${error?.message || 'JSON inválido'}`,
    };
  }
}
