'use client';

import React, { useMemo } from 'react';
import { Asset, BacktestConfig, BacktestResult } from '@/lib/types/market';
import { runBacktest } from '@/lib/quant/backtest-engine';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle, getAssetTypeLabel } from '@/lib/ui/badge-styles';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

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
      className={`rounded-3xl border p-3.5 sm:p-5 shadow-xs transition-colors space-y-3 sm:space-y-4 ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
      }`}
    >
      {/* 1. Main Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h4 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Rendimiento Simulado por Activo
              </h4>
              <span className={`rounded-full px-1.5 sm:px-2 py-0.2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${accent.tintBgClass} ${accent.textClass}`}>
                {simulationResults.length} Activos
              </span>
            </div>
            <p className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Desempeño acumulado con el perfil de estrategia seleccionado
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
          Selección Cuantitativa
        </span>
      </div>

      {/* 2. FILA 1: Top 3 Mayor Rendimiento (Mayores Ganancias) */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
            <TrendingUp className="h-3 w-3" />
          </div>
          <span className={`text-[11px] sm:text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Top 3 Mayor Rendimiento
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            (Mayor ganancia acumulada)
          </span>
        </div>

        <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-3 overflow-x-auto custom-horizontal-scrollbar p-0.5 pb-1 sm:pb-0">
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
                className={`min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border-2 p-2.5 sm:p-3 transition-all ${rankStyle} ${
                  onSelectAsset ? 'cursor-pointer hover:scale-[1.01]' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-xs'
                }`}
                title="Haz clic para inspeccionar este activo en detalle"
              >
                {/* Row 1: Header */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
                        {item.asset.symbol}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                          item.asset.type,
                          isDark
                        )}`}
                      >
                        {getAssetTypeLabel(item.asset.type)}
                      </span>
                    </div>
                    <p className="truncate text-[10px] opacity-75 mt-0.5">
                      {item.asset.name}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl px-1.5 py-0.2 text-[10px] sm:text-xs font-black font-mono">
                    {rankBadge}
                  </span>
                </div>

                {/* Row 2: Performance + Blueprint Metrics */}
                <div className="mt-2 pt-1.5 border-t border-current/15 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-mono text-xs sm:text-sm font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] opacity-60 hidden md:inline">
                      ({formatCurrency(res.totalNetProfit)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] opacity-80">
                    <span>Ac: {res.winRate.toFixed(0)}%</span>
                    <span>PF: {res.profitFactor.toFixed(1)}</span>
                    <span className="text-rose-400">DD: -{res.maxDrawdown.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FILA 2: Top 3 Menor Rendimiento (Menor Ganancia o Pérdida) */}
      <div className="space-y-1.5 sm:space-y-2 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-rose-500/15 text-rose-400">
            <TrendingDown className="h-3 w-3" />
          </div>
          <span className={`text-[11px] sm:text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Top 3 Menor Rendimiento
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            (Menor ganancia o mayor pérdida)
          </span>
        </div>

        <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-3 overflow-x-auto custom-horizontal-scrollbar p-0.5 pb-1 sm:pb-0">
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

            const rankBadge = idx === 0 ? '🔻 #1' : idx === 1 ? '🔻 #2' : '🔻 #3';

            return (
              <div
                key={item.asset.id}
                onClick={() => onSelectAsset?.(item.asset.id)}
                className={`min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border-2 p-2.5 sm:p-3 transition-all ${rankStyle} ${
                  onSelectAsset ? 'cursor-pointer hover:scale-[1.01]' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-xs'
                }`}
                title="Haz clic para inspeccionar este activo en detalle"
              >
                {/* Row 1: Header */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
                        {item.asset.symbol}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                          item.asset.type,
                          isDark
                        )}`}
                      >
                        {getAssetTypeLabel(item.asset.type)}
                      </span>
                    </div>
                    <p className="truncate text-[10px] opacity-75 mt-0.5">
                      {item.asset.name}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl px-1.5 py-0.2 text-[10px] sm:text-xs font-black font-mono">
                    {rankBadge}
                  </span>
                </div>

                {/* Row 2: Performance + Blueprint Metrics */}
                <div className="mt-2 pt-1.5 border-t border-current/15 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-mono text-xs sm:text-sm font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] opacity-60 hidden md:inline">
                      ({formatCurrency(res.totalNetProfit)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] opacity-80">
                    <span>Ac: {res.winRate.toFixed(0)}%</span>
                    <span>PF: {res.profitFactor.toFixed(1)}</span>
                    <span className="text-rose-400">DD: -{res.maxDrawdown.toFixed(0)}%</span>
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
