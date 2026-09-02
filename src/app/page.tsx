'use client';

import React, { useState, useEffect } from 'react';
import { useMarketData } from '@/lib/hooks/use-market-data';
import { useSettings } from '@/lib/context/settings-context';
import { Header } from '@/components/header';
import { WatchlistCard } from '@/components/watchlist/watchlist-card';
import { WatchlistTable } from '@/components/watchlist/watchlist-table';
import { AddAssetModal } from '@/components/watchlist/add-asset-modal';
import { SettingsModal } from '@/components/settings/settings-modal';
import { IndicatorGuideModal } from '@/components/education/indicator-guide-modal';
import { OpportunityScreener } from '@/components/screener/opportunity-screener';
import { TradingChart } from '@/components/chart/trading-chart';
import { StrategyControls } from '@/components/backtesting/strategy-controls';
import { BacktestDashboard } from '@/components/backtesting/backtest-dashboard';
import { TradeHistoryTable } from '@/components/backtesting/trade-history-table';
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
  BookOpen,
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const {
    assets,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    activeTab,
    setActiveTab,
    isLoading,
    backtestConfig,
    updateBacktestConfig,
    backtestResult,
    addAsset,
    removeAsset,
  } = useMarketData();

  const { settings, accent, lastSavedTimestamp, updateSettings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Sync viewMode with saved user preference
  useEffect(() => {
    if (settings.defaultView) {
      setViewMode(settings.defaultView);
    }
  }, [settings.defaultView]);

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    updateSettings({ defaultView: mode });
  };

  // Filter assets by search query
  const filteredAssets = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Market Summary stats
  const bullishCount = assets.filter((a) => a.analysis?.trend === 'BULLISH').length;
  const neutralCount = assets.filter((a) => a.analysis?.trend === 'NEUTRAL').length;
  const bearishCount = assets.filter((a) => a.analysis?.trend === 'BEARISH').length;
  const topAsset = [...assets].sort(
    (a, b) => (b.analysis?.opportunityScore || 0) - (a.analysis?.opportunityScore || 0)
  )[0];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDark
          ? 'bg-[#000000] text-slate-100 selection:bg-blue-500/30'
          : 'bg-[#f2f2f7] text-slate-900 selection:bg-blue-200'
      }`}
    >
      {/* Header (Apple iOS Navigation Bar) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAsset={selectedAsset}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Contingency Simulation Warning Banner */}
      {assets.some((a) => a.isSimulated) && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-xs font-medium transition-all ${
              isDark
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-900 shadow-xs"
            }`}
          >
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-400 shrink-0">
              DATOS SIMULADOS
            </span>
            <span>
              Algunos activos bursátiles están operando con velas cuantitativas calibradas debido a limitaciones de rate-limit de la API externa pública.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Quick Summary Widgets (5 Key Metrics including Lateral/Range) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* 1. Radar Total */}
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Activos en Radar
              </p>
              <h4 className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{assets.length}</h4>
            </div>
          </div>

          {/* 2. Alcistas */}
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Alcistas
              </p>
              <h4 className="text-xl font-bold text-emerald-500 font-mono">
                {bullishCount} <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {assets.length}</span>
              </h4>
            </div>
          </div>

          {/* 3. Laterales / En Rango */}
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-500">
              <Minus className="h-5 w-5 stroke-[3]" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Laterales / Rango
              </p>
              <h4 className="text-xl font-bold text-amber-500 font-mono">
                {neutralCount} <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {assets.length}</span>
              </h4>
            </div>
          </div>

          {/* 4. Bajistas */}
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-rose-500/10 p-2.5 text-rose-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bajistas
              </p>
              <h4 className="text-xl font-bold text-rose-500 font-mono">
                {bearishCount} <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {assets.length}</span>
              </h4>
            </div>
          </div>

          {/* 5. Mejor Score */}
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 col-span-2 sm:col-span-1 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div
              className="rounded-2xl p-2.5 text-white shadow-xs"
              style={{ backgroundColor: accent.hex }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mejor Score
              </p>
              <h4 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {topAsset ? `${topAsset.symbol} (${topAsset.analysis?.opportunityScore})` : '--'}
              </h4>
            </div>
          </div>
        </div>

        {/* TAB 1: WATCHLIST & DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Search + View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar activo por ticker o nombre (ej. BTC, VOO, NVDA)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
                    isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-white placeholder-slate-500'
                      : 'border-slate-200/80 bg-white text-slate-900 placeholder-slate-400 shadow-xs'
                  }`}
                />
              </div>

              {/* View Switcher (Grid vs Table) */}
              <div
                className={`flex items-center p-1 rounded-2xl border ${
                  isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <button
                  onClick={() => handleToggleViewMode('grid')}
                  className={`rounded-xl p-1.5 transition-all ${
                    viewMode === 'grid'
                      ? isDark ? 'bg-[#2c2c2e] text-white shadow-xs' : 'bg-slate-100 text-slate-900 shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Vista en Tarjetas"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleViewMode('table')}
                  className={`rounded-xl p-1.5 transition-all ${
                    viewMode === 'table'
                      ? isDark ? 'bg-[#2c2c2e] text-white shadow-xs' : 'bg-slate-100 text-slate-900 shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Vista en Lista / Tabla"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Asset Content List / Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-48 rounded-3xl border animate-pulse ${
                      isDark ? 'border-slate-800 bg-[#1c1c1e]/60' : 'border-slate-200 bg-white'
                    }`}
                  />
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => (
                  <WatchlistCard
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id === selectedAssetId}
                    onSelect={() => setSelectedAssetId(asset.id)}
                    onRemove={(e) => {
                      e.stopPropagation();
                      removeAsset(asset.id);
                    }}
                    onOpenChart={() => {
                      setSelectedAssetId(asset.id);
                      setActiveTab('chart');
                    }}
                    onOpenBacktest={() => {
                      setSelectedAssetId(asset.id);
                      setActiveTab('backtest');
                    }}
                  />
                ))}
              </div>
            ) : (
              <WatchlistTable
                assets={filteredAssets}
                selectedAssetId={selectedAssetId}
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onRemoveAsset={(id) => removeAsset(id)}
                onOpenChart={(id) => {
                  setSelectedAssetId(id);
                  setActiveTab('chart');
                }}
                onOpenBacktest={(id) => {
                  setSelectedAssetId(id);
                  setActiveTab('backtest');
                }}
              />
            )}
          </div>
        )}

        {/* TAB 2: OPPORTUNITY SCREENER */}
        {activeTab === 'screener' && (
          <OpportunityScreener
            assets={assets}
            onSelectAsset={(id) => setSelectedAssetId(id)}
            onOpenChart={(id) => {
              setSelectedAssetId(id);
              setActiveTab('chart');
            }}
            onOpenBacktest={(id) => {
              setSelectedAssetId(id);
              setActiveTab('backtest');
            }}
          />
        )}

        {/* TAB 3: CHART VIEW WITH EMAs 20/50/200 */}
        {activeTab === 'chart' && selectedAsset && (
          <div className="space-y-4">
            {/* Quick asset pill bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    a.id === selectedAssetId
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} font-bold shadow-xs`
                      : isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <span>{a.symbol}</span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({formatCurrency(a.price, 0)})
                  </span>
                </button>
              ))}
            </div>

            <TradingChart asset={selectedAsset} />
          </div>
        )}

        {/* TAB 4: BACKTESTING LAB (INTERACTIVE BROKERS REALISTIC PRICING) */}
        {activeTab === 'backtest' && selectedAsset && (
          <div className="space-y-6">
            {/* Asset Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    a.id === selectedAssetId
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} font-bold shadow-xs`
                      : isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <span>{a.symbol}</span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({formatCurrency(a.price, 0)})
                  </span>
                </button>
              ))}
            </div>

            {/* Real-time Strategy Sliders & IBKR Cost Model */}
            <StrategyControls
              config={backtestConfig}
              onChange={updateBacktestConfig}
            />

            {/* Dashboard Metrics and Equity Curve */}
            <BacktestDashboard
              result={backtestResult}
              symbol={selectedAsset.symbol}
            />

            {/* Detailed Trades Log */}
            {backtestResult && (
              <TradeHistoryTable trades={backtestResult.trades} />
            )}
          </div>
        )}

      </main>

      {/* Footer with App Version, Last Saved Timestamp & Status */}
      <footer
        className={`border-t py-6 text-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#000000] text-slate-500' : 'border-slate-200/80 bg-white text-slate-500'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Personal Trading Pro
              </span>
              <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-500 font-mono">
                v2.1.0
              </span>
            </div>
            <span className="hidden sm:inline text-slate-400">•</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              <span>Último guardado local:</span>
              <strong className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {lastSavedTimestamp || 'Guardado'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1 text-emerald-500 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Navegador Sincronizado</span>
            </div>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Guía de Indicadores</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Add Asset Modal with Multi-Add and Green Checks */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addAsset}
        existingSymbols={assets.map((a) => a.symbol)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Indicator Educational Guide Modal */}
      <IndicatorGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
