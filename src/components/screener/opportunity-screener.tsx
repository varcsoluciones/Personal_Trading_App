'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Flame,
  Sparkles,
  BarChart2,
  Target,
  Shield,
  LayoutGrid,
  Table as TableIcon,
  Award,
  Clock,
} from 'lucide-react';
import { Asset, AssetCategory } from '@/lib/types/market';
import { AssetOpportunityCard } from '@/components/shared/asset-opportunity-card';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';

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

  // Sync and persist all screener filters with user settings across navigation & refreshes
  useEffect(() => {
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
    settings.screenerViewMode,
    settings.screenerRankingMode,
    settings.screenerCategory,
    settings.screenerMinScore,
  ]);

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

  // Fetch cached walk-forward historical rankings on mount
  useEffect(() => {
    setIsLoadingRankings(true);
    fetch('/api/screener-rankings')
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
  }, []);

  // Categories Definition
  const categories: { id: AssetCategory | 'all'; label: string; icon: any; count: number }[] = [
    {
      id: 'all',
      label: 'Todas las Oportunidades',
      icon: Sparkles,
      count: assets.length,
    },
    {
      id: 'trend',
      label: 'Tendencia Fuerte',
      icon: TrendingUp,
      count: assets.filter((a) => a.analysis?.opportunityCategory === 'trend').length,
    },
    {
      id: 'volatile',
      label: 'Alta Volatilidad / Oportunidades',
      icon: Flame,
      count: assets.filter((a) => a.analysis?.opportunityCategory === 'volatile').length,
    },
    {
      id: 'range',
      label: 'Operaciones en Rango',
      icon: Activity,
      count: assets.filter((a) => a.analysis?.opportunityCategory === 'range').length,
    },
    {
      id: 'stable',
      label: 'Más Estable / Conservador',
      icon: ShieldCheck,
      count: assets.filter((a) => a.analysis?.opportunityCategory === 'stable').length,
    },
  ];

  // Filter and Sort Assets based on rankingMode
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (!asset.analysis) return false;

        // Category filter
        if (selectedCategory !== 'all' && asset.analysis.opportunityCategory !== selectedCategory) {
          return false;
        }

        // Min score filter
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
  }, [assets, selectedCategory, minScore, rankingMode, historicalRankings]);

  return (
    <div className="space-y-6">
      {/* Category Pills & Controls Header */}
      <div
        className={`rounded-3xl border p-5 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
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
                : 'Selecciona una estrategia según tu perfil de riesgo y estilo de trading'}
            </p>
          </div>

          {/* Ranking Mode & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Ranking Mode Switcher */}
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
          </div>
        </div>

        {/* Historical Consistency Notice Banner */}
        {rankingMode === 'historical' && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-medium ${
              isDark
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <strong>Filtro de Consistencia Activo:</strong> Se filtraron activos con baja consistencia (BAJA) para mostrar solo los de persistencia Media o Alta en prueba ciega fuera de muestra.
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
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

        {/* Score Threshold Filter */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/40 text-xs">
          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Filtro de Score Mínimo:
          </span>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div
          className={`rounded-3xl border p-12 text-center transition-colors ${
            isDark ? 'border-slate-800 bg-[#1c1c1e] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-slate-500" />
          <h4 className="font-bold text-sm mb-1">No se encontraron activos con estos filtros</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba reduciendo el umbral de score mínimo a ≥ 50 o cambiando a la categoría &quot;Todas las Oportunidades&quot;.
          </p>
        </div>
      )}

      {/* VISTA 1: TABLA / LISTA COMPACTA */}
      {viewMode === 'table' && filteredAssets.length > 0 && (
        <div
          className={`overflow-hidden rounded-3xl border shadow-xs transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <th className="py-3.5 px-4">Activo</th>
                  <th className="py-3.5 px-3 text-right">Precio / 24h</th>
                  <th className="py-3.5 px-3 text-right">🎯 Entrada Sugerida</th>
                  <th className="py-3.5 px-3 text-right">🎯 Take Profit / Stop</th>
                  <th className="py-3.5 px-3 text-center">⏱️ Sugerencia & Plazo</th>
                  <th className="py-3.5 px-3 text-center">Veredicto de Confianza</th>
                  <th className="py-3.5 px-3 text-center">Score Técnico</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredAssets.map((asset) => {
                  const analysis = asset.analysis!;
                  const order = analysis.orderSetup;
                  const isPositive = asset.change24hPct >= 0;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset.id)}
                      className={`transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-[#2c2c2e]/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Activo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {asset.symbol}
                          </span>
                          <span
                            className={`rounded-lg border px-1.5 py-0.2 text-[9px] uppercase font-bold ${getAssetTypeBadgeStyle(
                              asset.type,
                              isDark
                            )}`}
                          >
                            {asset.type}
                          </span>
                        </div>
                        <div className={`text-[11px] truncate max-w-[150px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {asset.name}
                        </div>
                      </td>

                      {/* 2. Precio Mercado */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(asset.price)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                        </div>
                      </td>

                      {/* 3. Entrada Proyectada */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-blue-500">
                          {formatCurrency(order.suggestedEntryPrice)}
                        </div>
                        <div className="text-[10px] flex items-center justify-end gap-1 font-semibold">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                            {order.entryLabel}
                          </span>
                          {order.distanceToEntryPct !== 0 && (
                            <span className="font-mono text-amber-500 font-bold">
                              ({order.distanceToEntryPct > 0 ? '+' : ''}{order.distanceToEntryPct}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. TP & SL */}
                      <td className="py-3.5 px-3 text-right font-mono text-[11px]">
                        <div className="text-emerald-500 font-bold flex items-center justify-end gap-1">
                          <Target className="h-3 w-3" />
                          <span>{formatCurrency(order.suggestedTakeProfit)} (+{order.suggestedTakeProfitPct}%)</span>
                        </div>
                        <div className="text-rose-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <Shield className="h-3 w-3" />
                          <span>{formatCurrency(order.suggestedStopLoss)} (-{order.suggestedStopLossPct}%)</span>
                        </div>
                      </td>

                      {/* 5. Sugerencia de Horizonte & Duración Estimada */}
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

                      {/* 6. Veredicto de Confianza Unificado */}
                      <td className="py-3.5 px-3 text-center">
                        <ConfidenceBadge
                          opportunityScore={analysis.opportunityScore}
                          isSimulated={asset.isSimulated}
                          isDark={isDark}
                          size="sm"
                        />
                      </td>

                      {/* 6. Score Técnico (Al lado derecho de Confianza) */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span
                          className={`inline-block rounded-xl border px-2.5 py-1 text-xs font-black ${
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
                      </td>

                      {/* 7. Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
