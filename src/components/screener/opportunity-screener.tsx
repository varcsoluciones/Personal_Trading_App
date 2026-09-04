'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Asset, AssetCategory } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { AssetOpportunityCard } from '@/components/shared/asset-opportunity-card';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { ScoreBreakdownTooltip } from '@/components/shared/score-breakdown-tooltip';
import { useAlerts } from '@/lib/context/alerts-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Activity,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  BarChart2,
  Bell,
  Award,
  Shield,
  Zap,
  Scale,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react';
import { analyzeAsset } from '@/lib/quant/trend-analyzer';
import { STRATEGY_PRESETS } from '@/lib/quant/strategy-rules';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from '@/lib/quant/backtest-engine';

interface OpportunityScreenerProps {
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
}

interface HistoricalRankingItem {
  id: string;
  symbol: string;
  cleanSymbol: string;
  reliabilityScore: number;
  reliabilityLabel: 'ALTA' | 'MEDIA' | 'BAJA';
  profitFactor: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
}

export function OpportunityScreener({
  assets,
  onSelectAsset,
  onOpenChart,
  onOpenBacktest,
}: OpportunityScreenerProps) {
  const { settings, accent, formatCurrency, updateSettings } = useSettings();
  const isDark = settings.theme === 'dark';
  const { getActiveAlertsCount, openAlertsModal } = useAlerts();

  const [selectedProfileId, setSelectedProfileId] = useState<'conservative' | 'balanced' | 'aggressive'>(
    settings.screenerPresetProfile || 'balanced'
  );
  const [rankingMode, setRankingMode] = useState<'opportunity' | 'historical'>(
    settings.screenerRankingMode || 'opportunity'
  );
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>(
    settings.screenerCategory || 'all'
  );
  const [minScore, setMinScore] = useState<number>(settings.screenerMinScore ?? 50);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(
    settings.screenerViewMode || 'grid'
  );
  const [historicalRankings, setHistoricalRankings] = useState<Map<string, HistoricalRankingItem>>(new Map());
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);

  const isAdvancedFiltersOpen = Boolean(settings.screenerAdvancedFiltersOpen);

  // Sync and persist all screener filters with user settings across navigation & refreshes
  useEffect(() => {
    if (settings.screenerPresetProfile && settings.screenerPresetProfile !== selectedProfileId) {
      setSelectedProfileId(settings.screenerPresetProfile);
    }
    if (settings.screenerViewMode && settings.screenerViewMode !== viewMode) {
      setViewMode(settings.screenerViewMode);
    }
    if (settings.screenerRankingMode && settings.screenerRankingMode !== rankingMode) {
      setRankingMode(settings.screenerRankingMode);
    }
    if (settings.screenerCategory && settings.screenerCategory !== selectedCategory) {
      setSelectedCategory(settings.screenerCategory);
    }
    if (settings.screenerMinScore !== undefined && settings.screenerMinScore !== minScore) {
      setMinScore(settings.screenerMinScore);
    }
  }, [
    settings.screenerPresetProfile,
    settings.screenerViewMode,
    settings.screenerRankingMode,
    settings.screenerCategory,
    settings.screenerMinScore,
  ]);

  const handleSetProfile = (profileId: 'conservative' | 'balanced' | 'aggressive') => {
    setSelectedProfileId(profileId);
    updateSettings({ screenerPresetProfile: profileId });
  };

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    updateSettings({ screenerViewMode: mode });
  };

  const handleSetRankingMode = (mode: 'opportunity' | 'historical') => {
    setRankingMode(mode);
    updateSettings({ screenerRankingMode: mode });
  };

  const handleSetCategory = (cat: AssetCategory | 'all') => {
    setSelectedCategory(cat);
    updateSettings({ screenerCategory: cat });
  };

  const handleSetMinScore = (score: number) => {
    setMinScore(score);
    updateSettings({ screenerMinScore: score });
  };

  // Fetch cached walk-forward historical rankings for the current profile
  useEffect(() => {
    setIsLoadingRankings(true);
    fetch(`/api/screener-rankings?preset=${selectedProfileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.rankings && Array.isArray(data.rankings)) {
          const map = new Map<string, HistoricalRankingItem>();
          data.rankings.forEach((r: HistoricalRankingItem) => {
            map.set(r.symbol, r);
            map.set(r.cleanSymbol, r);
          });
          setHistoricalRankings(map);
        }
      })
      .catch((err) => console.warn('Error loading historical screener rankings:', err))
      .finally(() => setIsLoadingRankings(false));
  }, [selectedProfileId]);

  // Dynamically re-analyze ALL assets and recalculate walk-forward reliability in real time for the active profile
  const dynamicAssets = useMemo(() => {
    const activePreset = STRATEGY_PRESETS.find((p) => p.id === selectedProfileId) || STRATEGY_PRESETS[1];
    const targetConfig = { ...DEFAULT_BACKTEST_CONFIG, ...activePreset.config };

    return assets.map((asset) => {
      if (!asset.candles || asset.candles.length === 0) return asset;
      const freshAnalysis = analyzeAsset(asset.candles, activePreset.config);
      const backtest = runBacktest(asset.candles, targetConfig);

      return {
        ...asset,
        analysis: freshAnalysis,
        backtestReliabilityScore: backtest.reliabilityScore,
        backtestReliabilityLabel: backtest.reliabilityLabel,
        backtestLowSampleWarning: backtest.lowSampleWarning,
      };
    });
  }, [assets, selectedProfileId]);

  // Top 3 Recommended Assets for the currently selected strategy profile
  const top3Recommended = useMemo(() => {
    return [...dynamicAssets]
      .filter((a) => a.analysis && a.analysis.opportunityScore >= 50)
      .sort((a, b) => {
        // Combined scoring: 60% Opportunity Score + 40% Walk-Forward Reliability Score
        const relA = a.backtestReliabilityScore ?? 60;
        const relB = b.backtestReliabilityScore ?? 60;
        const scoreA = (a.analysis?.opportunityScore || 50) * 0.6 + relA * 0.4;
        const scoreB = (b.analysis?.opportunityScore || 50) * 0.6 + relB * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [dynamicAssets]);

  // Categories Definition
  const categories: { id: AssetCategory | 'all'; label: string; icon: any; count: number }[] = [
    {
      id: 'all',
      label: 'Todas las Oportunidades',
      icon: Sparkles,
      count: dynamicAssets.length,
    },
    {
      id: 'trend',
      label: 'Tendencia Fuerte',
      icon: TrendingUp,
      count: dynamicAssets.filter((a) => a.analysis?.opportunityCategory === 'trend').length,
    },
    {
      id: 'volatile',
      label: 'Alta Volatilidad / Oportunidades',
      icon: Flame,
      count: dynamicAssets.filter((a) => a.analysis?.opportunityCategory === 'volatile').length,
    },
    {
      id: 'range',
      label: 'Operaciones en Rango',
      icon: Activity,
      count: dynamicAssets.filter((a) => a.analysis?.opportunityCategory === 'range').length,
    },
    {
      id: 'stable',
      label: 'Más Estable / Conservador',
      icon: ShieldCheck,
      count: dynamicAssets.filter((a) => a.analysis?.opportunityCategory === 'stable').length,
    },
  ];

  // Filter and Sort Assets based on rankingMode (minScore is always preserved and applied)
  const filteredAssets = useMemo(() => {
    return dynamicAssets
      .filter((asset) => {
        if (!asset.analysis) return false;

        // Category filter
        if (selectedCategory !== 'all' && asset.analysis.opportunityCategory !== selectedCategory) {
          return false;
        }

        // Min score filter (always applied whether advanced panel is open or collapsed)
        if (asset.analysis.opportunityScore < minScore) {
          return false;
        }

        // In Historical Consistency mode, filter out assets with low reliability (BAJA)
        if (rankingMode === 'historical') {
          const clean = asset.symbol.replace('/', '').replace('-', '').toUpperCase();
          const rank = historicalRankings.get(asset.symbol) || historicalRankings.get(clean);
          if (rank && rank.reliabilityLabel === 'BAJA') {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (rankingMode === 'historical') {
          const cleanA = a.symbol.replace('/', '').replace('-', '').toUpperCase();
          const cleanB = b.symbol.replace('/', '').replace('-', '').toUpperCase();
          const rankA = historicalRankings.get(a.symbol) || historicalRankings.get(cleanA);
          const rankB = historicalRankings.get(b.symbol) || historicalRankings.get(cleanB);
          const scoreA = rankA?.reliabilityScore ?? 50;
          const scoreB = rankB?.reliabilityScore ?? 50;
          return scoreB - scoreA;
        }

        // Default: Sort by Opportunity Score Now
        return (b.analysis?.opportunityScore || 0) - (a.analysis?.opportunityScore || 0);
      });
  }, [dynamicAssets, selectedCategory, minScore, rankingMode, historicalRankings]);

  return (
    <div className="space-y-6">
      {/* 1. STRATEGY PRESET PROFILE SELECTOR (Conservador / Equilibrado / Agresivo) */}
      <div
        className={`rounded-3xl border p-5 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="mb-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Perfil de Estrategia Cuantitativa
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.tintBgClass} ${accent.textClass}`}>
              Simulación en Vivo
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Selecciona el nivel de riesgo deseado. Todas las oportunidades, entradas, stops y objetivos se recalcularán al instante.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {STRATEGY_PRESETS.map((preset) => {
            const isSelected = selectedProfileId === preset.id;
            const Icon = preset.id === 'conservative' ? Shield : preset.id === 'aggressive' ? Zap : Scale;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSetProfile(preset.id)}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-blue-500 bg-[#2c2c2e] shadow-md shadow-blue-500/10 ring-2 ring-blue-500/50'
                      : 'border-blue-500 bg-blue-50/70 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/50'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 hover:border-slate-700 hover:bg-[#2c2c2e]/70'
                    : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-xs'
                            : isDark
                            ? 'bg-[#1c1c1e] text-slate-400'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {preset.name}
                        </h4>
                        <p className={`text-[10px] font-semibold ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {preset.tagline}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                        Activo
                      </span>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {preset.description}
                  </p>
                </div>

                {/* Quick Strategy Blueprint Pill */}
                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono font-semibold ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <span>SL: -{preset.config.stopLossPct}%</span>
                  <span>TP: 1:{preset.config.takeProfitRatio}x</span>
                  <span>RSI: {preset.config.rsiOversold}-{preset.config.rsiOverbought}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CATEGORY PILLS & STREAMLINED CONTROLS HEADER */}
      <div
        className={`rounded-3xl border p-5 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        {/* ROW 1: Title, Ranking Mode & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-1">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {rankingMode === 'historical'
                  ? 'Activos con Comportamiento Histórico Más Consistente'
                  : 'Radar de Oportunidades & Estrategias'}
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${accent.tintBgClass} ${accent.textClass}`}>
                {filteredAssets.length} encontrados
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {rankingMode === 'historical'
                ? 'Basado en desempeño histórico simulado fuera de muestra (Walk-Forward). No garantiza resultados futuros.'
                : 'Filtra por estilo de mercado y umbral de calidad cuantitativa'}
            </p>
          </div>

          {/* Ranking Mode, View Mode & Advanced Filters Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Ranking Mode Switcher with Tooltip for Historical Mode */}
            <div
              className={`flex items-center gap-1 rounded-2xl border p-1 ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200 bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSetRankingMode('opportunity')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  rankingMode === 'opportunity'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>Oportunidad Ahora</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetRankingMode('historical')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  rankingMode === 'historical'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span>Consistencia Histórica</span>
                <InfoTooltip
                  title="Filtro de Consistencia"
                  text={`Se recalcularon las simulaciones para el perfil ${
                    STRATEGY_PRESETS.find((p) => p.id === selectedProfileId)?.name || 'seleccionado'
                  } y se filtraron los activos con persistencia estadística baja (BAJA).`}
                />
              </button>
            </div>

            {/* 2. Grid vs Table View Switcher */}
            <div
              className={`flex items-center gap-1 rounded-2xl border p-1 ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200 bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista Lista Compacta"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* 3. Advanced Filters Toggle Button (same visual language as strategy-controls.tsx) */}
            <button
              type="button"
              onClick={() => updateSettings({ screenerAdvancedFiltersOpen: !isAdvancedFiltersOpen })}
              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
                isAdvancedFiltersOpen
                  ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`
                  : isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e] text-slate-300 hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{isAdvancedFiltersOpen ? 'Ocultar filtros avanzados' : 'Filtros avanzados ⚙'}</span>
              {isAdvancedFiltersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* ROW 2: Categories Bar */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSetCategory(cat.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-blue-500 bg-[#2c2c2e] text-white shadow-xs ring-1 ring-blue-500'
                      : 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-500' : ''}`} />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ROW 3: Collapsible Advanced Filters (Score Threshold Filter) */}
        {isAdvancedFiltersOpen && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/40 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-blue-500" />
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Filtro de Score Técnico Mínimo:
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-1">
              {[
                { label: 'Todos (≥ 50)', val: 50 },
                { label: 'Buena Calidad (≥ 80)', val: 80 },
                { label: 'Alta Calidad (≥ 95)', val: 95 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleSetMinScore(item.val)}
                  className={`rounded-xl border px-3 py-1 text-xs font-semibold transition-all ${
                    minScore === item.val
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} font-bold`
                      : isDark
                      ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400 hover:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. TOP 3 ASSETS RECOMENDADOS (Compact Podium / Selection) */}
      {top3Recommended.length > 0 && (
        <div
          className={`rounded-3xl border p-4 sm:p-5 shadow-xs transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Top 3 Activos Recomendados
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Opciones más seguras y rentables para el perfil <strong>{STRATEGY_PRESETS.find(p => p.id === selectedProfileId)?.name || 'Activo'}</strong>
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
              Selección Cuantitativa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3Recommended.map((item, idx) => {
              const rankColor =
                idx === 0
                  ? isDark
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                    : 'border-amber-300 bg-amber-50/80 text-amber-900 ring-1 ring-amber-400/30'
                  : idx === 1
                  ? isDark
                    ? 'border-slate-600/60 bg-slate-500/10 text-slate-200'
                    : 'border-slate-300 bg-slate-100 text-slate-800'
                  : isDark
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                  : 'border-orange-200 bg-orange-50/70 text-orange-900';

              const rankBadge = idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : '🥉 #3';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAsset(item.id);
                    onOpenChart(item.id);
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all cursor-pointer hover:scale-[1.01] ${rankColor} ${
                    isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-black tracking-tight">
                          {item.symbol}
                        </span>
                        <span
                          className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                            item.type,
                            isDark
                          )}`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className={`truncate text-[11px] opacity-75 mt-0.5`}>
                        {item.name}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-xl px-2 py-0.5 text-xs font-black font-mono">
                      {rankBadge}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-current/15 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold">{formatCurrency(item.price)}</span>
                      <span
                        className={`ml-1 text-[11px] font-bold ${
                          item.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {item.change24hPct >= 0 ? '+' : ''}
                        {item.change24hPct.toFixed(2)}%
                      </span>
                    </div>

                    <ScoreBreakdownTooltip
                      score={item.analysis?.opportunityScore || 50}
                      breakdown={item.analysis?.scoreBreakdown}
                      align="right"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-bold cursor-help hover:opacity-80 transition-opacity">
                        <span className="opacity-75">Score:</span>
                        <strong className="text-emerald-400">{item.analysis?.opportunityScore || 50}</strong>
                      </div>
                    </ScoreBreakdownTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results Fallback */}
      {filteredAssets.length === 0 && (
        <div
          className={`rounded-3xl border p-12 text-center transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mb-3">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No hay oportunidades que coincidan con estos filtros
          </h3>
          <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Intenta seleccionar otra categoría, reducir el score mínimo o cambiar al perfil de estrategia equilibrado.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setMinScore(50);
              updateSettings({ screenerCategory: 'all', screenerMinScore: 50 });
            }}
            className="mt-4 rounded-2xl bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition-all"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* VISTA 1: TABLA COMPACTA DE OPORTUNIDADES */}
      {viewMode === 'table' && filteredAssets.length > 0 && (
        <div
          className={`overflow-hidden rounded-3xl border shadow-xs transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  <th className="py-3.5 px-4">Activo</th>
                  <th className="py-3.5 px-3">Estructura & Señal</th>
                  <th className="py-3.5 px-3 text-right">Precio & Variación</th>
                  <th className="py-3.5 px-3 min-w-[210px]">Setup Sugerido (Entrada / TP / SL)</th>
                  <th className="py-3.5 px-3 text-center">Horizonte</th>
                  <th className="py-3.5 px-3 text-center">Veredicto Confianza</th>
                  <th className="py-3.5 px-3 text-center">Score Técnico</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredAssets.map((asset) => {
                  const analysis = asset.analysis!;
                  const order = analysis.orderSetup;
                  const isPositive = asset.change24hPct >= 0;
                  const activeAlertsCount = getActiveAlertsCount(asset.id);

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => {
                        onSelectAsset(asset.id);
                        onOpenChart(asset.id);
                      }}
                      className={`group cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-[#2c2c2e]/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Activo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold font-mono text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {asset.symbol}
                              </span>
                              <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                asset.type === 'crypto'
                                  ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
                                  : asset.type === 'stock'
                                  ? isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800'
                                  : isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-800'
                              }`}>
                                {asset.type}
                              </span>
                            </div>
                            <p className={`truncate text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Estructura & Señal */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10px] font-bold ${
                              analysis.signal === 'OPORTUNIDAD DE ENTRADA'
                                ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : analysis.signal === 'OPORTUNIDAD DE SALIDA'
                                ? isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-800 border border-rose-300'
                                : isDark ? 'bg-slate-700/40 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>{analysis.signal}</span>
                          </span>
                          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {analysis.trendLabel}
                          </p>
                        </div>
                      </td>

                      {/* 3. Precio & Variación */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(asset.price)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                        </div>
                      </td>

                      {/* 4. Setup Sugerido (Entrada / TP / SL) Symmetrical Alignment */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 text-[11px] font-mono min-w-[200px]">
                          {/* Entrada */}
                          <div className="flex items-center justify-between">
                            <span className="text-blue-500 font-bold font-sans flex items-center gap-1.5 text-[10px] uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              Entrada:
                            </span>
                            <div className="flex items-center gap-1 text-right">
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {formatCurrency(order.suggestedEntryPrice)}
                              </span>
                              {order.distanceToEntryPct !== 0 && (
                                <span className={`text-[10px] font-semibold ${
                                  Math.abs(order.distanceToEntryPct) <= 1.0
                                    ? 'text-emerald-400 font-bold bg-emerald-500/15 px-1 rounded border border-emerald-500/30'
                                    : 'text-amber-400'
                                }`}>
                                  ({order.distanceToEntryPct > 0 ? '+' : ''}{order.distanceToEntryPct}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Take Profit */}
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-500 font-bold font-sans flex items-center gap-1.5 text-[10px] uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Take Profit:
                            </span>
                            <div className="flex items-center gap-1 text-right">
                              <span className="font-bold text-emerald-400">
                                {formatCurrency(order.suggestedTakeProfit)}
                              </span>
                              <span className="text-[10px] text-emerald-500 font-semibold">
                                (+{order.suggestedTakeProfitPct}%)
                              </span>
                            </div>
                          </div>

                          {/* Stop Loss */}
                          <div className="flex items-center justify-between">
                            <span className="text-rose-500 font-bold font-sans flex items-center gap-1.5 text-[10px] uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Stop Loss:
                            </span>
                            <div className="flex items-center gap-1 text-right">
                              <span className="font-bold text-rose-400">
                                {formatCurrency(order.suggestedStopLoss)}
                              </span>
                              <span className="text-[10px] text-rose-500 font-semibold">
                                (-{order.suggestedStopLossPct}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 5. Horizonte Temporal Sugerido */}
                      <td className="py-3.5 px-3 text-center">
                        {order.horizonSuggestion ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[11px] font-bold ${
                                order.horizonSuggestion.horizon === 'CORTO_PLAZO'
                                  ? isDark
                                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                                    : 'bg-cyan-50 border-cyan-300 text-cyan-800'
                                  : order.horizonSuggestion.horizon === 'MEDIANO_PLAZO'
                                  ? isDark
                                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                    : 'bg-blue-50 border-blue-300 text-blue-800'
                                  : isDark
                                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                                  : 'bg-purple-50 border-purple-300 text-purple-800'
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{order.horizonSuggestion.horizonLabel}</span>
                            </span>
                            <div className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              ~{order.horizonSuggestion.durationLabel}
                            </div>
                            <div className="text-[9px] text-emerald-500 font-semibold">
                              para +{order.suggestedTakeProfitPct}% profit
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 6. Veredicto de Confianza Unificado Dinámico */}
                      <td className="py-3.5 px-3 text-center">
                        <ConfidenceBadge
                          opportunityScore={analysis.opportunityScore}
                          reliabilityScore={asset.backtestReliabilityScore}
                          lowSampleWarning={asset.backtestLowSampleWarning}
                          isSimulated={asset.isSimulated}
                          isDark={isDark}
                          size="sm"
                        />
                      </td>

                      {/* 7. Score Técnico (Al lado derecho de Confianza) */}
                      <td className="py-3.5 px-3 text-center font-mono" onClick={(e) => e.stopPropagation()}>
                        <ScoreBreakdownTooltip
                          score={analysis.opportunityScore}
                          breakdown={analysis.scoreBreakdown}
                          align="center"
                        >
                          <span
                            className={`inline-block rounded-xl border px-2.5 py-1 text-xs font-black transition-transform hover:scale-110 cursor-help ${
                              analysis.opportunityScore >= 95
                                ? isDark
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-xs ring-1 ring-emerald-500/40'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-500/40'
                                : analysis.opportunityScore >= 80
                                ? isDark
                                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                  : 'bg-blue-50 border-blue-300 text-blue-800'
                                : analysis.opportunityScore >= 50
                                ? isDark
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                  : 'bg-amber-50 border-amber-300 text-amber-800'
                                : isDark
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                : 'bg-rose-50 border-rose-300 text-rose-800'
                            }`}
                          >
                            {analysis.opportunityScore}
                          </span>
                        </ScoreBreakdownTooltip>
                      </td>

                      {/* 8. Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Price Alert Bell */}
                          <button
                            type="button"
                            onClick={() => openAlertsModal(asset)}
                            title={activeAlertsCount > 0 ? `${activeAlertsCount} alerta(s) de precio activa(s)` : "Crear alerta de precio"}
                            className={`relative rounded-xl p-1.5 transition-all ${
                              activeAlertsCount > 0
                                ? isDark
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs ring-1 ring-blue-500/30"
                                  : "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs ring-1 ring-blue-500/30"
                                : isDark
                                ? "text-slate-400 hover:bg-[#2c2c2e] hover:text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <Bell className="h-4 w-4 text-blue-500" />
                            {activeAlertsCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                                {activeAlertsCount}
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectAsset(asset.id);
                              onOpenChart(asset.id);
                            }}
                            className={`rounded-xl p-1.5 transition-colors ${
                              isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title="Ver Gráfico"
                          >
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectAsset(asset.id);
                              onOpenBacktest(asset.id);
                            }}
                            className={`rounded-xl p-1.5 transition-colors ${
                              isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title="Simular Backtest"
                          >
                            <BarChart2 className="h-4 w-4 text-blue-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: CUADRÍCULA / TARJETAS DE OPORTUNIDADES UNIFICADAS */}
      {viewMode === 'grid' && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <AssetOpportunityCard
              key={asset.id}
              asset={asset}
              isSelected={false}
              onSelect={() => onSelectAsset(asset.id)}
              onOpenChart={() => onOpenChart(asset.id)}
              onOpenBacktest={() => onOpenBacktest(asset.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
