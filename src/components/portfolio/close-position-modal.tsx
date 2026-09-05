'use client';

import React, { useState, useEffect } from 'react';
import { Asset, AssetType } from '@/lib/types/market';
import { RealPosition } from '@/lib/types/portfolio';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle, getAssetTypeLabel } from '@/lib/ui/badge-styles';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Edit3,
  Check,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: RealPosition | null;
  currentPrice: number;
  walletName?: string;
  asset?: Asset | null;
  onConfirmClose: (
    positionId: string,
    exitPrice: number,
    closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL',
    exitDate?: string
  ) => void;
}

export function ClosePositionModal({
  isOpen,
  onClose,
  position,
  currentPrice,
  walletName,
  asset,
  onConfirmClose,
}: ClosePositionModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [closeMode, setCloseMode] = useState<'MARKET' | 'MANUAL'>('MARKET');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [closeReason, setCloseReason] = useState<'MANUAL' | 'TAKE_PROFIT' | 'STOP_LOSS'>('MANUAL');
  const [customDate, setCustomDate] = useState<string>('');

  // Reset/Initialize state when position opens
  useEffect(() => {
    if (position && isOpen) {
      setCloseMode('MARKET');
      setCustomPrice(currentPrice > 0 ? currentPrice.toString() : position.entryPrice.toString());
      setCloseReason('MANUAL');
      setCustomDate(new Date().toISOString().split('T')[0]);
    }
  }, [position, isOpen, currentPrice]);

  if (!isOpen || !position) return null;

  const shares =
    position.totalShares ||
    (position.entryPrice > 0 ? position.capitalAllocated / position.entryPrice : 0);

  const assetType: AssetType = asset?.type || 'crypto';

  const effectivePrice =
    closeMode === 'MARKET' ? currentPrice : parseFloat(customPrice) || 0;

  const pnlPct =
    position.entryPrice > 0
      ? ((effectivePrice - position.entryPrice) / position.entryPrice) * 100
      : 0;

  const pnlUSD = (pnlPct / 100) * position.capitalAllocated;
  const returnedCapital = position.capitalAllocated + pnlUSD;
  const isProfit = pnlUSD >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectivePrice <= 0) return;

    onConfirmClose(position.id, effectivePrice, closeReason, customDate || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4 border-slate-800/40">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-sans tracking-tight">
                  Cerrar Posición: {position.symbol}
                </h3>
                {asset && (
                  <span
                    className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                      assetType,
                      isDark
                    )}`}
                  >
                    {getAssetTypeLabel(assetType)}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {asset?.name || position.symbol} • Cartera: <strong>{walletName || 'Principal'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mode Selector: Mercado vs Manual */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ¿Cómo deseas registrar el precio de cierre?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCloseMode('MARKET')}
                className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  closeMode === 'MARKET'
                    ? `${accent.borderClass} ${accent.tintBgClass} ring-1 ${accent.ringClass}`
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] text-slate-400'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    <span className={`text-xs font-bold ${closeMode === 'MARKET' ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                      Precio de Mercado
                    </span>
                  </div>
                  {closeMode === 'MARKET' && (
                    <Check className={`h-3.5 w-3.5 ${accent.textClass}`} />
                  )}
                </div>
                <span className="font-mono text-xs font-bold mt-1 text-emerald-400">
                  ${currentPrice.toFixed(2)} (En vivo)
                </span>
                <span className="text-[10px] opacity-70 mt-0.5 font-sans">
                  Precio actual de cotización
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCloseMode('MANUAL');
                  if (!customPrice || parseFloat(customPrice) <= 0) {
                    setCustomPrice(currentPrice.toString());
                  }
                }}
                className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  closeMode === 'MANUAL'
                    ? `${accent.borderClass} ${accent.tintBgClass} ring-1 ${accent.ringClass}`
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] text-slate-400'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                    <span className={`text-xs font-bold ${closeMode === 'MANUAL' ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                      Precio Manual
                    </span>
                  </div>
                  {closeMode === 'MANUAL' && (
                    <Check className={`h-3.5 w-3.5 ${accent.textClass}`} />
                  )}
                </div>
                <span className={`font-mono text-xs font-bold mt-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  Personalizado
                </span>
                <span className="text-[10px] opacity-70 mt-0.5 font-sans">
                  Para ejecuciones previas (TP/SL)
                </span>
              </button>
            </div>
          </div>

          {/* Manual Input Fields (Shown when in MANUAL mode) */}
          {closeMode === 'MANUAL' && (
            <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDark ? 'border-slate-800 bg-[#242426]/70' : 'border-slate-200 bg-slate-50'
            }`}>
              {/* Custom Exit Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Precio Real de Ejecución ($):
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Entrada: ${position.entryPrice}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Ej. 105.50"
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-mono font-bold focus:outline-none transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-[#1c1c1e] text-white focus:border-blue-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                  }`}
                />

                {/* Quick Presets Shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-sans">Autocompletar:</span>
                  {position.takeProfit !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPrice(position.takeProfit!.toString());
                        setCloseReason('TAKE_PROFIT');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      <Target className="h-3 w-3" />
                      TP: ${position.takeProfit}
                    </button>
                  )}
                  {position.stopLoss !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPrice(position.stopLoss!.toString());
                        setCloseReason('STOP_LOSS');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      SL: ${position.stopLoss}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPrice(currentPrice.toString());
                      setCloseReason('MANUAL');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700/30 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300 hover:bg-slate-700/50 cursor-pointer"
                  >
                    Mercado: ${currentPrice.toFixed(2)}
                  </button>
                </div>
              </div>

              {/* Motivo de Cierre & Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Motivo de Cierre:
                  </label>
                  <select
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value as 'MANUAL' | 'TAKE_PROFIT' | 'STOP_LOSS')}
                    className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-sans focus:outline-none cursor-pointer ${
                      isDark
                        ? 'border-slate-700 bg-[#1c1c1e] text-white [&>option]:bg-[#1c1c1e]'
                        : 'border-slate-300 bg-white text-slate-900 [&>option]:bg-white'
                    }`}
                  >
                    <option value="MANUAL">Cierre Manual (Discrecional)</option>
                    <option value="TAKE_PROFIT">Take Profit (Objetivo alcanzado)</option>
                    <option value="STOP_LOSS">Stop Loss (Corte de pérdida)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha de Salida:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-sans focus:outline-none cursor-pointer ${
                        isDark
                          ? 'border-slate-700 bg-[#1c1c1e] text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Result Preview Summary Box */}
          <div
            className={`rounded-2xl border p-3.5 transition-all ${
              isProfit
                ? isDark
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
                : isDark
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-rose-300 bg-rose-50/80 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-sans font-bold flex items-center gap-1.5">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span>Resumen de Liquidación</span>
              </span>
              <span className="text-[10px] font-mono opacity-75">
                {shares.toFixed(2)} unidades
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-current/15 text-xs font-mono">
              <div>
                <span className="text-[10px] block opacity-75 font-sans">Capital Invertido:</span>
                <strong className="font-bold">{formatCurrency(position.capitalAllocated)}</strong>
              </div>

              <div>
                <span className="text-[10px] block opacity-75 font-sans">Precio Salida:</span>
                <strong className="font-bold">${effectivePrice.toFixed(2)}</strong>
              </div>

              <div>
                <span className="text-[10px] block opacity-75 font-sans">PnL Realizado:</span>
                <strong className={`font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isProfit ? '+' : ''}{formatCurrency(pnlUSD)} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                </strong>
              </div>

              <div>
                <span className="text-[10px] block opacity-75 font-sans">Efectivo Retornado:</span>
                <strong className="font-bold text-emerald-500">{formatCurrency(returnedCapital)}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold font-sans transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={effectivePrice <= 0}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold font-sans text-white transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isProfit
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>
                Confirmar Cierre (${effectivePrice > 0 ? effectivePrice.toFixed(2) : '0.00'})
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
