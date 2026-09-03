'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '@/lib/types/market';
import { useAlerts } from '@/lib/context/alerts-context';
import { useSettings } from '@/lib/context/settings-context';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import {
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  Target,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface PriceAlertsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PriceAlertsModal({ asset, isOpen, onClose }: PriceAlertsModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const { addAlert, removeAlert, getAlertsForAsset } = useAlerts();

  const [targetPrice, setTargetPrice] = useState<string>('');
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [note, setNote] = useState<string>('');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Initialize form default price when asset opens
  useEffect(() => {
    if (asset) {
      const defaultSuggested =
        asset.analysis?.orderSetup.suggestedEntryPrice ||
        asset.analysis?.orderSetup.suggestedTakeProfit ||
        asset.price;
      setTargetPrice(defaultSuggested.toString());
      setDirection(defaultSuggested >= asset.price ? 'ABOVE' : 'BELOW');
      setNote('');
      setCreatedSuccess(false);
    }
  }, [asset]);

  if (!isOpen || !asset) {
    return null;
  }

  const assetAlerts = getAlertsForAsset(asset.id);
  const activeAlerts = assetAlerts.filter((a) => a.active && !a.triggeredAt);
  const triggeredAlerts = assetAlerts.filter((a) => !a.active || a.triggeredAt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Por favor ingresa un precio objetivo válido.');
      return;
    }

    addAlert(asset.id, asset.symbol, numPrice, direction, note);
    setCreatedSuccess(true);
    setNote('');

    // Reset success banner after 2.5 seconds
    setTimeout(() => {
      setCreatedSuccess(false);
    }, 2500);
  };

  const handleSetQuickPrice = (price: number, dir: 'ABOVE' | 'BELOW', quickNote?: string) => {
    setTargetPrice(price.toString());
    setDirection(dir);
    if (quickNote) {
      setNote(quickNote);
    }
  };

  const order = asset.analysis?.orderSetup;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col ${
          isDark ? 'border-slate-800 bg-[#1c1c1e] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4.5 ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{asset.symbol}</h3>
                <span
                  className={`rounded-lg border px-1.5 py-0.2 text-[10px] uppercase font-bold ${getAssetTypeBadgeStyle(
                    asset.type,
                    isDark
                  )}`}
                >
                  {asset.type}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Precio actual: <span className="font-mono font-bold text-blue-400">{formatCurrency(asset.price)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-2xl p-2 transition-colors ${
              isDark ? 'text-slate-400 hover:bg-[#3a3a3c] hover:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-horizontal-scrollbar">
          {/* 1. LIST OF CONFIGURED ALERTS FOR THIS ASSET */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Alertas Configuradas ({assetAlerts.length})
              </h4>
              {activeAlerts.length > 0 && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {activeAlerts.length} activa{activeAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {assetAlerts.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed p-5 text-center text-xs ${
                  isDark ? 'border-slate-800 text-slate-500 bg-[#2c2c2e]/20' : 'border-slate-200 text-slate-400 bg-slate-50'
                }`}
              >
                No tienes alertas configuradas para este activo. Crea tu primera alerta en el formulario de abajo.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {assetAlerts.map((alt) => {
                  const isAbove = alt.direction === 'ABOVE';
                  const isTriggered = !alt.active || !!alt.triggeredAt;

                  return (
                    <div
                      key={alt.id}
                      className={`flex items-center justify-between rounded-2xl border p-3 transition-all ${
                        isTriggered
                          ? isDark
                            ? 'border-slate-800/60 bg-[#2c2c2e]/30 opacity-70'
                            : 'border-slate-200 bg-slate-100/60 opacity-70'
                          : isDark
                          ? 'border-slate-800 bg-[#2c2c2e]/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                            isAbove
                              ? isDark
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDark
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isAbove ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">
                              {isAbove ? '≥ Sube por encima de' : '≤ Baja por debajo de'}
                            </span>
                            <span className="font-mono text-sm font-bold text-blue-400">
                              {formatCurrency(alt.targetPrice)}
                            </span>
                          </div>
                          {alt.note && (
                            <p className={`text-[11px] truncate max-w-[220px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              &quot;{alt.note}&quot;
                            </p>
                          )}
                          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isTriggered ? (
                              <span className="text-amber-500 font-semibold">
                                ✓ Disparada el {new Date(alt.triggeredAt || alt.createdAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>Creada el {new Date(alt.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAlert(alt.id)}
                        className={`rounded-xl p-1.5 transition-colors ${
                          isDark
                            ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
                            : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="Eliminar alerta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. FORM TO CREATE NEW PRICE ALERT */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-800/40">
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Crear Nueva Alerta
              </h4>
              {createdSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>¡Alerta creada con éxito!</span>
                </span>
              )}
            </div>

            {/* Quick Reference Pills from Quant Analysis */}
            {order && (
              <div>
                <span className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Niveles sugeridos por el análisis:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleSetQuickPrice(
                        order.suggestedEntryPrice,
                        order.suggestedEntryPrice >= asset.price ? 'ABOVE' : 'BELOW',
                        'Precio de Entrada Proyectado'
                      )
                    }
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-mono font-semibold transition-all ${
                      isDark
                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                        : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Entrada: {formatCurrency(order.suggestedEntryPrice)}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetQuickPrice(order.suggestedTakeProfit, 'ABOVE', 'Objetivo Take Profit')
                    }
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-mono font-semibold transition-all ${
                      isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Take Profit: {formatCurrency(order.suggestedTakeProfit)}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetQuickPrice(order.suggestedStopLoss, 'BELOW', 'Límite Stop Loss')
                    }
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-mono font-semibold transition-all ${
                      isDark
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Stop Loss: {formatCurrency(order.suggestedStopLoss)}
                  </button>
                </div>
              </div>
            )}

            {/* Target Price & Direction */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Precio Objetivo ($):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="ej. 68500"
                  className={`w-full rounded-2xl border px-3.5 py-2.5 font-mono text-sm font-bold transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Condición de Disparo:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDirection('ABOVE')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                      direction === 'ABOVE'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                        : isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Sube (≥)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirection('BELOW')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                      direction === 'BELOW'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40'
                        : isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Baja (≤)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nota Personal (Opcional):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ej. Nivel de soporte clave, comprar en retroceso"
                className={`w-full rounded-2xl border px-3.5 py-2 text-xs transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>

            {/* Create Button */}
            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all shadow-md ${
                accent.bgClass
              } text-white hover:opacity-90 active:scale-[0.99]`}
            >
              <Plus className="h-4 w-4" />
              <span>Crear Alerta de Precio</span>
            </button>
          </form>
        </div>

        {/* 3. MANDATORY LIMITATION NOTICE (SECTION 5) */}
        <div
          className={`border-t px-6 py-3.5 flex items-center gap-2 text-xs ${
            isDark ? 'border-slate-800 bg-[#121214] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'
          }`}
        >
          <Info className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="leading-tight text-[11px]">
            <strong>Aviso de funcionamiento:</strong> Las alertas solo funcionan mientras esta pestaña esté abierta en tu navegador. Si la cierras, no recibirás la notificación.
          </p>
        </div>
      </div>
    </div>
  );
}
