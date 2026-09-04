'use client';

import React, { useState, useEffect } from 'react';
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
    addCapitalMovement,
    transferBetweenWallets,
    getWalletAvailableCapital,
  } = usePortfolioContext();

  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'TRANSFER'>('DEPOSIT');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize selected wallets when opened or wallets change
  useEffect(() => {
    if (wallets.length > 0) {
      if (!selectedWalletId || !wallets.some((w) => w.id === selectedWalletId)) {
        setSelectedWalletId(wallets[0].id);
      }
      if (!targetWalletId || targetWalletId === wallets[0]?.id) {
        const nextWallet = wallets.find((w) => w.id !== wallets[0].id) || wallets[0];
        setTargetWalletId(nextWallet.id);
      }
    }
  }, [wallets, selectedWalletId, targetWalletId, isOpen]);

  if (!isOpen) return null;

  const originAvailable = getWalletAvailableCapital(selectedWalletId);
  const numAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numAmount) && numAmount > 0;
  const isTransferExceeding = type === 'TRANSFER' && isAmountValid && numAmount > originAvailable;
  const isSameWalletTransfer = type === 'TRANSFER' && selectedWalletId === targetWalletId;
  const isWithdrawalExceeding = type === 'WITHDRAWAL' && isAmountValid && numAmount > originAvailable;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid) return;
    if (isTransferExceeding || isSameWalletTransfer || isWithdrawalExceeding) return;

    if (type === 'TRANSFER') {
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
    }, 500);
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
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans tracking-tight">Registrar Movimiento</h3>
              <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Aporte, retiro, ajuste o transferencia entre carteras
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
              <span>{type === 'TRANSFER' ? '¡Transferencia registrada con éxito!' : '¡Movimiento guardado con éxito!'}</span>
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
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'DEPOSIT'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>Depósito</span>
              </button>

              <button
                type="button"
                onClick={() => setType('WITHDRAWAL')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'WITHDRAWAL'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Retiro</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'ADJUSTMENT'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ajuste</span>
              </button>

              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold font-sans transition-all cursor-pointer ${
                  type === 'TRANSFER'
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-slate-400 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Transferir</span>
              </button>
            </div>
          </div>

          {/* Wallet Selector(s) */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin Wallet */}
              <div
                className={`rounded-2xl border p-3.5 space-y-1.5 ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Desde Cartera (Origen):
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Disp: {formatCurrency(originAvailable)}
                  </span>
                </div>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold font-sans transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-purple-500 focus:outline-none'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-purple-500 focus:outline-none'
                  }`}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Wallet */}
              <div
                className={`rounded-2xl border p-3.5 space-y-1.5 ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Hacia Cartera (Destino):
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Disp: {formatCurrency(getWalletAvailableCapital(targetWalletId))}
                  </span>
                </div>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold font-sans transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-purple-500 focus:outline-none'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-purple-500 focus:outline-none'
                  }`}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === selectedWalletId}>
                      {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''} {w.id === selectedWalletId ? '(Origen)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Single Wallet Selector for Deposit/Withdrawal/Adjustment */
            <div
              className={`rounded-2xl border p-3.5 space-y-1.5 ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Cartera Afectada:
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Saldo Disp: {formatCurrency(originAvailable)}
                </span>
              </div>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-bold font-sans transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Validation Warnings */}
          {isTransferExceeding && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-center gap-2 text-rose-300 text-xs font-sans">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>El monto a transferir ({formatCurrency(numAmount)}) supera el saldo disponible de la cartera origen ({formatCurrency(originAvailable)}).</span>
            </div>
          )}

          {isWithdrawalExceeding && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-center gap-2 text-rose-300 text-xs font-sans">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>El monto a retirar ({formatCurrency(numAmount)}) supera el saldo disponible de la cartera ({formatCurrency(originAvailable)}).</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Monto ($ USD):
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ej. 5000"
              className={`w-full rounded-2xl border px-3.5 py-2.5 font-mono text-sm font-bold transition-colors ${
                isTransferExceeding || isWithdrawalExceeding
                  ? 'border-rose-500 bg-rose-500/10 text-rose-400 focus:outline-none'
                  : isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
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
              {type === 'TRANSFER'
                ? 'Confirmar Transferencia entre Carteras'
                : 'Guardar Movimiento'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
