'use client';

import React, { useMemo, useState } from 'react';
import { Asset } from '@/lib/types/market';
import { RealPosition, CapitalMovement, PortfolioWallet } from '@/lib/types/portfolio';
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
  ArrowRightLeft,
  Building2,
  History,
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
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    capitalMovements,
    positions,
    removeCapitalMovement,
    deletePosition,
    closePosition,
    netContributions,
    realizedPnl,
    getLivePositionMetrics,
    getWalletMetrics,
    getWalletAvailableCapital,
    openApplyModal,
    openHistoryModal,
    openMovementModal,
    openWalletModal,
  } = usePortfolioContext();

  const [isMovementsExpanded, setIsMovementsExpanded] = useState(false);

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

  // Wallet dictionary for fast lookups
  const walletMap = useMemo(() => {
    const map: Record<string, PortfolioWallet> = {};
    wallets.forEach((w) => {
      map[w.id] = w;
    });
    return map;
  }, [wallets]);

  const getWalletForPosition = (pos: RealPosition) => {
    const id = pos.portfolioId || 'wallet_main';
    return walletMap[id] || wallets[0] || { id, name: 'Cartera 1', color: '#3b82f6' };
  };

  const getWalletById = (walletId?: string) => {
    const id = walletId || 'wallet_main';
    return walletMap[id] || wallets[0] || { id, name: 'Cartera 1', color: '#3b82f6' };
  };

  // Open & Closed positions lists
  const openPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'OPEN');
  }, [positions]);

  const closedPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'CLOSED');
  }, [positions]);

  // Total Unrealized PnL from live open positions (Flotante en operaciones abiertas global)
  const unrealizedPnlTotal = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const metrics = getLivePositionMetrics(pos, currentPrices);
      return acc + metrics.unrealizedPnlUSD;
    }, 0);
  }, [openPositions, currentPrices, getLivePositionMetrics]);

  // Total Trading PnL (Realized + Unrealized) global
  const totalTradingPnl = realizedPnl + unrealizedPnlTotal;

  // Capital Liquidado / Balance Contable Cerrado (Aportes Netos + PnL Realizado) global
  const settledCapital = netContributions + realizedPnl;

  // Capital currently utilized in OPEN positions global
  const usedCapital = useMemo(() => {
    return openPositions.reduce((acc, pos) => acc + (pos.capitalAllocated || 0), 0);
  }, [openPositions]);

  // Saldo Disponible en Efectivo para Nuevas Operaciones global
  const availableCash = Math.max(0, settledCapital - usedCapital);

  // Valor Actual de las Posiciones Abiertas global
  const openPositionsMarketValue = usedCapital + unrealizedPnlTotal;

  // Valor Total de la Cartera / Patrimonio Total global
  const totalPortfolioValue = settledCapital + unrealizedPnlTotal;

  // Available cash percentage global
  const availableCashPct = settledCapital > 0 ? (availableCash / settledCapital) * 100 : 0;

  // Trading Return % on Net Contributions global
  const returnOnCapitalPct =
    netContributions > 0 ? (totalTradingPnl / netContributions) * 100 : 0;

  // Filtered positions based on selected portfolio tab
  const displayedOpenPositions = useMemo(() => {
    if (selectedWalletId === 'ALL') return openPositions;
    return openPositions.filter((p) => (p.portfolioId || 'wallet_main') === selectedWalletId);
  }, [openPositions, selectedWalletId]);

  const displayedClosedPositions = useMemo(() => {
    if (selectedWalletId === 'ALL') return closedPositions;
    return closedPositions.filter((p) => (p.portfolioId || 'wallet_main') === selectedWalletId);
  }, [closedPositions, selectedWalletId]);

  // Metrics for the active selected portfolio in the subtle 1-line summary header
  const currentSummaryMetrics = useMemo(() => {
    if (selectedWalletId === 'ALL') {
      return {
        name: 'Todas las Carteras (Consolidado)',
        netContributions,
        totalTradingPnl,
        returnOnCapitalPct,
        totalPortfolioValue,
        availableCash,
        openCount: openPositions.length,
        closedCount: closedPositions.length,
      };
    }

    const wm = getWalletMetrics(selectedWalletId, currentPrices);
    const w = walletMap[selectedWalletId] || wallets[0];
    const wRetPct = wm.netContributions > 0 ? (wm.totalTradingPnl / wm.netContributions) * 100 : 0;

    return {
      name: w?.name || 'Cartera Seleccionada',
      netContributions: wm.netContributions,
      totalTradingPnl: wm.totalTradingPnl,
      returnOnCapitalPct: wRetPct,
      totalPortfolioValue: wm.totalPortfolioValue,
      availableCash: wm.availableCash,
      openCount: displayedOpenPositions.length,
      closedCount: displayedClosedPositions.length,
    };
  }, [
    selectedWalletId,
    netContributions,
    totalTradingPnl,
    returnOnCapitalPct,
    totalPortfolioValue,
    availableCash,
    openPositions.length,
    closedPositions.length,
    displayedOpenPositions.length,
    displayedClosedPositions.length,
    getWalletMetrics,
    currentPrices,
    walletMap,
    wallets,
  ]);

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
      {/* 1. Header with 3 Action Buttons */}
      <div
        className={`rounded-3xl border p-3.5 sm:p-6 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              <Wallet className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className={`text-sm sm:text-xl font-bold font-sans tracking-tight truncate whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mi Cartera & Operaciones Reales
                </h2>
                <span className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold font-sans uppercase tracking-wider shrink-0 ${accent.tintBgClass} ${accent.textClass}`}>
                  En Vivo
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 font-sans truncate sm:whitespace-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Seguimiento de capital real, control de posiciones por broker y balance general
              </p>
            </div>
          </div>

          {/* 3 Action Buttons in Main Header - 1 single row on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto custom-horizontal-scrollbar no-scrollbar pb-0.5 sm:pb-0 max-w-full">
            {/* Button 1: Mis Carteras */}
            <button
              type="button"
              onClick={openWalletModal}
              className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold font-sans transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
              title="Gestionar subcuentas y carteras (Binance, IBKR, etc.)"
            >
              <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span><span className="hidden sm:inline">Mis </span>Carteras ({wallets.length})</span>
            </button>

            {/* Button 2: Registrar Movimiento */}
            <button
              type="button"
              onClick={() => openMovementModal()}
              className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold font-sans transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'border-slate-700/80 bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span><span className="hidden sm:inline">+ Registrar </span><span className="sm:hidden">+ </span>Movimiento</span>
            </button>

            {/* Button 3: Nueva Operación */}
            <button
              type="button"
              onClick={() => openApplyModal(assets[0] || null)}
              className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold font-sans text-white transition-all shadow-md cursor-pointer ${
                accent.bgClass
              } hover:opacity-95 active:scale-[0.99]`}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span><span className="hidden sm:inline">+ </span>Nueva Operación</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Consolidated Capital Summary: 4 Large KPI Cards (Global Consolidated Total) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Aporte Propio Neto */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl border p-2.5 sm:p-5 flex flex-col justify-between transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 min-h-[20px] sm:min-h-[24px]">
              <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                1. Aporte Propio Neto
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 font-sans">
                <DollarSign className="h-3 w-3" />
                <span>Depósitos - Retiros</span>
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline">
              <span className={`font-mono text-base sm:text-3xl font-bold sm:font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(netContributions)}
              </span>
            </div>
          </div>
          <div className={`mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] sm:text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Mov: <strong className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{capitalMovements.length}</strong></span>
            <button
              type="button"
              onClick={() => setIsMovementsExpanded(!isMovementsExpanded)}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 text-[10px] sm:text-xs font-bold cursor-pointer font-sans"
            >
              <span>{isMovementsExpanded ? 'Ocultar' : 'Historial'}</span>
              {isMovementsExpanded ? <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            </button>
          </div>
        </div>

        {/* KPI 2: Ganancia / Pérdida en Operaciones */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl border p-2.5 sm:p-5 flex flex-col justify-between transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 min-h-[20px] sm:min-h-[24px]">
              <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                2. Rendimiento
              </p>
              <span
                className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-sans ${
                  totalTradingPnl >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {totalTradingPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{totalTradingPnl >= 0 ? '+' : ''}{returnOnCapitalPct.toFixed(2)}% retorno</span>
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline">
              <span
                className={`font-mono text-base sm:text-3xl font-bold sm:font-black tracking-tight ${
                  totalTradingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalTradingPnl >= 0 ? '+' : ''}{formatCurrency(totalTradingPnl)}
              </span>
            </div>
          </div>
          <div className={`mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] sm:text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Realiz: <strong className={`font-mono font-bold ${realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}</strong></span>
            <span>Flot: <strong className={`font-mono font-bold ${unrealizedPnlTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{unrealizedPnlTotal >= 0 ? '+' : ''}{formatCurrency(unrealizedPnlTotal)}</strong></span>
          </div>
        </div>

        {/* KPI 3: Valor Total de la Cartera (Patrimonio Total) */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl border p-2.5 sm:p-5 flex flex-col justify-between transition-all ${
            isDark
              ? 'border-slate-800/80 bg-[#1c1c1e]'
              : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 min-h-[20px] sm:min-h-[24px]">
              <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                3. Valor Cartera
              </p>
              <span
                className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-sans ${
                  isDark
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                <span>Patrimonio Total</span>
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline">
              <span className={`font-mono text-base sm:text-3xl font-bold sm:font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalPortfolioValue)}
              </span>
            </div>
          </div>
          <div className={`mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] sm:text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Cash: <strong className="font-mono font-bold text-emerald-400">{formatCurrency(availableCash)}</strong></span>
            <span>Activos: <strong className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{formatCurrency(openPositionsMarketValue)}</strong></span>
          </div>
        </div>

        {/* KPI 4: Capital Utilizado & Saldo Disponible en Efectivo */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl border p-2.5 sm:p-5 flex flex-col justify-between transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 min-h-[20px] sm:min-h-[24px]">
              <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                4. Saldo Efectivo
              </p>
              <span
                className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-sans ${
                  availableCash > 0
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isDark
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span>{availableCashPct.toFixed(0)}% libre</span>
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline">
              <span className={`font-mono text-base sm:text-3xl font-bold sm:font-black tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {formatCurrency(availableCash)}
              </span>
            </div>
          </div>
          <div className={`mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] sm:text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Órdenes: <strong className="font-mono font-bold text-amber-400">{formatCurrency(usedCapital)}</strong></span>
            <span>Flotante: <strong className={`font-mono font-bold ${unrealizedPnlTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{unrealizedPnlTotal >= 0 ? '+' : ''}{formatCurrency(unrealizedPnlTotal)}</strong></span>
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
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <h3 className={`text-sm font-bold font-sans tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Historial de Movimientos de Capital
              </h3>
            </div>
            <button
              type="button"
              onClick={() => openMovementModal()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold font-sans cursor-pointer"
            >
              + Añadir Movimiento
            </button>
          </div>

          {capitalMovements.length === 0 ? (
            <p className={`text-xs py-4 text-center font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No hay movimientos de capital registrados todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider font-sans ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Cartera / Destino</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3">Nota</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  {capitalMovements.map((mov) => {
                    const sourceW = getWalletById(mov.portfolioId);
                    const targetW = mov.targetPortfolioId ? getWalletById(mov.targetPortfolioId) : null;

                    return (
                      <tr key={mov.id} className={isDark ? 'hover:bg-[#2c2c2e]/30' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{mov.date}</td>
                        <td className="py-2.5 px-3 font-sans">
                          {mov.type === 'TRANSFER' && targetW ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-bold text-slate-300">{sourceW.name}</span>
                              <ArrowRightLeft className="h-3 w-3 text-purple-400 shrink-0" />
                              <span className="font-bold text-purple-300">{targetW.name}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sourceW.color || '#3b82f6' }} />
                              {sourceW.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase font-sans ${
                            mov.type === 'DEPOSIT'
                              ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700'
                              : mov.type === 'WITHDRAWAL'
                              ? isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700'
                              : mov.type === 'TRANSFER'
                              ? isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-purple-50 text-purple-700'
                              : isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {mov.type === 'DEPOSIT' ? 'Depósito' : mov.type === 'WITHDRAWAL' ? 'Retiro' : mov.type === 'TRANSFER' ? 'Transferencia' : 'Ajuste'}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold text-xs ${
                          mov.type === 'TRANSFER'
                            ? 'text-purple-400'
                            : mov.amount >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {mov.type === 'TRANSFER' ? '↔ ' : mov.amount >= 0 ? '+' : ''}{formatCurrency(mov.amount)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-xs truncate max-w-xs">
                          {mov.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openMovementModal(mov)}
                              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                              title="Editar Movimiento"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('¿Eliminar este movimiento de capital?')) {
                                  removeCapitalMovement(mov.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Eliminar Movimiento"
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
      )}

      {/* 4. Portfolio Filter Tabs & Compact 1-Line Subtle Summary Header */}
      <div className="space-y-3 pt-1">
        {/* Wallet Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedWalletId('ALL')}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold font-sans transition-all cursor-pointer whitespace-nowrap ${
              selectedWalletId === 'ALL'
                ? `${accent.bgClass} text-white shadow-xs`
                : isDark
                ? 'bg-[#2c2c2e]/70 text-slate-400 hover:text-white hover:bg-[#2c2c2e]'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todas las Carteras</span>
            <span className="rounded-md bg-black/25 px-1.5 py-0.2 text-[10px] font-mono">
              {positions.length}
            </span>
          </button>

          {wallets.map((w) => {
            const wPositionsCount = positions.filter((p) => (p.portfolioId || 'wallet_main') === w.id).length;
            const isSelected = selectedWalletId === w.id;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWalletId(w.id)}
                className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold font-sans transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? `${accent.bgClass} text-white shadow-xs`
                    : isDark
                    ? 'bg-[#2c2c2e]/70 text-slate-400 hover:text-white hover:bg-[#2c2c2e]'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: w.color || '#3b82f6' }}
                />
                <span>{w.name}</span>
                {w.brokerOrExchange && (
                  <span className="text-[10px] opacity-75 font-normal">
                    ({w.brokerOrExchange})
                  </span>
                )}
                <span className="rounded-md bg-black/25 px-1.5 py-0.2 text-[10px] font-mono">
                  {wPositionsCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* 1-Line Subtle Summary Header Bar per Portfolio / Selection */}
        <div
          className={`rounded-2xl border px-4 py-2.5 flex items-center justify-between flex-wrap gap-x-5 gap-y-2 text-xs transition-colors ${
            isDark
              ? 'border-slate-800/90 bg-[#232326] text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {currentSummaryMetrics.name}:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-xs">
            <div>
              <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Aportes: </span>
              <strong className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {formatCurrency(currentSummaryMetrics.netContributions)}
              </strong>
            </div>

            <div className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</div>

            <div>
              <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Rendimiento: </span>
              <strong
                className={`font-mono font-bold ${
                  currentSummaryMetrics.totalTradingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentSummaryMetrics.totalTradingPnl >= 0 ? '+' : ''}
                {formatCurrency(currentSummaryMetrics.totalTradingPnl)}
                {' '}({currentSummaryMetrics.totalTradingPnl >= 0 ? '+' : ''}
                {currentSummaryMetrics.returnOnCapitalPct.toFixed(1)}%)
              </strong>
            </div>

            <div className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</div>

            <div>
              <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Patrimonio: </span>
              <strong className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {formatCurrency(currentSummaryMetrics.totalPortfolioValue)}
              </strong>
            </div>

            <div className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</div>

            <div>
              <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Saldo Disponible: </span>
              <strong className="font-mono font-bold text-emerald-400">
                {formatCurrency(currentSummaryMetrics.availableCash)}
              </strong>
            </div>

            <div className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</div>

            <div>
              <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Posiciones: </span>
              <strong className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {currentSummaryMetrics.openCount}
              </strong>
              <span className={`font-sans text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}> abiertas</span>
              <span className={`font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}> / </span>
              <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {currentSummaryMetrics.closedCount}
              </span>
              <span className={`font-sans text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}> cerradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. POSICIONES ABIERTAS */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-colors space-y-4 ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3.5 border-slate-800/40">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className={`text-base font-bold font-sans tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Posiciones Abiertas ({displayedOpenPositions.length})
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Precios en vivo
          </span>
        </div>

        {displayedOpenPositions.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className={`text-sm font-bold font-sans ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {selectedWalletId === 'ALL'
                ? 'No tienes posiciones abiertas'
                : `No hay posiciones abiertas en ${currentSummaryMetrics.name}`}
            </h4>
            <p className={`text-xs max-w-md mx-auto font-sans leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Aplica oportunidades directamente desde el Screener o pulsa el botón &quot;+ Nueva Operación&quot; para registrar tu primera posición.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => openApplyModal(assets[0] || null)}
                className="rounded-2xl bg-blue-500 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-xs font-sans cursor-pointer"
              >
                + Nueva Operación
              </button>
              <button
                type="button"
                onClick={onOpenScreener}
                className={`rounded-2xl border px-4 py-2 text-xs font-bold font-sans transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-[#2c2c2e] text-slate-200 hover:bg-[#3a3a3c]'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Explorar Screener →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedOpenPositions.map((pos) => {
              const live = getLivePositionMetrics(pos, currentPrices);
              const isProfit = live.unrealizedPnlUSD >= 0;
              const posWallet = getWalletForPosition(pos);

              return (
                <div
                  key={pos.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50/80 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Symbol, Wallet Badge, Entry Date, Live Price */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-mono text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {pos.symbol}
                          </span>
                          <span className="rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase font-sans">
                            Abierta
                          </span>
                          {/* Wallet Badge */}
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold font-sans border"
                            style={{
                              borderColor: `${posWallet.color || '#3b82f6'}40`,
                              backgroundColor: `${posWallet.color || '#3b82f6'}15`,
                              color: posWallet.color || '#3b82f6',
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: posWallet.color || '#3b82f6' }} />
                            {posWallet.name}
                          </span>

                          {/* Purchase Lots Count Badge */}
                          <button
                            type="button"
                            onClick={() => openHistoryModal(pos)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 hover:bg-blue-500/25 transition-colors cursor-pointer"
                            title="Ver Historial de Compras y Ponderación"
                          >
                            <History className="h-2.5 w-2.5" />
                            <span>{pos.purchases?.length || 1} {(pos.purchases?.length || 1) === 1 ? 'compra' : 'compras DCA'}</span>
                          </button>
                        </div>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-sans block mt-0.5`}>
                          Entrada: <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{pos.entryDate}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-sans block`}>Precio Actual</span>
                        <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(live.currentPrice)}</span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-slate-800/40">
                      <div>
                        <span className={`text-[11px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>Capital Invertido:</span>
                        <span className={`font-mono font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{formatCurrency(pos.capitalAllocated)}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>Precio Promedio:</span>
                        <span className={`font-mono font-bold text-sm text-blue-400`}>${pos.entryPrice}</span>
                      </div>
                    </div>

                    {/* Live Unrealized PnL */}
                    <div className={`mt-3 flex items-center justify-between rounded-xl border p-2.5 ${
                      isProfit
                        ? isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
                        : isDark ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'
                    }`}>
                      <div className={`text-xs font-bold font-sans flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {isProfit ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
                        <span>P&L Flotante:</span>
                      </div>
                      <div className={`font-mono font-bold text-sm ${isProfit ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-700')}`}>
                        {isProfit ? '+' : ''}{formatCurrency(live.unrealizedPnlUSD)} ({isProfit ? '+' : ''}{live.unrealizedPnlPct}%)
                      </div>
                    </div>

                    {/* SL & TP Targets & Distances (Informativos - sin negrita) */}
                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`${isDark ? 'text-rose-400/90' : 'text-rose-600'} flex items-center gap-1.5 font-sans`}>
                          <Shield className="h-3.5 w-3.5" /> Stop Loss:
                        </span>
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {pos.stopLoss !== null ? `$${pos.stopLoss} (${live.distToSlPct !== null && live.distToSlPct >= 0 ? '+' : ''}${live.distToSlPct}%)` : 'Sin SL'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`${isDark ? 'text-emerald-400/90' : 'text-emerald-600'} flex items-center gap-1.5 font-sans`}>
                          <Target className="h-3.5 w-3.5" /> Take Profit:
                        </span>
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {pos.takeProfit !== null ? `$${pos.takeProfit} (${live.distToTpPct !== null && live.distToTpPct >= 0 ? '+' : ''}${live.distToTpPct}%)` : 'Sin TP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickClose(pos)}
                      className="flex-1 rounded-xl bg-blue-500/15 border border-blue-500/30 py-2 text-blue-400 hover:bg-blue-500/25 font-bold transition-all text-center font-sans cursor-pointer"
                    >
                      Cerrar Posición
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const matchingAsset = assets.find(
                          (a) =>
                            a.id === pos.assetId ||
                            a.symbol === pos.symbol ||
                            a.symbol.replace('/', '').replace('-', '').toUpperCase() ===
                              pos.symbol.replace('/', '').replace('-', '').toUpperCase()
                        );
                        openApplyModal(matchingAsset || null);
                      }}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                      title="Ponderar / Comprar más (DCA)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openHistoryModal(pos)}
                      className="rounded-xl border border-slate-700/80 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Ver Historial de Compras y Cálculo Ponderado"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openApplyModal(null, pos)}
                      className="rounded-xl border border-slate-700/80 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar Parámetros de la Posición"
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
                      className="rounded-xl border border-slate-700/80 p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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

      {/* 6. HISTORIAL DE OPERACIONES CERRADAS */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-colors space-y-4 ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3.5 border-slate-800/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <h3 className={`text-base font-bold font-sans tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Historial de Operaciones Cerradas ({displayedClosedPositions.length})
            </h3>
          </div>
          <span className="text-xs font-sans text-slate-400">
            PnL Realizado ({selectedWalletId === 'ALL' ? 'Total' : currentSummaryMetrics.name}): <strong className={`font-mono font-bold ${
              (selectedWalletId === 'ALL'
                ? realizedPnl
                : displayedClosedPositions.reduce((acc, p) => acc + (p.realizedPnl || 0), 0)) >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}>
              {(selectedWalletId === 'ALL'
                ? realizedPnl
                : displayedClosedPositions.reduce((acc, p) => acc + (p.realizedPnl || 0), 0)) >= 0 ? '+' : ''}
              {formatCurrency(
                selectedWalletId === 'ALL'
                  ? realizedPnl
                  : displayedClosedPositions.reduce((acc, p) => acc + (p.realizedPnl || 0), 0)
              )}
            </strong>
          </span>
        </div>

        {displayedClosedPositions.length === 0 ? (
          <p className={`text-xs py-6 text-center font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {selectedWalletId === 'ALL'
              ? 'Aún no tienes operaciones cerradas registradas.'
              : `No hay operaciones cerradas registradas en ${currentSummaryMetrics.name}.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider font-sans ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  <th className="py-3 px-3">Activo</th>
                  <th className="py-3 px-3">Cartera</th>
                  <th className="py-3 px-3">Fechas (Entrada / Salida)</th>
                  <th className="py-3 px-3 text-right">Capital</th>
                  <th className="py-3 px-3 text-right">Precios (Entrada → Salida)</th>
                  <th className="py-3 px-3 text-right">Resultado Realizado</th>
                  <th className="py-3 px-3 text-center">Motivo</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {displayedClosedPositions.map((pos) => {
                  const pnl = pos.realizedPnl || 0;
                  const pnlPct = pos.realizedPnlPct || 0;
                  const isProfit = pnl >= 0;
                  const posWallet = getWalletForPosition(pos);

                  return (
                    <tr key={pos.id} className={isDark ? 'hover:bg-[#2c2c2e]/30' : 'hover:bg-slate-50'}>
                      <td className={`py-3 px-3 font-bold text-sm font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {pos.symbol}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold font-sans border"
                          style={{
                            borderColor: `${posWallet.color || '#3b82f6'}40`,
                            backgroundColor: `${posWallet.color || '#3b82f6'}15`,
                            color: posWallet.color || '#3b82f6',
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: posWallet.color || '#3b82f6' }} />
                          {posWallet.name}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div>Entrada: <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{pos.entryDate}</span></div>
                        <div>Salida: <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{pos.exitDate || '-'}</span></div>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold text-xs ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {formatCurrency(pos.capitalAllocated)}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        ${pos.entryPrice} → <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>${pos.exitPrice}</strong>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                        isProfit ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')
                      }`}>
                        {isProfit ? '+' : ''}{formatCurrency(pnl)}
                        <span className="block text-[10px] font-mono">
                          ({isProfit ? '+' : ''}{pnlPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase font-sans ${
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
                            className="text-slate-400 hover:text-white p-1.5 transition-colors cursor-pointer"
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
                            className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
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

      {/* 7. Empty State if brand new */}
      {!hasAnyData && (
        <div
          className={`rounded-3xl border p-12 text-center transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500 mb-3">
            <Wallet className="h-8 w-8" />
          </div>
          <h3 className={`text-lg font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Comienza a llevar el control de tu Cartera Real
          </h3>
          <p className={`text-xs mt-1.5 max-w-md mx-auto font-sans leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Registra tu aporte inicial de capital, organiza tus carteras y brokers, o aplica operaciones directamente desde las señales generadas por QuantPulse Pro.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 font-sans">
            <button
              type="button"
              onClick={() => openMovementModal()}
              className="rounded-2xl bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-all cursor-pointer"
            >
              + Registrar Primer Aporte
            </button>
            <button
              type="button"
              onClick={openWalletModal}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-[#2c2c2e] text-slate-200 hover:bg-[#3a3a3c]'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Gestionar Mis Carteras
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
