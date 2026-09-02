export type ThemeMode = 'dark' | 'light';
export type CurrencySymbol = 'USD' | 'EUR' | 'GBP' | 'USDT';
export type AppleAccentColor =
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'graphite';

export interface AppSettings {
  theme: ThemeMode;
  accentColor: AppleAccentColor;
  currency: CurrencySymbol;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  confettiCelebration: boolean;
  defaultRiskReward: number;
  defaultView: 'grid' | 'table';
  lastSavedAt?: string;
}

export const APPLE_ACCENT_PALETTE: {
  id: AppleAccentColor;
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  tintBgClass: string;
  ringClass: string;
}[] = [
  {
    id: 'blue',
    name: 'Azul Apple',
    hex: '#007aff',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500',
    tintBgClass: 'bg-blue-500/15',
    ringClass: 'ring-blue-500',
  },
  {
    id: 'purple',
    name: 'Púrpura',
    hex: '#af52de',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500',
    tintBgClass: 'bg-purple-500/15',
    ringClass: 'ring-purple-500',
  },
  {
    id: 'pink',
    name: 'Rosa',
    hex: '#ff2d55',
    bgClass: 'bg-pink-500',
    textClass: 'text-pink-500',
    borderClass: 'border-pink-500',
    tintBgClass: 'bg-pink-500/15',
    ringClass: 'ring-pink-500',
  },
  {
    id: 'red',
    name: 'Rojo',
    hex: '#ff3b30',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    borderClass: 'border-red-500',
    tintBgClass: 'bg-red-500/15',
    ringClass: 'ring-red-500',
  },
  {
    id: 'orange',
    name: 'Naranja',
    hex: '#ff9500',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500',
    tintBgClass: 'bg-orange-500/15',
    ringClass: 'ring-orange-500',
  },
  {
    id: 'yellow',
    name: 'Amarillo',
    hex: '#ffcc00',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500',
    tintBgClass: 'bg-amber-500/15',
    ringClass: 'ring-amber-500',
  },
  {
    id: 'green',
    name: 'Verde',
    hex: '#34c759',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500',
    tintBgClass: 'bg-emerald-500/15',
    ringClass: 'ring-emerald-500',
  },
  {
    id: 'teal',
    name: 'Cian / Teal',
    hex: '#5ac8fa',
    bgClass: 'bg-cyan-500',
    textClass: 'text-cyan-500',
    borderClass: 'border-cyan-500',
    tintBgClass: 'bg-cyan-500/15',
    ringClass: 'ring-cyan-500',
  },
  {
    id: 'graphite',
    name: 'Grafito',
    hex: '#8e8e93',
    bgClass: 'bg-slate-600',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-500',
    tintBgClass: 'bg-slate-500/15',
    ringClass: 'ring-slate-500',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'blue',
  currency: 'USD',
  autoRefresh: true,
  refreshInterval: 60,
  confettiCelebration: true,
  defaultRiskReward: 2.2,
  defaultView: 'table',
};
