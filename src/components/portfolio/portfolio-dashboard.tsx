'use client';

import React, { useMemo, useState } from 'react';
import { Asset } from '@/lib/types/market';
import { RealPosition, CapitalMovement } from '@/lib/types/portfolio';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  PlusCircle,
  Shield,
  Target,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PortfolioDashboardProps {
  assets: Asset[];
  onOpenChart: (id: string) => void;
  onOpenScreener: () => void;
}

export function PortfolioDashboard({
  assets,
  onOpenChart,
  onOpenScreener,
}: PortfolioDashboardProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const {
    capitalMovements,
    positions,
    removeCapitalMovement,
    deletePosition,
    closePosition,
    netContributions,
    realizedPnl,
    getLivePositionMetrics,
    openApplyModal,
    openMovementModal,
  } = usePortfolioContext();

  const [isMovementsExpanded, setIsMovementsExpanded] = useState(false);
  const [closingPosId, setClosingPosId] = useState<string | null>(null);
  const [manualExitPrice, setManualExitPrice] = useState<string>('');

  // Map of current live asset prices
  const currentPrices = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach((a) => {
      map[a.id] = a.price;
      map[a.symbol] = a.price;
      const clean = a.symbol.replace('/', '').replace('-', '').toUpperCase();
      map[clean] = a.price;
    });
    return map;
  }, [assets]);

  // Open & Closed positions list
  const openPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'OPEN');
  }, [positions]);

  const closedPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'CLOSED');
  }, [positions]);

  // Total Unrealized PnL from live open positions
  const unrealizedPnlTotal = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const metrics = getLivePositionMetrics(pos, currentPrices);
      return acc + metrics.unrealizedPnlUSD;
    }, 0);
  }, [openPositions, currentPrices, getLivePositionMetrics]);

  // Total Trading PnL (Realized + Unrealized)
  const totalTradingPnl = realizedPnl + unrealizedPnlTotal;

  // Total Current Capital
  const totalCapital = netContributions + totalTradingPnl;

  // Trading Return % on Net Contributions
  const returnOnCapitalPct =
    netContributions > 0 ? (totalTradingPnl / netContributions) * 100 : 0;

  // Helper for quick closing position
  const handleQuickClose = (pos: RealPosition) => {
    const live = getLivePositionMetrics(pos, currentPrices);
    const exitPrice = live.currentPrice || pos.entryPrice;
    if (confirm(`¿Cerrar posición en ${pos.symbol} al precio actual de mercado ($${exitPrice})?`)) {
      closePosition(pos.id, exitPrice, 'MANUAL');
    }
  };

  const hasAnyData = capitalMovements.length > 0 || positions.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Actions */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mi Cartera & Operaciones Reales
                </h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.tintBgClass} ${accent.textClass}`}>
                  En Vivo
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Seguimiento de capital real, control de posiciones ejecutadas y balance general
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openMovementModal}
              className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="h-4 w-4 text-blue-500" />
              <span>+ Registrar Movimiento</span>
            </button>

            <button
              type="button"
              onClick={() => openApplyModal(assets[0] || null)}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold text-white transition-all shadow-md ${
                accent.bgClass
              } hover:opacity-95 active:scale-[0.99]`}
            >
              <Plus className="h-4 w-4" />
              <span>+ Nueva Operación</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Capital Summary 3 KPIs (Same style as Backtest KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* KPI 1: Aporte Propio Neto */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              1. Aporte Propio Neto
            </span>
            <div className="flex items-center gap-1 text-[11px] text-blue-500 font-bold">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Depósitos - Retiros</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(netContributions)}
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Movimientos: <strong className="font-mono">{capitalMovements.length}</strong></span>
            <button
              type="button"
              onClick={() => setIsMovementsExpanded(!isMovementsExpanded)}
              className="text-blue-500 hover:underline flex items-center gap-0.5 text-[11px] font-semibold"
            >
              <span>{isMovementsExpanded ? 'Ocultar historial' : 'Ver movimientos'}</span>
              {isMovementsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* KPI 2: Ganancia / Pérdida en Operaciones */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              2. Rendimiento en Operaciones
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                totalTradingPnl >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {totalTradingPnl >= 0 ? '+' : ''}{returnOnCapitalPct.toFixed(2)}% retorno
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-2xl sm:text-3xl font-black ${
                totalTradingPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {totalTradingPnl >= 0 ? '+' : ''}{formatCurrency(totalTradingPnl)}
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Realizado: <strong className={realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}</strong></span>
            <span>Flotante: <strong className={unrealizedPnlTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{unrealizedPnlTotal >= 0 ? '+' : ''}{formatCurrency(unrealizedPnlTotal)}</strong></span>
          </div>
        </div>

        {/* KPI 3: Capital Total Actual */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark
              ? `${accent.borderClass} ${accent.tintBgClass}`
              : `${accent.borderClass} ${accent.tintBgClass} shadow-xs`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${accent.textClass}`}>
              3. Capital Total Actual
            </span>
            <div className={`flex items-center gap-1 text-[11px] font-bold ${accent.textClass}`}>
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Balance Real</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(totalCapital)}
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Posiciones activas: <strong className="font-mono text-blue-500">{openPositions.length}</strong></span>
            <span>Cerradas: <strong className="font-mono">{closedPositions.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Capital Movements History Table */}
      {isMovementsExpanded && (
        <div
          className={`rounded-3xl border p-5 shadow-xs transition-colors space-y-3 animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-slate-800/40">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Historial de Movimientos de Capital
            </h3>
            <button
              type="button"
              onClick={openMovementModal}
              className="text-xs text-blue-500 hover:underline font-bold"
            >
              + Añadir Movimiento
            </button>
          </div>

          {capitalMovements.length === 0 ? (
            <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No hay movimientos de capital registrados todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3">Nota</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20 font-mono">
                  {capitalMovements.map((mov) => (
                    <tr key={mov.id} className={isDark ? 'hover:bg-[#2c2c2e]/30' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 text-slate-400">{mov.date}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                          mov.type === 'DEPOSIT'
                            ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                            : mov.type === 'WITHDRAWAL'
                            ? isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-700'
                            : isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {mov.type === 'DEPOSIT' ? 'Depósito' : mov.type === 'WITHDRAWAL' ? 'Retiro' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        mov.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {mov.amount >= 0 ? '+' : ''}{formatCurrency(mov.amount)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 truncate max-w-xs">
                        {mov.note || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar este movimiento de capital?')) {
                              removeCapitalMovement(mov.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar Movimiento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. POSICIONES ABIERTAS */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-colors space-y-4 ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3.5 border-slate-800/40">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Posiciones Abiertas ({openPositions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Precios actualizados en vivo
          </span>
        </div>

        {openPositions.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              No tienes posiciones abiertas
            </h4>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Aplica oportunidades directamente desde el Screener o pulsa el botón &quot;+ Nueva Operación&quot; para registrar tu primera posición.
            </p>
            <button
              type="button"
              onClick={onOpenScreener}
              className="mt-2 rounded-2xl bg-blue-500 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-xs"
            >
              Explorar Oportunidades →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openPositions.map((pos) => {
              const live = getLivePositionMetrics(pos, currentPrices);
              const isProfit = live.unrealizedPnlUSD >= 0;

              return (
                <div
                  key={pos.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50/80 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Symbol, Entry Date, Live Price */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-base font-black tracking-tight">{pos.symbol}</span>
                          <span className="rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                            Abierta
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Entrada: {pos.entryDate}</span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs text-slate-400">Precio Actual</div>
                        <div className="font-bold text-sm">{formatCurrency(live.currentPrice)}</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2 border-y border-current/10">
                      <div>
                        <span className="text-[10px] font-sans text-slate-400 block">Capital Invertido:</span>
                        <span className="font-bold">{formatCurrency(pos.capitalAllocated)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-sans text-slate-400 block">Precio Entrada:</span>
                        <span className="font-bold">{formatCurrency(pos.entryPrice)}</span>
                      </div>
                    </div>

                    {/* Live Unrealized PnL */}
                    <div className="mt-3 flex items-center justify-between rounded-xl border p-2.5 font-mono ${
                      isProfit
                        ? isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
                        : isDark ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'
                    }">
                      <div className="text-[11px] font-sans font-bold text-slate-400">
                        P&L Flotante:
                      </div>
                      <div className={`font-bold text-sm ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(live.unrealizedPnlUSD)} ({isProfit ? '+' : ''}{live.unrealizedPnlPct}%)
                      </div>
                    </div>

                    {/* SL & TP Targets & Distances */}
                    <div className="mt-2.5 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 flex items-center gap-1 font-sans">
                          <Shield className="h-3 w-3" /> Stop Loss:
                        </span>
                        <span className="text-slate-300">
                          {pos.stopLoss !== null ? `$${pos.stopLoss} (${live.distToSlPct !== null && live.distToSlPct >= 0 ? '+' : ''}${live.distToSlPct}%)` : 'Sin SL'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <Target className="h-3 w-3" /> Take Profit:
                        </span>
                        <span className="text-slate-300">
                          {pos.takeProfit !== null ? `$${pos.takeProfit} (${live.distToTpPct !== null && live.distToTpPct >= 0 ? '+' : ''}${live.distToTpPct}%)` : 'Sin TP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickClose(pos)}
                      className="flex-1 rounded-xl bg-blue-500/15 border border-blue-500/30 py-1.5 text-blue-400 hover:bg-blue-500/25 font-bold transition-all text-center"
                    >
                      Cerrar Posición
                    </button>

                    <button
                      type="button"
                      onClick={() => openApplyModal(null, pos)}
                      className="rounded-xl border border-slate-700/80 p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Editar Posición"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la posición de ${pos.symbol}? (Se borrará completamente del registro)`)) {
                          deletePosition(pos.id);
                        }
                      }}
                      className="rounded-xl border border-slate-700/80 p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar por completo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. HISTORIAL DE OPERACIONES CERRADAS */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-colors space-y-4 ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3.5 border-slate-800/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Historial de Operaciones Cerradas ({closedPositions.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            PnL Realizado Total: <strong className={realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}</strong>
          </span>
        </div>

        {closedPositions.length === 0 ? (
          <p className={`text-xs py-6 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Aún no tienes operaciones cerradas registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  <th className="py-3 px-3">Activo</th>
                  <th className="py-3 px-3">Fechas (Entrada / Salida)</th>
                  <th className="py-3 px-3 text-right">Capital</th>
                  <th className="py-3 px-3 text-right">Precios (Entrada → Salida)</th>
                  <th className="py-3 px-3 text-right">Resultado Realizado</th>
                  <th className="py-3 px-3 text-center">Motivo</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20 font-mono">
                {closedPositions.map((pos) => {
                  const pnl = pos.realizedPnl || 0;
                  const pnlPct = pos.realizedPnlPct || 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={pos.id} className={isDark ? 'hover:bg-[#2c2c2e]/30' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-3 font-bold text-sm font-mono text-white">
                        {pos.symbol}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">
                        <div>Entrada: {pos.entryDate}</div>
                        <div>Salida: {pos.exitDate || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-200">
                        {formatCurrency(pos.capitalAllocated)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        ${pos.entryPrice} → <strong className="text-white">${pos.exitPrice}</strong>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold text-sm ${
                        isProfit ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isProfit ? '+' : ''}{formatCurrency(pnl)}
                        <span className="block text-[10px]">
                          ({isProfit ? '+' : ''}{pnlPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                          pos.closeReason === 'TAKE_PROFIT'
                            ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700'
                            : pos.closeReason === 'STOP_LOSS'
                            ? isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700'
                            : isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {pos.closeReason === 'TAKE_PROFIT' ? 'Take Profit' : pos.closeReason === 'STOP_LOSS' ? 'Stop Loss' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openApplyModal(null, pos)}
                            className="text-slate-400 hover:text-white p-1 transition-colors"
                            title="Editar / Corregir datos reales"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar registro de ${pos.symbol}? Se quitará de los cálculos de capital.`)) {
                                deletePosition(pos.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Empty State if brand new */}
      {!hasAnyData && (
        <div
          className={`rounded-3xl border p-12 text-center transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500 mb-3">
            <Wallet className="h-8 w-8" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Comienza a llevar el control de tu Cartera Real
          </h3>
          <p className={`text-xs mt-1.5 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Registra tu aporte inicial de capital o aplica operaciones directamente desde las señales generadas por QuantPulse Pro.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openMovementModal}
              className="rounded-2xl bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-all"
            >
              + Registrar Primer Aporte
            </button>
            <button
              type="button"
              onClick={onOpenScreener}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
                isDark
                  ? 'border-slate-700 bg-[#2c2c2e] text-slate-200 hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ver Oportunidades del Screener →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
