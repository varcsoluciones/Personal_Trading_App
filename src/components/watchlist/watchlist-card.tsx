'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Trash2,
  BarChart2,
} from 'lucide-react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface WatchlistCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onOpenChart: () => void;
  onOpenBacktest: () => void;
}

export function WatchlistCard({
  asset,
  isSelected,
  onSelect,
  onRemove,
  onOpenChart,
  onOpenBacktest,
}: WatchlistCardProps) {
  const { settings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const analysis = asset.analysis;
  if (!analysis) return null;

  const isBullish = analysis.trend === 'BULLISH';
  const isBearish = analysis.trend === 'BEARISH';
  const isPositiveChange = asset.change24hPct >= 0;

  // Signal Badge (Clean Apple Pill)
  const signalConfig = {
    'OPORTUNIDAD DE ENTRADA': {
      bg: isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Oportunidad de Entrada',
    },
    'ESPERAR / MANTENER': {
      bg: isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Esperar / Mantener',
    },
    'OPORTUNIDAD DE SALIDA': {
      bg: isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Oportunidad de Salida',
    },
  }[analysis.signal];

  const riskColor = {
    BAJO: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    MEDIO: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200',
    ALTO: isDark ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-rose-700 bg-rose-50 border-rose-200',
  }[analysis.reversalRisk.level];

  const riskBarColor = {
    BAJO: 'bg-emerald-500',
    MEDIO: 'bg-amber-500',
    ALTO: 'bg-rose-500',
  }[analysis.reversalRisk.level];

  const typeBadge = {
    crypto: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200',
    stock: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200',
    etf: isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200',
  }[asset.type];

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? isDark
            ? 'border-blue-500 bg-[#1c1c1e] shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
            : 'border-blue-500 bg-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
          : isDark
          ? 'border-slate-800/80 bg-[#1c1c1e]/90 hover:border-slate-700 hover:bg-[#2c2c2e]/60'
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadge}`}>
              {asset.type}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Score: <strong className="text-blue-500">{analysis.opportunityScore}</strong>
            </span>
          </div>

          <button
            onClick={onRemove}
            title="Eliminar de favoritos"
            className={`opacity-0 group-hover:opacity-100 rounded-full p-1.5 transition-all ${
              isDark ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Symbol & Price (iOS Stocks Style) */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {asset.symbol}
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1`}>{asset.name}</p>
          </div>
          <div className="text-right">
            <div className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(asset.price)}
            </div>
            <div
              className={`font-mono text-xs font-semibold ${
                isPositiveChange ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isPositiveChange ? '+' : ''}{asset.change24hPct.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className={`my-3.5 h-[1px] ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`} />

        {/* 5 Core Items with iOS minimal styling and InfoTooltips */}
        <div className="space-y-2.5 text-xs">
          {/* 1. Tendencia Actual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tendencia:</span>
              <InfoTooltip text="Dirección dominante del activo según las Medias Móviles EMA 20 y EMA 50." title="Tendencia Actual" />
            </div>
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
          </div>

          {/* 2. Tiempo en Tendencia */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tiempo:</span>
              <InfoTooltip text="Días o velas continuas respetando la misma tendencia." title="Tiempo en Tendencia" />
            </div>
            <div className={`flex items-center gap-1 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>{analysis.daysInTrend} días</span>
            </div>
          </div>

          {/* 3. Riesgo de Giro */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Riesgo de Giro:</span>
                <InfoTooltip text="Probabilidad de agotamiento de la tendencia actual (por divergencias de RSI o medias aplanadas)." title="Riesgo de Cambio" />
              </div>
              <span className={`rounded-lg border px-1.5 py-0.2 text-[11px] font-bold ${riskColor}`}>
                {analysis.reversalRisk.level} ({analysis.reversalRisk.percentage}%)
              </span>
            </div>
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-[#2c2c2e]' : 'bg-slate-100'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${riskBarColor}`}
                style={{ width: `${analysis.reversalRisk.percentage}%` }}
              />
            </div>
          </div>

          {/* 4. Fuerza ADX / ATR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fuerza (ADX):</span>
              <InfoTooltip text="Mide la fuerza del impulso (ADX > 25 indica tendencia fuerte; ADX < 20 indica rango/debilidad)." title="Fuerza & Volatilidad" />
            </div>
            <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {analysis.volatilityMetrics.adx} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({analysis.volatilityMetrics.strengthLabel})</span>
            </span>
          </div>

          {/* 5. Señal Actual */}
          <div className="pt-1">
            <div className={`flex items-center gap-2 rounded-2xl border p-2 text-xs font-semibold ${signalConfig.bg}`}>
              <span className={`h-2 w-2 rounded-full ${signalConfig.dot}`} />
              <span className="flex-1 font-bold">{signalConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer (iOS Action Buttons) */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onOpenChart();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-1.5 text-xs font-bold transition-all ${
            isDark
              ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-slate-200 hover:bg-[#3a3a3c]'
              : 'border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          <span>Gráfico</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onOpenBacktest();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-1.5 text-xs font-bold transition-all ${
            isDark
              ? 'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
              : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Backtest</span>
        </button>
      </div>
    </div>
  );
}
