'use client';

import React, { useMemo } from 'react';
import { Asset, BacktestConfig, BacktestResult } from '@/lib/types/market';
import { runBacktest } from '@/lib/quant/backtest-engine';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle, getAssetTypeLabel } from '@/lib/ui/badge-styles';
import { Trophy, TrendingUp, TrendingDown, Sparkles, BarChart2 } from 'lucide-react';

interface BacktestPodiumProps {
  assets: Asset[];
  config: Partial<BacktestConfig>;
  selectedAssetId?: string;
  onSelectAsset?: (id: string) => void;
}

interface SimulatedAssetItem {
  asset: Asset;
  result: BacktestResult;
}

export function BacktestPodium({
  assets,
  config,
  selectedAssetId,
  onSelectAsset,
}: BacktestPodiumProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  // Run simulation for all assets with candles using the active strategy configuration
  const simulationResults: SimulatedAssetItem[] = useMemo(() => {
    return assets
      .filter((a) => a.candles && a.candles.length >= 30)
      .map((asset) => {
        const result = runBacktest(asset.candles!, config);
        return { asset, result };
      });
  }, [assets, config]);

  // Top 3 Best Simulated Performance (Highest total return)
  const top3Best = useMemo(() => {
    return [...simulationResults]
      .sort((a, b) => b.result.totalNetProfitPct - a.result.totalNetProfitPct)
      .slice(0, 3);
  }, [simulationResults]);

  // Top 3 Lowest Simulated Performance (Lowest profit or largest loss)
  const top3Worst = useMemo(() => {
    return [...simulationResults]
      .sort((a, b) => a.result.totalNetProfitPct - b.result.totalNetProfitPct)
      .slice(0, 3);
  }, [simulationResults]);

  if (simulationResults.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border p-3.5 sm:p-5 shadow-xs transition-colors space-y-5 ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
      }`}
    >
      {/* 1. Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ranking de Rendimiento en Simulación
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${accent.tintBgClass} ${accent.textClass}`}>
                {simulationResults.length} Activos
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs mt-0.5 truncate sm:whitespace-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Desempeño acumulado de toda la lista de seguimiento con los parámetros de la estrategia actual
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
          Resultados Históricos Fuera de Muestra
        </span>
      </div>

      {/* 2. FILA 1: Top 3 Mejor Rendimiento (Mayores Ganancias) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <h4 className={`text-xs sm:text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Top 3 Mayor Rendimiento
          </h4>
          <span className="text-[10px] text-slate-500 font-medium">
            (Mayor ganancia porcentual acumulada)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3Best.map((item, idx) => {
            const isSelected = selectedAssetId === item.asset.id;
            const res = item.result;
            const isProfit = res.totalNetProfitPct >= 0;

            const rankStyle =
              idx === 0
                ? isDark
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-amber-300 bg-amber-50/80 text-amber-900'
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
                key={item.asset.id}
                onClick={() => onSelectAsset?.(item.asset.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${rankStyle} ${
                  onSelectAsset ? 'cursor-pointer hover:scale-[1.01]' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-xs'
                }`}
                title="Haz clic para inspeccionar este activo en detalle"
              >
                {/* Asset Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-black tracking-tight">
                          {item.asset.symbol}
                        </span>
                        <span
                          className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                            item.asset.type,
                            isDark
                          )}`}
                        >
                          {getAssetTypeLabel(item.asset.type)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] opacity-75 mt-0.5">
                        {item.asset.name}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-xl px-2 py-0.5 text-xs font-black font-mono">
                      {rankBadge}
                    </span>
                  </div>

                  {/* Main Metric Pill: Return & Reliability */}
                  <div className="mt-2.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-mono text-lg sm:text-xl font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">
                        ({formatCurrency(res.totalNetProfit)})
                      </span>
                    </div>

                    <span
                      className={`rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        res.reliabilityScore >= 70
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : res.reliabilityScore >= 40
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {res.reliabilityLabel} ({res.reliabilityScore})
                    </span>
                  </div>
                </div>

                {/* Footer KPIs */}
                <div className="mt-3 pt-2 border-t border-current/15 grid grid-cols-3 gap-1 text-[10px] font-mono text-center opacity-85">
                  <div className="text-left">
                    <span className="block opacity-60 text-[9px]">Acierto</span>
                    <span className="font-bold">{res.winRate.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="block opacity-60 text-[9px]">P. Factor</span>
                    <span className="font-bold">{res.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block opacity-60 text-[9px]">Caída Máx</span>
                    <span className="font-bold text-rose-400">-{res.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FILA 2: Top 3 Menor Rendimiento (Menor Ganancia o Pérdida) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
          <h4 className={`text-xs sm:text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Top 3 Menor Rendimiento
          </h4>
          <span className="text-[10px] text-slate-500 font-medium">
            (Menor ganancia o mayor pérdida en la simulación)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3Worst.map((item, idx) => {
            const isSelected = selectedAssetId === item.asset.id;
            const res = item.result;
            const isProfit = res.totalNetProfitPct >= 0;

            const rankStyle =
              idx === 0
                ? isDark
                  ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                  : 'border-rose-300 bg-rose-50/80 text-rose-950'
                : isDark
                ? 'border-slate-700/60 bg-slate-800/40 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-700';

            const rankBadge = idx === 0 ? '🔻 #1 Menor' : idx === 1 ? '🔻 #2 Menor' : '🔻 #3 Menor';

            return (
              <div
                key={item.asset.id}
                onClick={() => onSelectAsset?.(item.asset.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${rankStyle} ${
                  onSelectAsset ? 'cursor-pointer hover:scale-[1.01]' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-xs'
                }`}
                title="Haz clic para inspeccionar este activo en detalle"
              >
                {/* Asset Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-black tracking-tight">
                          {item.asset.symbol}
                        </span>
                        <span
                          className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                            item.asset.type,
                            isDark
                          )}`}
                        >
                          {getAssetTypeLabel(item.asset.type)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] opacity-75 mt-0.5">
                        {item.asset.name}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-xl px-2 py-0.5 text-[10px] font-bold font-mono">
                      {rankBadge}
                    </span>
                  </div>

                  {/* Main Metric Pill: Return & Reliability */}
                  <div className="mt-2.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-mono text-lg sm:text-xl font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">
                        ({formatCurrency(res.totalNetProfit)})
                      </span>
                    </div>

                    <span
                      className={`rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        res.reliabilityScore >= 70
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : res.reliabilityScore >= 40
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {res.reliabilityLabel} ({res.reliabilityScore})
                    </span>
                  </div>
                </div>

                {/* Footer KPIs */}
                <div className="mt-3 pt-2 border-t border-current/15 grid grid-cols-3 gap-1 text-[10px] font-mono text-center opacity-85">
                  <div className="text-left">
                    <span className="block opacity-60 text-[9px]">Acierto</span>
                    <span className="font-bold">{res.winRate.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="block opacity-60 text-[9px]">P. Factor</span>
                    <span className="font-bold">{res.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block opacity-60 text-[9px]">Caída Máx</span>
                    <span className="font-bold text-rose-400">-{res.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
