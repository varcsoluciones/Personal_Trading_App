'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Flame,
  Zap,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Filter,
  Target,
  Shield,
  ArrowRight,
  TrendingDown,
  Compass,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Asset, AssetCategory } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface OpportunityScreenerProps {
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
}

export function OpportunityScreener({
  assets,
  onSelectAsset,
  onOpenChart,
  onOpenBacktest,
}: OpportunityScreenerProps) {
  const { settings, accent, formatCurrency, updateSettings } = useSettings();
  const isDark = settings.theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [minScore, setMinScore] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sync and persist viewMode with user settings
  useEffect(() => {
    if (settings.screenerViewMode) {
      setViewMode(settings.screenerViewMode);
    }
  }, [settings.screenerViewMode]);

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    updateSettings({ screenerViewMode: mode });
  };

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

  // Filter and Sort Assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (!asset.analysis) return false;
        if (selectedCategory !== 'all' && asset.analysis.opportunityCategory !== selectedCategory) {
          return false;
        }
        if (asset.analysis.opportunityScore < minScore) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.analysis?.opportunityScore || 0) - (a.analysis?.opportunityScore || 0));
  }, [assets, selectedCategory, minScore]);

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
                Radar Cuantitativo de Oportunidades
              </h3>
              <InfoTooltip
                text="Clasifica los activos según su estructura técnica, fuerza de impulso (ADX), riesgo de reversión y zonas proyectadas de entrada para maximizar el ratio riesgo/beneficio."
                title="Filtro de Oportunidades"
              />
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecciona una estrategia según tu perfil de riesgo y estilo de trading
            </p>
          </div>

          {/* View Mode Switcher (Grid vs List) */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 rounded-2xl border p-1 ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200 bg-slate-100'
              }`}
            >
              <button
                onClick={() => handleToggleViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Cuadrícula"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                onClick={() => handleToggleViewMode('table')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? isDark
                      ? 'bg-[#1c1c1e] text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Lista"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Score Slider Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Score mín:
              </span>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-blue-500 cursor-pointer"
              />
              <span className={`font-mono text-xs font-bold ${accent.textClass}`}>
                {minScore}+
              </span>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800/40">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? `${accent.bgClass} text-white border-transparent shadow-xs scale-[1.02]`
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-300 hover:bg-[#2c2c2e]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
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
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div
          className={`flex flex-col items-center justify-center rounded-3xl border p-12 text-center ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="rounded-full bg-blue-500/10 p-4 text-blue-500 mb-3">
            <Filter className="h-8 w-8" />
          </div>
          <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No hay activos con los filtros seleccionados
          </h4>
          <p className={`text-xs max-w-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Prueba reduciendo el Score mínimo requerido ({minScore}) o seleccionando otra categoría.
          </p>
          <button
            onClick={() => {
              setMinScore(50);
              setSelectedCategory('all');
            }}
            className={`mt-4 rounded-2xl px-4 py-2 text-xs font-bold text-white ${accent.bgClass}`}
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* VISTA 1: LISTA / TABLA DE OPORTUNIDADES */}
      {/* ========================================================== */}
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
                  <th className="py-3.5 px-4">Activo / Score</th>
                  <th className="py-3.5 px-3 text-right">Precio Mercado</th>
                  <th className="py-3.5 px-3 text-right">🎯 Entrada Proyectada</th>
                  <th className="py-3.5 px-3 text-right">🎯 Take Profit</th>
                  <th className="py-3.5 px-3 text-right">🛑 Stop Loss</th>
                  <th className="py-3.5 px-3 text-center">R:B & Beneficio</th>
                  <th className="py-3.5 px-3 text-center">Estado / Señal</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredAssets.map((asset) => {
                  const analysis = asset.analysis!;
                  const order = analysis.orderSetup;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset.id)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-[#2c2c2e]/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Activo & Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-2xl font-mono text-xs font-black shrink-0 ${accent.tintBgClass} ${accent.textClass} border ${accent.borderClass}`}
                          >
                            {analysis.opportunityScore}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {asset.symbol}
                              </span>
                              <span className={`text-[10px] uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                ({asset.type})
                              </span>
                            </div>
                            <span className={`text-[11px] block truncate max-w-[130px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {asset.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Precio Mercado */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(asset.price)}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            asset.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {asset.change24hPct >= 0 ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                        </div>
                      </td>

                      {/* 3. Entrada Proyectada */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-blue-500">
                          {formatCurrency(order.suggestedEntryPrice)}
                        </div>
                        <div className="text-[10px] flex items-center justify-end gap-1 font-semibold">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                            {order.entryType === 'INMEDIATA' ? 'Comprar ahora' : order.entryLabel}
                          </span>
                          {order.distanceToEntryPct !== 0 && (
                            <span className="font-mono text-amber-500 font-bold">
                              ({order.distanceToEntryPct > 0 ? '+' : ''}{order.distanceToEntryPct}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Take Profit */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-emerald-500">
                          {formatCurrency(order.suggestedTakeProfit)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          +{order.suggestedTakeProfitPct}%
                        </div>
                      </td>

                      {/* 5. Stop Loss */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-rose-500">
                          {formatCurrency(order.suggestedStopLoss)}
                        </div>
                        <div className="text-[10px] text-rose-500 font-bold">
                          -{order.suggestedStopLossPct}%
                        </div>
                      </td>

                      {/* 6. Ratio R:B & Beneficio */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div className="inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-500">
                          1:{order.riskRewardRatio}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-bold mt-0.5">
                          +{formatCurrency(order.potentialRewardUSD)}
                        </div>
                      </td>

                      {/* 7. Estado / Señal */}
                      <td className="py-3.5 px-3 text-center">
                        {analysis.signal === 'OPORTUNIDAD DE ENTRADA' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Comprar
                          </span>
                        ) : analysis.trend === 'BULLISH' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Mantener
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Esperar
                          </span>
                        )}
                      </td>

                      {/* 8. Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              onSelectAsset(asset.id);
                              onOpenChart(asset.id);
                            }}
                            className={`rounded-xl p-1.5 text-xs font-semibold transition-all ${
                              isDark ? 'bg-[#2c2c2e] text-slate-200 hover:bg-[#3a3a3c]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Ver Gráfico"
                          >
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectAsset(asset.id);
                              onOpenBacktest(asset.id);
                            }}
                            className={`rounded-xl p-1.5 text-xs font-semibold transition-all ${accent.tintBgClass} ${accent.textClass} hover:opacity-90`}
                            title="Simular Backtest"
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
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

      {/* ========================================================== */}
      {/* VISTA 2: CUADRÍCULA / TARJETAS DE OPORTUNIDADES */}
      {/* ========================================================== */}
      {viewMode === 'grid' && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => {
            const analysis = asset.analysis!;
            const order = analysis.orderSetup;

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className={`relative flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md ${
                  isDark
                    ? 'border-slate-800/80 bg-[#1c1c1e] hover:border-slate-700'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Category Pill & Score */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isDark ? 'border-slate-700 bg-[#2c2c2e]/60 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {analysis.categoryLabel}
                    </span>

                    {/* Opportunity Score Pill */}
                    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`}>
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>Score: {analysis.opportunityScore}/100</span>
                    </div>
                  </div>

                  {/* Symbol & Price */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</h4>
                        <span className={`text-xs uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({asset.type})</span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(asset.price)}
                      </div>
                      <div
                        className={`font-mono text-xs font-semibold ${
                          asset.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {asset.change24hPct >= 0 ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className={`my-3 h-[1px] ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`} />

                  {/* ========================================================== */}
                  {/* VALORES EXACTOS DE LA OPORTUNIDAD DETECTADA POR LA APP */}
                  {/* ========================================================== */}
                  <div
                    className={`rounded-2xl border p-3.5 space-y-2.5 mb-3 transition-colors ${
                      isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-blue-500" />
                        <span>Plan de Compra & Objetivos</span>
                      </span>
                      <span className="text-blue-500 font-mono font-bold">R:B 1:{order.riskRewardRatio}</span>
                    </div>

                    {/* 1. Compra Sugerida / Precio Esperado */}
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-500">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>{order.entryType === 'INMEDIATA' ? 'Precio de Compra (Ahora):' : 'Precio Esperado de Compra:'}</span>
                        </div>
                        <span className={`font-mono font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(order.suggestedEntryPrice)}
                        </span>
                      </div>

                      {/* Distance / Strategy Note */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                          {order.entryLabel}
                        </span>
                        {order.distanceToEntryPct !== 0 && (
                          <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {order.distanceToEntryPct > 0 ? '+' : ''}{order.distanceToEntryPct}% vs mercado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. Take Profit (Venta para Salir) */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                        <Target className="h-3.5 w-3.5" />
                        <span>Take Profit (Objetivo):</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-500 text-xs">
                          {formatCurrency(order.suggestedTakeProfit)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold ml-1">
                          (+{order.suggestedTakeProfitPct}%)
                        </span>
                      </div>
                    </div>

                    {/* 3. Stop Loss Configurable */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Stop Loss Sugerido:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-500 text-xs">
                          {formatCurrency(order.suggestedStopLoss)}
                        </span>
                        <span className="text-[10px] text-rose-500 font-bold ml-1">
                          (-{order.suggestedStopLossPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Risk / Reward USD Breakdown */}
                    <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <span>Ganancia proyectada: <strong className="text-emerald-500 font-mono">+{formatCurrency(order.potentialRewardUSD)}</strong></span>
                      <span>Riesgo máx: <strong className="text-rose-500 font-mono">-{formatCurrency(order.potentialRiskUSD)}</strong></span>
                    </div>
                  </div>

                  {/* Score Reason Banner */}
                  <div
                    className={`rounded-2xl border p-2.5 text-[11px] ${
                      isDark ? 'bg-[#2c2c2e]/20 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{analysis.signalReason}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`mt-4 pt-3 border-t flex items-center gap-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(asset.id);
                      onOpenChart(asset.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
                      isDark
                        ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-white hover:bg-[#3a3a3c]'
                        : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                    <span>Ver Gráfico</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(asset.id);
                      onOpenBacktest(asset.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
                      isDark
                        ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} hover:opacity-90`
                        : `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} hover:opacity-90`
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>Simular Backtest</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
