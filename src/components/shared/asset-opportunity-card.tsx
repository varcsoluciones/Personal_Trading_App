'use client';

import React, { useState } from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { useAlerts } from '@/lib/context/alerts-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import {
  TrendingUp,
  Trash2,
  BarChart2,
  Bell,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  Activity,
  Clock,
} from 'lucide-react';

export interface AssetOpportunityCardProps {
  asset: Asset;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
  onOpenChart?: () => void;
  onOpenBacktest?: () => void;
  customActionButtons?: React.ReactNode;
}

export function AssetOpportunityCard({
  asset,
  isSelected = false,
  onSelect,
  onRemove,
  onOpenChart,
  onOpenBacktest,
  customActionButtons,
}: AssetOpportunityCardProps) {
  const { settings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const { getActiveAlertsCount, openAlertsModal } = useAlerts();
  const activeAlertsCount = getActiveAlertsCount(asset.id);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const analysis = asset.analysis;
  if (!analysis) return null;

  const isPositiveChange = asset.change24hPct >= 0;
  const order = analysis.orderSetup;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-3xl border p-4 sm:p-5 transition-all cursor-pointer ${
        isSelected
          ? isDark
            ? 'border-blue-500 bg-[#2c2c2e] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/50'
            : 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/50'
          : isDark
          ? 'border-slate-800/80 bg-[#1c1c1e] hover:border-slate-700 hover:bg-[#2c2c2e]/70 shadow-xs'
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
      }`}
    >
      {/* Card Header: Score, Confidence, Ticker, Type & Remove */}
      <div>
        <div className="flex items-start justify-between gap-2">
          {/* Unified Score + Confidence Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Opportunity Score Pill */}
            <span
              className={`rounded-xl border px-2 py-0.5 text-xs font-black font-mono shadow-xs ${
                analysis.opportunityScore >= 95
                  ? isDark
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-500/40'
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
              {analysis.opportunityScore} pts
            </span>

            {/* Confidence Verdict */}
            <ConfidenceBadge
              opportunityScore={analysis.opportunityScore}
              reliabilityScore={asset.backtestReliabilityScore}
              lowSampleWarning={asset.backtestLowSampleWarning}
              isSimulated={asset.isSimulated}
              isDark={isDark}
              size="sm"
            />
          </div>

          {/* Remove from watchlist button (if provided) */}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(e);
              }}
              title="Eliminar de seguimiento"
              className={`rounded-xl p-1.5 opacity-0 group-hover:opacity-100 transition-all ${
                isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-[#2c2c2e]' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Ticker, Name & Price */}
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {asset.symbol}
              </span>
              <span
                className={`rounded-lg border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${getAssetTypeBadgeStyle(
                  asset.type,
                  isDark
                )}`}
              >
                {asset.type}
              </span>
            </div>
            <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {asset.name}
            </p>
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

        <div className={`my-3 h-[1px] ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`} />

        {/* Actionable Strategy Setup */}
        <div
          className={`rounded-2xl border p-3 space-y-2 mb-3 transition-colors ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/80'
          }`}
        >
          {/* Suggested Entry */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-500 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Entrada:
            </span>
            <div className="text-right">
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(order.suggestedEntryPrice)}
              </span>
              {order.distanceToEntryPct !== 0 && (
                <span className="text-[10px] text-amber-500 font-bold ml-1 font-mono">
                  ({order.distanceToEntryPct > 0 ? '+' : ''}{order.distanceToEntryPct}%)
                </span>
              )}
            </div>
          </div>

          {/* Target Take Profit & Stop Loss */}
          <div className="flex items-center justify-between text-xs pt-0.5 border-t border-slate-800/40">
            <div className="flex items-center gap-1 text-emerald-500 font-semibold">
              <Target className="h-3 w-3" />
              <span className="font-mono font-bold">{formatCurrency(order.suggestedTakeProfit)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">(+{order.suggestedTakeProfitPct}%)</span>
            </div>
            <div className="flex items-center gap-1 text-rose-500 font-semibold">
              <Shield className="h-3 w-3" />
              <span className="font-mono font-bold">{formatCurrency(order.suggestedStopLoss)}</span>
              <span className="text-[10px] text-rose-500 font-bold">(-{order.suggestedStopLossPct}%)</span>
            </div>
          </div>

          {/* Horizon Suggestion & Estimated Duration */}
          {order.horizonSuggestion && (
            <div className={`flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/30 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="font-bold">{order.horizonSuggestion.horizonLabel}:</span>
              </div>
              <div className="font-mono font-bold text-blue-400">
                ~{order.horizonSuggestion.durationLabel}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Technical Details Trigger */}
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTechnicalDetails(!showTechnicalDetails);
            }}
            className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
              isDark
                ? 'bg-[#2c2c2e]/40 text-slate-300 hover:bg-[#2c2c2e]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-blue-500" />
              <span>Detalle técnico</span>
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="h-3.5 w-3.5 opacity-70" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            )}
          </button>

          {/* Expanded Technical Details */}
          {showTechnicalDetails && (
            <div
              className={`mt-2 rounded-2xl border p-3 space-y-2 text-xs transition-all ${
                isDark
                  ? 'border-slate-800 bg-[#1c1c1e] text-slate-300'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Estructura:</span>
                <span className="font-semibold">
                  {analysis.trendLabel} ({analysis.daysInTrend} días en tendencia)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>RSI (14) / ADX:</span>
                <span className="font-mono font-semibold">
                  {analysis.indicators.rsi} / {analysis.volatilityMetrics.adx} ({analysis.volatilityMetrics.strengthLabel})
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>EMA 20 / EMA 50:</span>
                <span className="font-mono font-semibold">
                  ${analysis.indicators.ema20.toFixed(2)} / ${analysis.indicators.ema50.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/30">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Ratio Riesgo:Beneficio:</span>
                <span className="font-mono font-bold text-blue-500">
                  1:{order.riskRewardRatio}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer with Price Alert Bell Button */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}
      >
        {customActionButtons ? (
          customActionButtons
        ) : (
          <>
            {/* Price Alert Bell */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAlertsModal(asset);
              }}
              title={
                activeAlertsCount > 0
                  ? `${activeAlertsCount} alerta(s) de precio activa(s)`
                  : 'Crear alerta de precio'
              }
              className={`relative flex items-center justify-center rounded-2xl border p-2 transition-all shrink-0 ${
                activeAlertsCount > 0
                  ? isDark
                    ? 'border-blue-500/40 bg-blue-500/20 text-blue-400 shadow-xs ring-1 ring-blue-500/30'
                    : 'border-blue-200 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/30'
                  : isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-slate-400 hover:bg-[#3a3a3c] hover:text-white'
                  : 'border-slate-200 bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4 text-blue-500" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {onOpenChart && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
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
            )}

            {onOpenBacktest && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
