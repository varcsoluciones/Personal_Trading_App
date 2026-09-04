'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import {
  X,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Edit2,
} from 'lucide-react';

interface CapitalMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CapitalMovementModal({ isOpen, onClose }: CapitalMovementModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const {
    wallets,
    editingMovement,
    addCapitalMovement,
    updateCapitalMovement,
    transferBetweenWallets,
    getWalletAvailableCapital,
  } = usePortfolioContext();

  const isEditing = Boolean(editingMovement);

  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'TRANSFER'>('DEPOSIT');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize form state whenever modal opens or editingMovement changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingMovement) {
      setType(editingMovement.type);
      setSelectedWalletId(editingMovement.portfolioId || wallets[0]?.id || 'wallet_main');
      const fallbackTarget = wallets.find((w) => w.id !== editingMovement.portfolioId) || wallets[0];
      setTargetWalletId(editingMovement.targetPortfolioId || fallbackTarget?.id || 'wallet_main');
      setAmount(Math.abs(editingMovement.amount).toString());
      setNote(editingMovement.note || '');
      setDate(editingMovement.date || new Date().toISOString().split('T')[0]);
    } else {
      setType('DEPOSIT');
      setSelectedWalletId(wallets[0]?.id || 'wallet_main');
      const nextWallet = wallets.find((w) => w.id !== wallets[0]?.id) || wallets[0];
      setTargetWalletId(nextWallet?.id || wallets[0]?.id || 'wallet_main');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, editingMovement, wallets]);

  if (!isOpen) return null;

  const rawAvailable = getWalletAvailableCapital(selectedWalletId);

  // If editing an existing withdrawal/transfer, add back its previous deduction to available liquidity
  const originAvailable = useMemo(() => {
    if (isEditing && editingMovement && editingMovement.portfolioId === selectedWalletId) {
      if (editingMovement.type === 'WITHDRAWAL' || editingMovement.type === 'TRANSFER') {
        return rawAvailable + Math.abs(editingMovement.amount);
      }
    }
    return rawAvailable;
  }, [isEditing, editingMovement, selectedWalletId, rawAvailable]);

  const numAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numAmount) && numAmount > 0;
  const isTransferExceeding = type === 'TRANSFER' && isAmountValid && numAmount > originAvailable;
  const isSameWalletTransfer = type === 'TRANSFER' && selectedWalletId === targetWalletId;
  const isWithdrawalExceeding = type === 'WITHDRAWAL' && isAmountValid && numAmount > originAvailable;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid) return;
    if (isTransferExceeding || isSameWalletTransfer || isWithdrawalExceeding) return;

    if (isEditing && editingMovement) {
      updateCapitalMovement(editingMovement.id, {
        type,
        amount: numAmount,
        note: note.trim() || undefined,
        date,
        portfolioId: selectedWalletId,
        targetPortfolioId: type === 'TRANSFER' ? targetWalletId : undefined,
      });
    } else if (type === 'TRANSFER') {
      transferBetweenWallets(selectedWalletId, targetWalletId, numAmount, note, date);
    } else {
      addCapitalMovement(type, numAmount, note, date, selectedWalletId);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setAmount('');
      setNote('');
      onClose();
    }, 450);
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
        {/* Header */}
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
              {isEditing ? <Edit2 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                {isEditing ? 'Editar Movimiento de Capital' : 'Registrar Movimiento'}
              </h3>
              <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEditing
                  ? 'Modifica los valores, cartera o nota de este registro'
                  : 'Aporte, retiro, ajuste o transferencia entre carteras'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-2 transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold font-sans animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {isEditing
                  ? '¡Cambios guardados con éxito!'
                  : type === 'TRANSFER'
                  ? '¡Transferencia registrada con éxito!'
                  : '¡Movimiento guardado con éxito!'}
              </span>
            </div>
          )}

          {/* Type Selector Tabs (4 Tabs) */}
          <div>
            <label className={`block text-xs font-bold font-sans mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Movimiento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('DEPOSIT')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'DEPOSIT'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isDark
                    ? 'border border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>Depósito</span>
              </button>

              <button
                type="button"
                onClick={() => setType('WITHDRAWAL')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'WITHDRAWAL'
                    ? 'bg-rose-500 text-white shadow-md'
                    : isDark
                    ? 'border border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Retiro</span>
              </button>

              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'TRANSFER'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isDark
                    ? 'border border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Transferir</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'ADJUSTMENT'
                    ? 'bg-blue-500 text-white shadow-md'
                    : isDark
                    ? 'border border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          {/* Description banner depending on type */}
          <div
            className={`rounded-2xl border p-3 text-xs leading-relaxed transition-colors ${
              type === 'DEPOSIT'
                ? isDark ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : type === 'WITHDRAWAL'
                ? isDark ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-800'
                : type === 'TRANSFER'
                ? isDark ? 'border-purple-500/20 bg-purple-500/10 text-purple-300' : 'border-purple-200 bg-purple-50 text-purple-800'
                : isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {type === 'DEPOSIT' && '🟢 Los depósitos suman capital propio real a la cartera elegida.'}
            {type === 'WITHDRAWAL' && '🔴 Los retiros descuentan fondos propios retirados hacia tu banco o cuenta externa.'}
            {type === 'TRANSFER' && '🟣 Las transferencias mueven liquidez disponible entre tus carteras sin alterar tus aportes netos globales.'}
            {type === 'ADJUSTMENT' && '🔵 Los ajustes sincronizan manualmente el balance para comisiones, rendimientos directos o intereses.'}
          </div>

          {/* Wallet Selectors */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin Wallet */}
              <div>
                <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Cartera Origen (Sale dinero):
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-purple-500 focus:outline-none'
                      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-purple-500 focus:outline-none'
                  }`}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 font-sans block mt-1">
                  Disp. origen: <strong className="font-mono text-emerald-400">{formatCurrency(originAvailable)}</strong>
                </span>
              </div>

              {/* Destination Wallet */}
              <div>
                <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Cartera Destino (Entra dinero):
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-purple-500 focus:outline-none'
                      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-purple-500 focus:outline-none'
                  }`}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''} {w.id === selectedWalletId ? '(Origen)' : ''}
                    </option>
                  ))}
                </select>
                {isSameWalletTransfer && (
                  <span className="text-[11px] text-rose-400 font-sans font-bold block mt-1">
                    Selecciona una cartera destino distinta
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Cartera / Subcuenta afectada:
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              >
                {wallets.map((w) => {
                  const wAvail = getWalletAvailableCapital(w.id);
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''}
                    </option>
                  );
                })}
              </select>
              <span className="text-[11px] text-slate-400 font-sans block mt-1">
                Saldo disponible actual: <strong className="font-mono text-emerald-400">{formatCurrency(originAvailable)}</strong>
              </span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Monto en Dólares (USD):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400 font-bold">
                $
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ej. 1000"
                className={`w-full rounded-2xl border pl-8 pr-3.5 py-2.5 font-mono text-base font-bold transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>
            {isTransferExceeding && (
              <span className="text-[11px] text-rose-400 font-sans font-bold block mt-1">
                El monto excede el saldo disponible en la cartera origen ({formatCurrency(originAvailable)})
              </span>
            )}
            {isWithdrawalExceeding && (
              <span className="text-[11px] text-rose-400 font-sans font-bold block mt-1">
                El retiro excede la liquidez libre en esta cartera ({formatCurrency(originAvailable)})
              </span>
            )}
          </div>

          {/* Date */}
          <div>
            <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Fecha del Movimiento:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full rounded-2xl border px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Note */}
          <div>
            <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Nota / Detalle (Opcional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === 'TRANSFER'
                  ? 'ej. Transferencia mensual de liquidez para operar cripto'
                  : 'ej. Aporte inicial IBKR, depósito wire, etc.'
              }
              className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-sans transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isTransferExceeding || isSameWalletTransfer || isWithdrawalExceeding}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold font-sans transition-all shadow-md ${
              isTransferExceeding || isSameWalletTransfer || isWithdrawalExceeding
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                : type === 'TRANSFER'
                ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                : `${accent.bgClass} text-white hover:opacity-90 active:scale-[0.99] cursor-pointer`
            }`}
          >
            <span>
              {isEditing
                ? 'Guardar Cambios'
                : type === 'TRANSFER'
                ? 'Confirmar Transferencia entre Carteras'
                : 'Guardar Movimiento'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
