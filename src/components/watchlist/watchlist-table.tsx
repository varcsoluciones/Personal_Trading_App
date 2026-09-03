'use client';

import React from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { useAlerts } from '@/lib/context/alerts-context';
import { getAssetTypeBadgeStyle, getTrendBadgeStyle } from '@/lib/ui/badge-styles';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  BarChart2,
  Trash2,
  AlertTriangle,
  Coins,
  Bell,
} from 'lucide-react';

interface WatchlistTableProps {
  assets: Asset[];
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
  onRemoveAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
}

function formatCapitalVolume(volume: number, price: number, currencyPrefix = '$'): string {
  if (!volume || volume <= 0) return `${currencyPrefix}0`;
  const totalUSD = volume < 1_000_000 && price > 50 ? volume * price : volume;
  if (totalUSD >= 1_000_000_000) {
    return `${currencyPrefix}${(totalUSD / 1_000_000_000).toFixed(2)}B`;
  }
  if (totalUSD >= 1_000_000) {
    return `${currencyPrefix}${(totalUSD / 1_000_000).toFixed(2)}M`;
  }
  if (totalUSD >= 1_000) {
    return `${currencyPrefix}${(totalUSD / 1_000).toFixed(2)}K`;
  }
  return `${currencyPrefix}${totalUSD.toFixed(0)}`;
}

export function WatchlistTable({
  assets,
  selectedAssetId,
  onSelectAsset,
  onRemoveAsset,
  onOpenChart,
  onOpenBacktest,
}: WatchlistTableProps) {
  const { settings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const { getActiveAlertsCount, openAlertsModal } = useAlerts();

  if (assets.length === 0) {
    return null;
  }

  return (
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
              <th className="py-3.5 px-3 text-right">Rango 24h (Mín - Máx)</th>
              <th className="py-3.5 px-3 text-right">Volumen Capital</th>
              <th className="py-3.5 px-3 text-left">Tendencia Detectada</th>
              <th className="py-3.5 px-3 text-center">Días en Tendencia</th>
              <th className="py-3.5 px-3 text-center">Riesgo de Giro</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {assets.map((asset) => {
              const analysis = asset.analysis;
              if (!analysis) return null;
              const activeAlertsCount = getActiveAlertsCount(asset.id);

              const isSelected = asset.id === selectedAssetId;
              const isPositive = asset.change24hPct >= 0;
              const isBullish = analysis.trend === 'BULLISH';
              const isBearish = analysis.trend === 'BEARISH';
              const trendStyle = getTrendBadgeStyle(analysis.trend, isDark);

              const lastCandle = asset.candles?.length ? asset.candles[asset.candles.length - 1] : null;
              const high24h = asset.high24h || (lastCandle ? lastCandle.high : asset.price);
              const low24h = asset.low24h || (lastCandle ? lastCandle.low : asset.price);
              const volume24h = asset.volume24h || (lastCandle ? lastCandle.volume : 0);

              const riskBadgeClass = {
                BAJO: isDark ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                MEDIO: isDark ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-200',
                ALTO: isDark ? 'text-rose-400 bg-rose-500/15 border-rose-500/30' : 'text-rose-700 bg-rose-50 border-rose-200',
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
                  {/* 1. Symbol & Type */}
                  <td className="px-4 py-3.5">
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

                  {/* 2. Price & 24h Change */}
                  <td className="px-3 py-3.5 text-right font-mono">
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(asset.price)}
                    </div>
                    <div className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isPositive ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                    </div>
                  </td>

                  {/* 3. Rango 24h (Mín - Máx) */}
                  <td className="px-3 py-3.5 text-right font-mono text-[11px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mín:</span>
                      <span className="font-semibold text-rose-400">{formatCurrency(low24h)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Máx:</span>
                      <span className="font-semibold text-emerald-400">{formatCurrency(high24h)}</span>
                    </div>
                  </td>

                  {/* 4. Volumen Total de Capital */}
                  <td className="px-3 py-3.5 text-right font-mono font-bold">
                    <div className={`flex items-center justify-end gap-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Coins className="h-3 w-3 text-blue-500" />
                      <span>{formatCapitalVolume(volume24h, asset.price)}</span>
                    </div>
                    <div className={`text-[10px] font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      24h negociado
                    </div>
                  </td>

                  {/* 5. Tendencia Detectada */}
                  <td className="px-3 py-3.5 text-left">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${trendStyle.badgeClass}`}
                    >
                      {isBullish ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : isBearish ? (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <span>{analysis.trendLabel}</span>
                    </span>
                  </td>

                  {/* 6. Días en Tendencia */}
                  <td className="px-3 py-3.5 text-center font-mono">
                    <div className={`inline-flex items-center gap-1 font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span>{analysis.daysInTrend} d</span>
                    </div>
                  </td>

                  {/* 7. Riesgo de Giro */}
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-0.5 text-xs font-bold ${riskBadgeClass}`}
                    >
                      {analysis.reversalRisk.level === 'ALTO' && <AlertTriangle className="h-3 w-3 shrink-0" />}
                      <span>{analysis.reversalRisk.level}</span>
                      <span className="font-mono opacity-85 font-normal">({analysis.reversalRisk.percentage}%)</span>
                    </span>
                  </td>

                  {/* 8. Actions */}
                  <td className="px-4 py-3.5 text-center">
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
                        <Bell className="h-4 w-4" />
                        {activeAlertsCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                            {activeAlertsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onSelectAsset(asset.id);
                          onOpenChart(asset.id);
                        }}
                        title="Ver Gráfico"
                        className={`rounded-xl p-1.5 transition-colors ${
                          isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => {
                          onSelectAsset(asset.id);
                          onOpenBacktest(asset.id);
                        }}
                        title="Simular Backtest"
                        className={`rounded-xl p-1.5 transition-colors ${
                          isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <BarChart2 className="h-4 w-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => onRemoveAsset(asset.id)}
                        title="Eliminar de favoritos"
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
    </div>
  );
}
