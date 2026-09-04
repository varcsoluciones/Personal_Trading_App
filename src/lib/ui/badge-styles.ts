import { AssetType } from '../types/market';

export function getAssetTypeBadgeStyle(type: AssetType, isDark = true): string {
  switch (type) {
    case 'crypto':
      return isDark
        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        : 'bg-purple-50 text-purple-700 border-purple-200';
    case 'stock':
      return isDark
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        : 'bg-blue-50 text-blue-700 border-blue-200';
    case 'etf':
      return isDark
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'commodity':
      return isDark
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

export function getAssetTypeLabel(type: AssetType): string {
  switch (type) {
    case 'crypto':
      return 'Cripto';
    case 'stock':
      return 'Acción';
    case 'etf':
      return 'ETF';
    case 'commodity':
      return 'Mineral';
    default:
      return type;
  }
}

export function getTrendBadgeStyle(trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL', isDark = true): {
  badgeClass: string;
  dotClass: string;
} {
  switch (trend) {
    case 'BULLISH':
      return {
        badgeClass: isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'BEARISH':
      return {
        badgeClass: isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'NEUTRAL':
    default:
      return {
        badgeClass: isDark
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
  }
}
