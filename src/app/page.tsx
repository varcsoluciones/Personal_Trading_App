'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Layers,
  BookOpen,
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

  const { settings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Filter assets by search query
  const filteredAssets = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Market Summary stats
  const bullishCount = assets.filter((a) => a.analysis?.trend === 'BULLISH').length;
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

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Quick Summary Widgets (iOS Widgets Style) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Activos en Radar
              </p>
              <h4 className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{assets.length}</h4>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Alcistas
              </p>
              <h4 className="text-xl font-bold text-emerald-500 font-mono">
                {bullishCount} <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {assets.length}</span>
              </h4>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-rose-500/10 p-2.5 text-rose-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bajistas
              </p>
              <h4 className="text-xl font-bold text-rose-500 font-mono">
                {bearishCount} <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {assets.length}</span>
              </h4>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-3xl border p-4 transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
            }`}
          >
            <div className="rounded-2xl bg-purple-500/10 p-2.5 text-purple-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mejor Score
              </p>
              <h4 className={`text-base font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center rounded-2xl border p-1 transition-colors ${
                    isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-xl p-1.5 transition-all ${
                      viewMode === 'grid'
                        ? isDark ? 'bg-[#2c2c2e] text-blue-400' : 'bg-slate-100 text-blue-600'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista en Tarjetas"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`rounded-xl p-1.5 transition-all ${
                      viewMode === 'table'
                        ? isDark ? 'bg-[#2c2c2e] text-blue-400' : 'bg-slate-100 text-blue-600'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista en Tabla"
                  >
                    <TableIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content: Grid or Table */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-64 animate-pulse rounded-3xl border ${
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
                    onOpenChart={() => setActiveTab('chart')}
                    onOpenBacktest={() => setActiveTab('backtest')}
                  />
                ))}
              </div>
            ) : (
              <WatchlistTable
                assets={filteredAssets}
                selectedAssetId={selectedAssetId}
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onRemoveAsset={removeAsset}
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

        {/* TAB 2: BUSCADOR DE OPORTUNIDADES (SCREENER INTELIGENTE) */}
        {activeTab === 'screener' && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* TAB 3: GRÁFICO TÉCNICO INTERACTIVO & SEÑALES */}
        {activeTab === 'chart' && selectedAsset && (
          <div className="space-y-6">
            {/* Asset Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    a.id === selectedAssetId
                      ? 'border-blue-500 bg-blue-500/15 text-blue-600 font-bold'
                      : isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{a.symbol}</span>
                  <span
                    className={`font-mono text-[11px] ${
                      a.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {a.change24hPct >= 0 ? '+' : ''}{a.change24hPct.toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>

            <TradingChart asset={selectedAsset} />
          </div>
        )}

        {/* TAB 4: SIMULADOR DE BACKTESTING & EFECTIVIDAD */}
        {activeTab === 'backtest' && selectedAsset && (
          <div className="space-y-6">
            {/* Asset Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    a.id === selectedAssetId
                      ? 'border-blue-500 bg-blue-500/15 text-blue-600 font-bold'
                      : isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{a.symbol}</span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({formatCurrency(a.price, 0)})
                  </span>
                </button>
              ))}
            </div>

            {/* Real-time Strategy Sliders */}
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

      {/* Footer */}
      <footer
        className={`border-t py-6 text-center text-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#000000] text-slate-500' : 'border-slate-200/80 bg-white text-slate-500'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Personal Trading Pro</span>
            <span>· Análisis Cuantitativo con Fricción Real</span>
          </div>
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="text-blue-500 hover:underline flex items-center gap-1"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Guía de Indicadores</span>
          </button>
        </div>
      </footer>

      {/* Add Asset Modal with Live Dropdown Search */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addAsset}
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
