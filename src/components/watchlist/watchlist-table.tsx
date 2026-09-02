'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  BarChart2,
  Trash2,
  Clock,
} from 'lucide-react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';

interface WatchlistTableProps {
  assets: Asset[];
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
  onRemoveAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
}

type SortField = 'symbol' | 'price' | 'change' | 'days' | 'risk' | 'adx' | 'score';

export function WatchlistTable({
  assets,
  selectedAssetId,
  onSelectAsset,
  onRemoveAsset,
  onOpenChart,
  onOpenBacktest,
}: WatchlistTableProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (sortField) {
      case 'symbol':
        return sortAsc
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      case 'price':
        valA = a.price;
        valB = b.price;
        break;
      case 'change':
        valA = a.change24hPct;
        valB = b.change24hPct;
        break;
      case 'days':
        valA = a.analysis?.daysInTrend || 0;
        valB = b.analysis?.daysInTrend || 0;
        break;
      case 'risk':
        valA = a.analysis?.reversalRisk.percentage || 0;
        valB = b.analysis?.reversalRisk.percentage || 0;
        break;
      case 'adx':
        valA = a.analysis?.volatilityMetrics.adx || 0;
        valB = b.analysis?.volatilityMetrics.adx || 0;
        break;
      case 'score':
      default:
        valA = a.analysis?.opportunityScore || 0;
        valB = b.analysis?.opportunityScore || 0;
        break;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <div
      className={`overflow-x-auto rounded-3xl border backdrop-blur-md transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
      }`}
    >
      <table className="w-full text-left text-xs">
        <thead
          className={`border-b font-semibold transition-colors ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}
        >
          <tr>
            <th
              onClick={() => handleSort('symbol')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Activo</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th
              onClick={() => handleSort('price')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 text-right transition-colors"
            >
              <div className="flex items-center justify-end gap-1">
                <span>Precio & 24h</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="px-4 py-3.5">Tendencia</th>
            <th
              onClick={() => handleSort('days')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Tiempo</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th
              onClick={() => handleSort('risk')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Riesgo Giro</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th
              onClick={() => handleSort('adx')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Fuerza (ADX)</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="px-4 py-3.5">Señal Actual</th>
            <th
              onClick={() => handleSort('score')}
              className="cursor-pointer px-4 py-3.5 hover:text-blue-500 text-center transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <span>Score</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="px-4 py-3.5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody
          className={`divide-y font-medium transition-colors ${
            isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-800'
          }`}
        >
          {sortedAssets.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            const analysis = asset.analysis;
            if (!analysis) return null;

            const isBullish = analysis.trend === 'BULLISH';
            const isBearish = analysis.trend === 'BEARISH';
            const isPositive = asset.change24hPct >= 0;

            const riskColor = {
              BAJO: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
              MEDIO: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200',
              ALTO: isDark ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-rose-700 bg-rose-50 border-rose-200',
            }[analysis.reversalRisk.level];

            return (
              <tr
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#2c2c2e] text-white font-semibold'
                      : 'bg-slate-100/90 text-slate-900 font-semibold'
                    : isDark
                    ? 'hover:bg-[#2c2c2e]/50'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Symbol */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</span>
                    <span
                      className={`rounded-lg px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                        isDark ? 'bg-[#2c2c2e] text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {asset.type}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asset.name}</div>
                </td>

                {/* Price */}
                <td className="px-4 py-3.5 text-right font-mono">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(asset.price)}
                  </div>
                  <div className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                  </div>
                </td>

                {/* Trend */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-xs font-semibold border ${
                      isBullish
                        ? isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isBearish
                        ? isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                        : isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isBullish ? <TrendingUp className="h-3 w-3" /> : isBearish ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {analysis.trendLabel}
                  </span>
                </td>

                {/* Days */}
                <td className="px-4 py-3.5">
                  <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>{analysis.daysInTrend} d</span>
                  </div>
                </td>

                {/* Reversal Risk */}
                <td className="px-4 py-3.5">
                  <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${riskColor}`}>
                    {analysis.reversalRisk.level} ({analysis.reversalRisk.percentage}%)
                  </span>
                </td>

                {/* ADX / ATR */}
                <td className="px-4 py-3.5">
                  <div className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {analysis.volatilityMetrics.adx}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    ATR {analysis.volatilityMetrics.atrPct}%
                  </div>
                </td>

                {/* Signal */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${
                      analysis.signal === 'OPORTUNIDAD DE ENTRADA'
                        ? isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : analysis.signal === 'OPORTUNIDAD DE SALIDA'
                        ? isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                        : isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        analysis.signal === 'OPORTUNIDAD DE ENTRADA'
                          ? 'bg-emerald-500'
                          : analysis.signal === 'OPORTUNIDAD DE SALIDA'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    {analysis.signal}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold ${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`}>
                    {analysis.opportunityScore}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(asset.id);
                        onOpenChart(asset.id);
                      }}
                      title="Ver Gráfico"
                      className={`rounded-xl p-1.5 transition-colors ${
                        isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(asset.id);
                        onOpenBacktest(asset.id);
                      }}
                      title="Probar Estrategia (Backtest)"
                      className={`rounded-xl p-1.5 transition-colors ${
                        isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAsset(asset.id);
                      }}
                      title="Eliminar de Watchlist"
                      className={`rounded-xl p-1.5 transition-colors ${
                        isDark ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
