'use client';

import React from 'react';
import { Asset } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import {
  TrendingUp,
  BarChart2,
  Trash2,
  Target,
  Shield,
} from 'lucide-react';

interface WatchlistTableProps {
  assets: Asset[];
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
  onRemoveAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
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
              <th className="py-3.5 px-3 text-right">🎯 Entrada Sugerida</th>
              <th className="py-3.5 px-3 text-right">🎯 Take Profit / Stop</th>
              <th className="py-3.5 px-3 text-center">Veredicto de Confianza</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {assets.map((asset) => {
              const analysis = asset.analysis;
              if (!analysis) return null;

              const isSelected = asset.id === selectedAssetId;
              const isPositive = asset.change24hPct >= 0;
              const order = analysis.orderSetup;

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
                        className={`rounded-lg px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                          isDark ? 'bg-[#2c2c2e] text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
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

                  {/* 3. Suggested Entry */}
                  <td className="px-3 py-3.5 text-right">
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
                  <td className="px-3 py-3.5 text-right font-mono text-[11px]">
                    <div className="text-emerald-500 font-bold flex items-center justify-end gap-1">
                      <Target className="h-3 w-3" />
                      <span>{formatCurrency(order.suggestedTakeProfit)} (+{order.suggestedTakeProfitPct}%)</span>
                    </div>
                    <div className="text-rose-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                      <Shield className="h-3 w-3" />
                      <span>{formatCurrency(order.suggestedStopLoss)} (-{order.suggestedStopLossPct}%)</span>
                    </div>
                  </td>

                  {/* 5. Single Unified Confidence Badge */}
                  <td className="px-3 py-3.5 text-center">
                    <ConfidenceBadge
                      opportunityScore={analysis.opportunityScore}
                      isSimulated={asset.isSimulated}
                      size="sm"
                    />
                  </td>

                  {/* 6. Actions */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
