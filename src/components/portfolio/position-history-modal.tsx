'use client';

import React, { useState, useMemo } from 'react';
import { RealPosition, PositionPurchaseLot } from '@/lib/types/portfolio';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import { calculateWeightedAveragePosition } from '@/lib/utils/weighted-average';
import {
  X,
  History,
  Calculator,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Coins,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface PositionHistoryModalProps {
  position: RealPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionHistoryModal({
  position,
  isOpen,
  onClose,
}: PositionHistoryModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const {
    wallets,
    addPurchaseToPosition,
    removePurchaseFromPosition,
    getWalletAvailableCapital,
    openApplyModal,
  } = usePortfolioContext();

  // Local state for inline quick add tranche
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newCapital, setNewCapital] = useState('500');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');

  const wallet = useMemo(() => {
    if (!position) return null;
    return wallets.find((w) => w.id === position.portfolioId) || wallets[0];
  }, [wallets, position]);

  const availableCapitalInWallet = useMemo(() => {
    if (!wallet) return 0;
    return getWalletAvailableCapital(wallet.id);
  }, [getWalletAvailableCapital, wallet]);

  // Compute detailed lots and weighted calculation
  const lots: PositionPurchaseLot[] = useMemo(() => {
    if (!position) return [];
    if (position.purchases && position.purchases.length > 0) {
      return position.purchases;
    }
    // Fallback for single purchase positions
    return [
      {
        id: `lot_${position.id}_init`,
        date: position.entryDate,
        price: position.entryPrice,
        capitalAllocated: position.capitalAllocated,
        shares: position.entryPrice > 0 ? position.capitalAllocated / position.entryPrice : 0,
        note: 'Compra inicial',
      },
    ];
  }, [position]);

  const calculation = useMemo(() => {
    return calculateWeightedAveragePosition(lots);
  }, [lots]);

  if (!isOpen || !position) return null;

  const handleAddLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);
    const capNum = parseFloat(newCapital);

    if (isNaN(priceNum) || priceNum <= 0 || isNaN(capNum) || capNum <= 0) {
      alert('Por favor ingresa un precio y monto válidos.');
      return;
    }

    if (capNum > availableCapitalInWallet) {
      alert(`El monto ingresado ($${capNum.toFixed(2)}) supera el capital disponible en la cartera ($${availableCapitalInWallet.toFixed(2)}).`);
      return;
    }

    addPurchaseToPosition(
      position.id,
      {
        price: priceNum,
        capitalAllocated: capNum,
        date: newDate,
        note: newNote.trim() || undefined,
      }
    );

    setIsAddingLot(false);
    setNewPrice('');
    setNewCapital('500');
    setNewNote('');
  };

  const handleRemoveLot = (lotId: string) => {
    if (lots.length <= 1) {
      alert('Una posición debe conservar al menos un registro de compra.');
      return;
    }
    if (confirm('¿Deseas eliminar este lote de compra? El precio promedio ponderado se recalculará automáticamente.')) {
      removePurchaseFromPosition(position.id, lotId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col ${
          isDark ? 'border-slate-800 bg-[#1c1c1e] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-5 border-b ${isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm text-white"
                style={{ backgroundColor: accent.hex }}
              >
                <History className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base tracking-tight">Historial de Compras & Ponderación</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    position.status === 'OPEN'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}>
                    {position.status === 'OPEN' ? 'Posición Abierta' : 'Cerrada'}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Activo: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{position.symbol}</strong> • Cartera: <span className="font-semibold">{wallet?.name || 'Cartera 1'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${
                isDark ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-horizontal-scrollbar">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#242426] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Precio Promedio Ponderado
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono tracking-tight text-blue-500">
                  ${calculation.weightedAveragePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">USD</span>
              </div>
              <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {lots.length} {lots.length === 1 ? 'lote de compra' : 'lotes ponderados (DCA)'}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#242426] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Capital Total Invertido
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono tracking-tight">
                  ${calculation.totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">USD</span>
              </div>
              <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Suma de todos los lotes
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#242426] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Acciones / Unidades
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono tracking-tight text-purple-400">
                  {calculation.totalShares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">uds</span>
              </div>
              <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Acumulado total de posición
              </span>
            </div>
          </div>

          {/* Mathematical Formula Explanation Card */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border-blue-900/40' : 'bg-blue-50/70 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Fórmula del Precio Promedio Ponderado (DCA)
              </h4>
            </div>
            <div className={`p-3 rounded-xl font-mono text-xs border ${
              isDark ? 'bg-black/40 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="text-center font-bold text-[13px] text-blue-400 mb-1">
                Precio Ponderado = Capital Total ÷ Total Unidades
              </div>
              <div className="text-[11px] text-center text-slate-400">
                ${calculation.totalCapital.toFixed(2)} USD ÷ {calculation.totalShares.toFixed(4)} uds = <strong className="text-emerald-400">${calculation.weightedAveragePrice.toFixed(4)} USD</strong>
              </div>
            </div>
            <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Cada compra aporta unidades calculadas como <code>(Capital ÷ Precio)</code>. El promedio no es un promedio simple de precios, sino un promedio ponderado por el capital real invertido en cada momento.
            </p>
          </div>

          {/* Purchases History Table / List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Desglose de Compras ({lots.length})
                </h4>
              </div>
              {position.status === 'OPEN' && !isAddingLot && (
                <button
                  onClick={() => {
                    setIsAddingLot(true);
                    setNewPrice(position.entryPrice.toString());
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: accent.hex }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Agregar Compra (DCA)</span>
                </button>
              )}
            </div>

            {/* Inline Add Tranche Form */}
            {isAddingLot && (
              <form
                onSubmit={handleAddLotSubmit}
                className={`p-4 rounded-2xl border mb-3 animate-fade-in ${
                  isDark ? 'bg-[#242426] border-blue-500/40' : 'bg-blue-50/50 border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Registrar Nueva Compra en {position.symbol}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingLot(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Precio de Compra (USD)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="ej. 85.50"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className={`w-full rounded-xl border p-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                        isDark ? 'border-slate-700 bg-[#1c1c1e] text-white focus:border-blue-500' : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Monto Invertido (USD)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="ej. 500"
                      value={newCapital}
                      onChange={(e) => setNewCapital(e.target.value)}
                      className={`w-full rounded-xl border p-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                        isDark ? 'border-slate-700 bg-[#1c1c1e] text-white focus:border-blue-500' : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Fecha de Compra
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className={`w-full rounded-xl border p-2 text-xs font-medium focus:outline-none focus:ring-2 ${
                        isDark ? 'border-slate-700 bg-[#1c1c1e] text-white focus:border-blue-500' : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-2.5">
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Nota u Objetivo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Aporte mensual DCA, Compra en soporte, Rebalanceo..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className={`w-full rounded-xl border p-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark ? 'border-slate-700 bg-[#1c1c1e] text-white focus:border-blue-500' : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLot(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Guardar y Recalcular Ponderado
                  </button>
                </div>
              </form>
            )}

            {/* List of Lots */}
            <div className="space-y-2">
              {calculation.lots.map((lot, idx) => (
                <div
                  key={lot.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isDark ? 'bg-[#242426] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs font-mono ${
                      isDark ? 'bg-[#2c2c2e] text-blue-400 border border-slate-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono">
                          ${lot.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">/ acción</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {lot.weightPct.toFixed(1)}% del capital
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {lot.date}
                        </span>
                        {lot.note && <span>• {lot.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="font-bold text-xs font-mono">
                        ${lot.capitalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {lot.shares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} uds
                      </div>
                    </div>

                    {position.status === 'OPEN' && calculation.lots.length > 1 && (
                      <button
                        onClick={() => handleRemoveLot(lot.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Eliminar este lote de compra"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50'
        }`}>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Posición ID: <code className="font-mono text-[10px]">{position.id}</code>
          </span>
          <button
            onClick={onClose}
            style={{ backgroundColor: accent.hex }}
            className="rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
