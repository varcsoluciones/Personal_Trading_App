'use client';

import React from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import {
  Layers,
  Compass,
  TrendingUp,
  BarChart2,
  Settings,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'screener' | 'chart' | 'backtest';
  setActiveTab: (tab: 'dashboard' | 'screener' | 'chart' | 'backtest') => void;
  selectedAsset: Asset | null;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenGuideModal: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  selectedAsset,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenGuideModal,
}: HeaderProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'border-slate-800/80 bg-[#000000]/90 text-white'
          : 'border-slate-200/80 bg-white/90 text-slate-900 shadow-xs'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2">
        {/* Top Row: Brand & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-xs border border-slate-800/80 bg-black"
            >
              <img
                src="/app-logo.png"
                alt="Personal Trading Pro Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Personal <span style={{ color: accent.hex }}>Trading</span>
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${accent.tintBgClass} ${accent.textClass}`}
                >
                  Pro
                </span>
              </div>
              <p className={`hidden sm:block text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Análisis Cuantitativo & Backtesting
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            className={`hidden md:flex items-center p-1 rounded-2xl border transition-colors ${
              isDark
                ? 'border-slate-800 bg-[#1c1c1e]'
                : 'border-slate-200/80 bg-slate-100/90'
            }`}
          >
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? isDark
                    ? 'bg-[#2c2c2e] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Watchlist</span>
            </button>

            <button
              onClick={() => setActiveTab('screener')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'screener'
                  ? isDark
                    ? 'bg-[#2c2c2e] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Oportunidades</span>
            </button>

            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'chart'
                  ? isDark
                    ? 'bg-[#2c2c2e] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Gráfico</span>
            </button>

            <button
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'backtest'
                  ? isDark
                    ? 'bg-[#2c2c2e] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Backtesting</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Active Asset Pill (Desktop only) */}
            {selectedAsset && (
              <div
                className={`hidden xl:flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs ${
                  isDark
                    ? 'border-slate-800 bg-[#1c1c1e]'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <span className="font-bold">{selectedAsset.symbol}</span>
                <span
                  className={`font-mono font-semibold ${
                    selectedAsset.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {formatCurrency(selectedAsset.price)}
                </span>
              </div>
            )}

            {/* Guide Button */}
            <button
              onClick={onOpenGuideModal}
              title="Guía de Indicadores"
              className={`flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isDark
                  ? `border-slate-800 bg-[#1c1c1e] ${accent.textClass} hover:bg-[#2c2c2e]`
                  : `border-slate-200 bg-white ${accent.textClass} hover:bg-slate-50 shadow-xs`
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              title="Configuración"
              className={`flex h-8 w-8 items-center justify-center rounded-2xl border transition-all ${
                isDark
                  ? 'border-slate-800 bg-[#1c1c1e] text-slate-400 hover:text-white hover:bg-[#2c2c2e]'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>

            {/* Add Asset Button */}
            <button
              onClick={onOpenAddModal}
              style={{ backgroundColor: accent.hex }}
              className="flex items-center gap-1 rounded-2xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">Agregar</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar (Row 2 on small screens) */}
        <nav
          className={`mt-2 flex md:hidden items-center justify-between p-1 rounded-2xl border transition-colors ${
            isDark
              ? 'border-slate-800 bg-[#1c1c1e]'
              : 'border-slate-200/80 bg-slate-100/90'
          }`}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'dashboard'
                ? isDark
                  ? 'bg-[#2c2c2e] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span className="truncate">Watchlist</span>
          </button>

          <button
            onClick={() => setActiveTab('screener')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'screener'
                ? isDark
                  ? 'bg-[#2c2c2e] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            <Compass className="h-3 w-3" />
            <span className="truncate">Oportunidades</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'chart'
                ? isDark
                  ? 'bg-[#2c2c2e] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span className="truncate">Gráfico</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'backtest'
                ? isDark
                  ? 'bg-[#2c2c2e] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            <BarChart2 className="h-3 w-3" />
            <span className="truncate">Backtest</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
