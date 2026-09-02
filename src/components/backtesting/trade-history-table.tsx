'use client';

import React, { useState } from 'react';
import { Trade } from '@/lib/types/market';
import { Target, Shield, Zap, Clock, Download } from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';

interface TradeHistoryTableProps {
  trades: Trade[];
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const { settings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'win') return t.netPnl > 0;
    if (filter === 'loss') return t.netPnl <= 0;
    return true;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Fecha Entrada',
      'Fecha Salida',
      'Dias',
      'Precio Entrada',
      'Precio Salida',
      'Comisiones',
      'PnL Neto',
      'PnL Neto %',
      'Motivo Cierre',
      'Capital Posterior',
    ];

    const rows = trades.map((t) => [
      t.id,
      t.entryDate,
      t.exitDate,
      t.holdingDays,
      t.entryPrice,
      t.exitPrice,
      t.fees,
      t.netPnl,
      t.netPnlPct,
      t.exitReason,
      t.capitalAfter,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantpulse_backtest_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getExitReasonBadge = (reason: Trade['exitReason']) => {
    switch (reason) {
      case 'TAKE_PROFIT':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <Target className="h-3 w-3" /> Take Profit
          </span>
        );
      case 'STOP_LOSS':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${
              isDark
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <Shield className="h-3 w-3" /> Stop Loss
          </span>
        );
      case 'SIGNAL_EXIT':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${
              isDark
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Zap className="h-3 w-3" /> Salida Técnica
          </span>
        );
      case 'END_OF_DATA':
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${
              isDark
                ? 'bg-[#2c2c2e] border-slate-700 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <Clock className="h-3 w-3" /> Fin Histórico
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-3xl border p-6 backdrop-blur-md space-y-4 transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
      }`}
    >
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Registro Detallado de Operaciones
          </h4>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Historial con deducción de comisiones (0.1%) y deslizamiento (0.05%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Win/Loss Filter */}
          <div className={`flex items-center rounded-2xl p-1 ${isDark ? 'bg-[#2c2c2e]' : 'bg-slate-100'}`}>
            <button
              onClick={() => setFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                filter === 'all'
                  ? isDark ? 'bg-[#3a3a3c] text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({trades.length})
            </button>
            <button
              onClick={() => setFilter('win')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                filter === 'win'
                  ? 'bg-emerald-500/20 text-emerald-600 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-emerald-500'
              }`}
            >
              Ganadas ({trades.filter((t) => t.netPnl > 0).length})
            </button>
            <button
              onClick={() => setFilter('loss')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                filter === 'loss'
                  ? 'bg-rose-500/20 text-rose-600 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-rose-500'
              }`}
            >
              Perdidas ({trades.filter((t) => t.netPnl <= 0).length})
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isDark
                ? 'border-slate-700/80 bg-[#2c2c2e] text-slate-200 hover:bg-[#3a3a3c] hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Trades Table */}
      <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <table className="w-full text-left text-xs">
          <thead className={`border-b font-semibold ${isDark ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
            <tr>
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Fecha Entrada</th>
              <th className="px-3.5 py-2.5">Fecha Salida</th>
              <th className="px-3.5 py-2.5 text-center">Duración</th>
              <th className="px-3.5 py-2.5 text-right">Entrada</th>
              <th className="px-3.5 py-2.5 text-right">Salida</th>
              <th className="px-3.5 py-2.5 text-right">Comisiones</th>
              <th className="px-3.5 py-2.5 text-right">PnL Neto</th>
              <th className="px-3.5 py-2.5 text-right">PnL %</th>
              <th className="px-3.5 py-2.5 text-center">Cierre</th>
              <th className="px-3.5 py-2.5 text-right">Capital</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-800'}`}>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className={`py-6 text-center font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No hay operaciones registradas con los parámetros actuales.
                </td>
              </tr>
            ) : (
              filteredTrades.map((t, idx) => {
                const isWin = t.netPnl > 0;
                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${isDark ? 'hover:bg-[#2c2c2e]/40' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`px-3.5 py-2.5 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filteredTrades.length - idx}</td>
                    <td className={`px-3.5 py-2.5 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.entryDate}</td>
                    <td className={`px-3.5 py-2.5 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.exitDate}</td>
                    <td className={`px-3.5 py-2.5 text-center font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.holdingDays}d
                    </td>
                    <td className={`px-3.5 py-2.5 text-right font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatCurrency(t.entryPrice)}
                    </td>
                    <td className={`px-3.5 py-2.5 text-right font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatCurrency(t.exitPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-amber-500 font-semibold">
                      -{formatCurrency(t.fees)}
                    </td>
                    <td
                      className={`px-3.5 py-2.5 text-right font-bold ${
                        isWin ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isWin ? '+' : ''}{formatCurrency(t.netPnl)}
                    </td>
                    <td
                      className={`px-3.5 py-2.5 text-right font-bold ${
                        isWin ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isWin ? '+' : ''}{t.netPnlPct.toFixed(2)}%
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-sans">
                      {getExitReasonBadge(t.exitReason)}
                    </td>
                    <td className={`px-3.5 py-2.5 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(t.capitalAfter)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
