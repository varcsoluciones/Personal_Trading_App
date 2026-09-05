'use client';

import React, { useState, useMemo } from 'react';
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
  const [mode, setMode] = useState<'best' | 'worst'>('best');

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

  const displayedList = mode === 'best' ? top3Best : top3Worst;

  if (simulationResults.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 shadow-xs transition-colors space-y-3.5 ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
      }`}
    >
      {/* Header Bar with Integrated Mode Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Top 3 Rendimiento en Simulación
            </h4>
            <p className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {mode === 'best'
                ? 'Activos con mayor rendimiento acumulado en la simulación'
                : 'Activos con menor rendimiento o mayor pérdida en la simulación'}
            </p>
          </div>
        </div>

        {/* Dropdown Selector: Mejor Rendimiento vs Menor Rendimiento */}
        <div
          className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 transition-colors ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/70' : 'border-slate-200 bg-slate-100'
          }`}
        >
          {mode === 'best' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          )}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'best' | 'worst')}
            className={`bg-transparent text-xs font-bold font-sans focus:outline-none cursor-pointer pr-1 ${
              isDark
                ? 'text-white [&>option]:bg-[#1c1c1e] [&>option]:text-white'
                : 'text-slate-800 [&>option]:bg-white [&>option]:text-slate-900'
            }`}
            title="Seleccionar criterio de rendimiento"
          >
            <option value="best">Mejor Rendimiento ({top3Best.length})</option>
            <option value="worst">Menor Rendimiento ({top3Worst.length})</option>
          </select>
        </div>
      </div>

      {/* Grid of 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayedList.map((item, idx) => {
          const res = item.result;
          const isProfit = res.totalNetProfitPct >= 0;

          const rankColor =
            mode === 'best'
              ? idx === 0
                ? isDark
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                  : 'border-amber-300 bg-amber-50/80 text-amber-900 ring-1 ring-amber-400/30'
                : idx === 1
                ? isDark
                  ? 'border-slate-600/60 bg-slate-500/10 text-slate-200'
                  : 'border-slate-300 bg-slate-100 text-slate-800'
                : isDark
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                : 'border-orange-200 bg-orange-50/70 text-orange-900'
              : isDark
              ? 'border-slate-700/60 bg-[#242426]/60 text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-700';

          const rankBadge =
            mode === 'best'
              ? idx === 0
                ? '🥇 #1'
                : idx === 1
                ? '🥈 #2'
                : '🥉 #3'
              : idx === 0
              ? '🔻 #1'
              : idx === 1
              ? '🔻 #2'
              : '🔻 #3';

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
  );
}
