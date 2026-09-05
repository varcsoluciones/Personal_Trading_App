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
      className={`rounded-3xl border p-4 sm:p-5 shadow-xs transition-colors space-y-4 ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
      }`}
    >
      {/* Main Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rendimiento Simulado por Activo
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Desempeño acumulado en la lista de seguimiento con los parámetros actuales
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
          Simulación Cuantitativa
        </span>
      </div>

      {/* 1. FILA: Top 3 Mayor Rendimiento */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Top 3 Mayor Rendimiento
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            (Mayor ganancia porcentual acumulada)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3Best.map((item, idx) => {
            const res = item.result;
            const isProfit = res.totalNetProfitPct >= 0;

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
                key={item.asset.id}
                onClick={() => onSelectAsset?.(item.asset.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all cursor-pointer hover:scale-[1.01] ${rankColor} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-sm'
                }`}
              >
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

                <div className="mt-3 pt-2 border-t border-current/15 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] opacity-70">
                      ({formatCurrency(res.totalNetProfit)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="opacity-75">Acierto: <strong>{res.winRate.toFixed(0)}%</strong></span>
                    <span className="opacity-75">PF: <strong>{res.profitFactor.toFixed(1)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FILA: Top 3 Menor Rendimiento */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Top 3 Menor Rendimiento
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            (Menor ganancia o mayor pérdida)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3Worst.map((item, idx) => {
            const res = item.result;
            const isProfit = res.totalNetProfitPct >= 0;

            const rankColor =
              idx === 0
                ? isDark
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30'
                  : 'border-rose-300 bg-rose-50/80 text-rose-950 ring-1 ring-rose-400/30'
                : idx === 1
                ? isDark
                  ? 'border-slate-600/60 bg-slate-500/10 text-slate-200'
                  : 'border-slate-300 bg-slate-100 text-slate-800'
                : isDark
                ? 'border-slate-700/60 bg-slate-800/40 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-700';

            const rankBadge = idx === 0 ? '🔻 #1' : idx === 1 ? '🔻 #2' : '🔻 #3';

            return (
              <div
                key={item.asset.id}
                onClick={() => onSelectAsset?.(item.asset.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all cursor-pointer hover:scale-[1.01] ${rankColor} ${
                  isDark ? 'hover:bg-[#2c2c2e]' : 'hover:bg-white hover:shadow-sm'
                }`}
              >
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

                <div className="mt-3 pt-2 border-t border-current/15 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{res.totalNetProfitPct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] opacity-70">
                      ({formatCurrency(res.totalNetProfit)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="opacity-75">Acierto: <strong>{res.winRate.toFixed(0)}%</strong></span>
                    <span className="opacity-75">PF: <strong>{res.profitFactor.toFixed(1)}</strong></span>
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
