'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '@/lib/types/market';
import { RealPosition } from '@/lib/types/portfolio';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import {
  X,
  Wallet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';

interface ApplyPositionModalProps {
  asset?: Asset | null;
  existingPosition?: RealPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyPositionModal({
  asset,
  existingPosition,
  isOpen,
  onClose,
}: ApplyPositionModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const { openPosition, updatePosition } = usePortfolioContext();

  const isEditing = Boolean(existingPosition);
  const isClosed = existingPosition?.status === 'CLOSED';

  // Form states
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [capitalAllocated, setCapitalAllocated] = useState<string>('1000');
  const [useStopLoss, setUseStopLoss] = useState<boolean>(true);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(true);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>('');

  // Closed position edit fields
  const [exitPrice, setExitPrice] = useState<string>('');
  const [exitDate, setExitDate] = useState<string>('');
  const [closeReason, setCloseReason] = useState<'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL'>('MANUAL');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (existingPosition) {
      setEntryPrice(existingPosition.entryPrice.toString());
      setCapitalAllocated(existingPosition.capitalAllocated.toString());
      setUseStopLoss(existingPosition.stopLoss !== null);
      setStopLoss(existingPosition.stopLoss !== null ? existingPosition.stopLoss.toString() : '');
      setUseTakeProfit(existingPosition.takeProfit !== null);
      setTakeProfit(existingPosition.takeProfit !== null ? existingPosition.takeProfit.toString() : '');
      setEntryDate(existingPosition.entryDate);

      if (existingPosition.status === 'CLOSED') {
        setExitPrice(existingPosition.exitPrice !== undefined ? existingPosition.exitPrice.toString() : '');
        setExitDate(existingPosition.exitDate || '');
        setCloseReason(existingPosition.closeReason || 'MANUAL');
      }
    } else if (asset) {
      const suggestedEntry = asset.analysis?.orderSetup.suggestedEntryPrice ?? asset.price;
      const suggestedSL = asset.analysis?.orderSetup.suggestedStopLoss ?? suggestedEntry * 0.95;
      const suggestedTP = asset.analysis?.orderSetup.suggestedTakeProfit ?? suggestedEntry * 1.10;

      setEntryPrice(suggestedEntry.toString());
      setCapitalAllocated('1000');
      setUseStopLoss(true);
      setStopLoss(suggestedSL.toFixed(4));
      setUseTakeProfit(true);
      setTakeProfit(suggestedTP.toFixed(4));
      setEntryDate(new Date().toISOString().split('T')[0]);
      setExitPrice('');
      setExitDate('');
      setCloseReason('MANUAL');
    }
    setSavedSuccess(false);
  }, [existingPosition, asset, isOpen]);

  if (!isOpen) return null;

  const symbol = existingPosition?.symbol ?? asset?.symbol ?? 'ACTIVO';
  const assetName = asset?.name ?? (existingPosition ? `Posición ${existingPosition.symbol}` : '');
  const assetType = asset?.type ?? 'crypto';

  const order = asset?.analysis?.orderSetup;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ep = parseFloat(entryPrice);
    const cap = parseFloat(capitalAllocated);
    const sl = useStopLoss && stopLoss ? parseFloat(stopLoss) : null;
    const tp = useTakeProfit && takeProfit ? parseFloat(takeProfit) : null;

    if (isNaN(ep) || ep <= 0 || isNaN(cap) || cap <= 0) return;

    if (isEditing && existingPosition) {
      const changes: Partial<RealPosition> = {
        entryPrice: ep,
        capitalAllocated: cap,
        stopLoss: sl,
        takeProfit: tp,
        entryDate,
      };

      if (isClosed && exitPrice) {
        changes.exitPrice = parseFloat(exitPrice);
        changes.exitDate = exitDate;
        changes.closeReason = closeReason;
      }

      updatePosition(existingPosition.id, changes);
    } else if (asset) {
      openPosition(
        { id: asset.id, symbol: asset.symbol },
        ep,
        cap,
        sl,
        tp,
        order
          ? {
              suggestedEntryPrice: order.suggestedEntryPrice,
              suggestedStopLoss: order.suggestedStopLoss,
              suggestedTakeProfit: order.suggestedTakeProfit,
            }
          : undefined,
        entryDate
      );
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* 1. Modal Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isDark ? 'border-slate-800 bg-[#121214]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight">{symbol}</h3>
                <span
                  className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                    assetType,
                    isDark
                  )}`}
                >
                  {assetType}
                </span>
                {isClosed && (
                  <span className="rounded-md bg-slate-500/20 border border-slate-500/30 px-1.5 py-0.2 text-[9px] font-bold text-slate-400 uppercase">
                    Cerrada
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEditing ? (isClosed ? 'Editar Operación Cerrada' : 'Editar Posición Abierta') : 'Aplicar Operación en Mi Cartera'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-2 transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{isEditing ? '¡Cambios guardados con éxito!' : '¡Posición registrada en Mi Cartera!'}</span>
            </div>
          )}

          {/* Quick Suggested Reference Pills (if creating from asset analysis) */}
          {!isEditing && order && (
            <div className={`rounded-2xl border p-3 space-y-1.5 ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Valores sugeridos por el algoritmo:</span>
                <span className="text-blue-500 font-bold">Auto-completados</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="text-blue-400 font-bold">Entrada: ${order.suggestedEntryPrice}</span>
                <span className="text-emerald-400 font-bold">TP: ${order.suggestedTakeProfit} (+{order.suggestedTakeProfitPct}%)</span>
                <span className="text-rose-400 font-bold">SL: ${order.suggestedStopLoss} (-{order.suggestedStopLossPct}%)</span>
              </div>
            </div>
          )}

          {/* Row 1: Entry Price & Capital Allocated */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Precio de Entrada ($):
              </label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="ej. 75000"
                className={`w-full rounded-2xl border px-3.5 py-2.5 font-mono text-sm font-bold transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Capital Invertido ($ USD):
              </label>
              <input
                type="number"
                step="any"
                required
                value={capitalAllocated}
                onChange={(e) => setCapitalAllocated(e.target.value)}
                placeholder="ej. 1000"
                className={`w-full rounded-2xl border px-3.5 py-2.5 font-mono text-sm font-bold transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          {/* Row 2: Stop Loss & Take Profit */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Stop Loss with optional toggle */}
            <div className={`rounded-2xl border p-3 space-y-2 ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Stop Loss ($)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useStopLoss}
                    onChange={(e) => setUseStopLoss(!e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sin SL</span>
                </label>
              </div>
              <input
                type="number"
                step="any"
                disabled={!useStopLoss}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={useStopLoss ? "ej. 71500" : "Sin Stop Loss"}
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-colors ${
                  !useStopLoss
                    ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-transparent'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-rose-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-rose-500 focus:outline-none'
                }`}
              />
            </div>

            {/* Take Profit with optional toggle */}
            <div className={`rounded-2xl border p-3 space-y-2 ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Take Profit ($)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useTakeProfit}
                    onChange={(e) => setUseTakeProfit(!e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sin TP</span>
                </label>
              </div>
              <input
                type="number"
                step="any"
                disabled={!useTakeProfit}
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder={useTakeProfit ? "ej. 82000" : "Sin Take Profit"}
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-colors ${
                  !useTakeProfit
                    ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-transparent'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-emerald-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          {/* Row 3: Entry Date */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Fecha de Entrada:
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={`w-full rounded-2xl border px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* If editing a CLOSED position, show editable exit fields */}
          {isClosed && (
            <div className={`rounded-2xl border p-4 space-y-3 ${
              isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span>Corrección de Datos de Cierre Real</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Precio de Salida ($):
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha de Salida:
                  </label>
                  <input
                    type="date"
                    required
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Motivo de Cierre:
                  </label>
                  <select
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value as any)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  >
                    <option value="TAKE_PROFIT">Take Profit</option>
                    <option value="STOP_LOSS">Stop Loss</option>
                    <option value="MANUAL">Cierre Manual</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all shadow-md ${
              accent.bgClass
            } text-white hover:opacity-90 active:scale-[0.99]`}
          >
            <Wallet className="h-4 w-4" />
            <span>{isEditing ? 'Guardar Cambios' : 'Registrar Operación en Mi Cartera'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
