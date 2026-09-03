'use client';

import React, { useState } from 'react';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import {
  X,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface CapitalMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CapitalMovementModal({ isOpen, onClose }: CapitalMovementModalProps) {
  const { settings, accent } = useSettings();
  const isDark = settings.theme === 'dark';
  const { addCapitalMovement } = usePortfolioContext();

  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'>('DEPOSIT');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    addCapitalMovement(type, num, note, date);
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
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
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
              <h3 className="text-base font-bold tracking-tight">Registrar Movimiento</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Aporte, retiro o ajuste de capital de tu cuenta
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>¡Movimiento guardado con éxito!</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Movimiento:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('DEPOSIT')}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
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
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
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
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
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
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Date */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Fecha:
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
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Nota Personal (Opcional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ej. Aporte inicial IBKR, transferencia mensual"
              className={`w-full rounded-2xl border px-3.5 py-2 text-xs transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all shadow-md ${
              accent.bgClass
            } text-white hover:opacity-90 active:scale-[0.99]`}
          >
            <span>Guardar Movimiento</span>
          </button>
        </form>
      </div>
    </div>
  );
}
