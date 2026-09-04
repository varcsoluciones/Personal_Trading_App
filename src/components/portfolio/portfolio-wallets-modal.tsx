'use client';

import React, { useState } from 'react';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import { PortfolioWallet } from '@/lib/types/portfolio';
import {
  X,
  Wallet,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';

const COMMON_BROKERS = [
  'Interactive Brokers',
  'Binance',
  'Coinbase',
  'Bybit',
  'KuCoin',
  'Robinhood',
  'MetaTrader',
  'Trading212',
  'General',
  'Otro',
];

interface PortfolioWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioWalletsModal({ isOpen, onClose }: PortfolioWalletsModalProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const {
    wallets,
    createWallet,
    updateWallet,
    deleteWallet,
    positions,
    getWalletAvailableCapital,
  } = usePortfolioContext();

  const [isCreating, setIsCreating] = useState(false);
  const [editingWallet, setEditingWallet] = useState<PortfolioWallet | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [broker, setBroker] = useState(COMMON_BROKERS[0]);
  const [customBroker, setCustomBroker] = useState('');
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setBroker(COMMON_BROKERS[0]);
    setCustomBroker('');
    setDescription('');
    setEditingWallet(null);
    setIsCreating(true);
  };

  const handleStartEdit = (wallet: PortfolioWallet) => {
    setName(wallet.name);
    if (wallet.brokerOrExchange && COMMON_BROKERS.includes(wallet.brokerOrExchange)) {
      setBroker(wallet.brokerOrExchange);
      setCustomBroker('');
    } else if (wallet.brokerOrExchange) {
      setBroker('Otro');
      setCustomBroker(wallet.brokerOrExchange);
    } else {
      setBroker('General');
      setCustomBroker('');
    }
    setDescription(wallet.description || '');
    setIsCreating(false);
    setEditingWallet(wallet);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingWallet(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBroker = broker === 'Otro' ? (customBroker.trim() || 'Otro') : broker;
    const cleanName = name.trim();
    if (!cleanName) return;

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        name: cleanName,
        brokerOrExchange: finalBroker,
        description: description.trim() || undefined,
      });
    } else {
      createWallet(cleanName, finalBroker, description.trim() || undefined);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      handleCancelForm();
    }, 400);
  };

  const handleDelete = (wallet: PortfolioWallet) => {
    if (wallets.length <= 1) {
      alert('No puedes eliminar la única cartera activa en tu cuenta.');
      return;
    }

    const assignedPos = positions.filter((p) => p.portfolioId === wallet.id);
    const msg =
      assignedPos.length > 0
        ? `La cartera "${wallet.name}" tiene ${assignedPos.length} operaciones asociadas. ¿Eliminarla y reasignar sus operaciones a otra cartera activa?`
        : `¿Eliminar la cartera "${wallet.name}"?`;

    if (confirm(msg)) {
      deleteWallet(wallet.id);
      if (editingWallet?.id === wallet.id) {
        handleCancelForm();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Modal Header */}
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
              <h3 className="text-base font-bold font-sans tracking-tight">
                Gestión de Mis Carteras & Brokers
              </h3>
              <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Administra tus cuentas independientes (Binance, IBKR, etc.)
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold font-sans animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{editingWallet ? '¡Cartera actualizada con éxito!' : '¡Nueva cartera creada con éxito!'}</span>
            </div>
          )}

          {/* Form to Create / Edit Wallet */}
          {(isCreating || editingWallet) ? (
            <form
              onSubmit={handleSubmit}
              className={`rounded-2xl border p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
                isDark ? 'border-blue-500/30 bg-[#2c2c2e]/60' : 'border-blue-200 bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800/40">
                <h4 className="text-xs font-bold font-sans text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>{editingWallet ? `Editar: ${editingWallet.name}` : 'Crear Nueva Cartera'}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-white font-sans cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-3">
                {/* Wallet Name */}
                <div>
                  <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nombre de la Cartera / Subcuenta:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Binance Spot, Interactive Brokers, Crypto Cold"
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-sans font-bold transition-colors ${
                      isDark
                        ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-blue-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                    }`}
                  />
                </div>

                {/* Broker / Exchange Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Broker o Exchange:
                    </label>
                    <select
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-sans font-bold transition-colors ${
                        isDark
                          ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-blue-500 focus:outline-none'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                      }`}
                    >
                      {COMMON_BROKERS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {broker === 'Otro' && (
                    <div>
                      <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Especificar Broker / Plataforma:
                      </label>
                      <input
                        type="text"
                        required
                        value={customBroker}
                        onChange={(e) => setCustomBroker(e.target.value)}
                        placeholder="ej. Bitget, Charles Schwab"
                        className={`w-full rounded-xl border px-3 py-2 text-xs font-sans font-bold transition-colors ${
                          isDark
                            ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-blue-500 focus:outline-none'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                        }`}
                      />
                    </div>
                  )}

                  {broker !== 'Otro' && (
                    <div>
                      <label className={`block text-xs font-bold font-sans mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Descripción / Nota (Opcional):
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="ej. Acciones y ETFs largo plazo"
                        className={`w-full rounded-xl border px-3 py-2 text-xs font-sans transition-colors ${
                          isDark
                            ? 'border-slate-800 bg-[#1c1c1e] text-white focus:border-blue-500 focus:outline-none'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold font-sans transition-all cursor-pointer ${
                    isDark ? 'border-slate-700 bg-[#1c1c1e] text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold font-sans text-white transition-all shadow-md cursor-pointer ${
                    accent.bgClass
                  }`}
                >
                  {editingWallet ? 'Guardar Cambios' : 'Crear Cartera'}
                </button>
              </div>
            </form>
          ) : (
            /* Action bar to add new wallet */
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Carteras Registradas ({wallets.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold font-sans text-white transition-all shadow-sm cursor-pointer ${
                  accent.bgClass
                } hover:opacity-95`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Nueva Cartera</span>
              </button>
            </div>
          )}

          {/* Wallets List */}
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const assignedPos = positions.filter((p) => p.portfolioId === wallet.id);
              const openCount = assignedPos.filter((p) => p.status === 'OPEN').length;
              const available = getWalletAvailableCapital(wallet.id);

              return (
                <div
                  key={wallet.id}
                  className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 mt-0.5 ${
                        wallet.brokerOrExchange?.toLowerCase().includes('binance')
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : wallet.brokerOrExchange?.toLowerCase().includes('interactive')
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : wallet.brokerOrExchange?.toLowerCase().includes('coinbase')
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : isDark
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-sans tracking-tight">
                          {wallet.name}
                        </span>
                        {wallet.brokerOrExchange && (
                          <span className="rounded-md bg-slate-500/15 border border-slate-500/30 px-1.5 py-0.2 text-[9px] font-bold text-slate-300 uppercase font-sans">
                            {wallet.brokerOrExchange}
                          </span>
                        )}
                      </div>

                      {wallet.description && (
                        <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {wallet.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="font-sans text-slate-400">
                          Efectivo disponible: <strong className="font-mono font-bold text-emerald-400">{formatCurrency(available)}</strong>
                        </span>
                        <span className="font-sans text-slate-400">
                          Pos. abiertas: <strong className="font-mono font-bold text-slate-200">{openCount}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(wallet)}
                      className="rounded-xl border border-slate-700/80 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar Cartera"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(wallet)}
                        className="rounded-xl border border-slate-700/80 p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar Cartera"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between border-t px-6 py-3.5 ${
            isDark ? 'border-slate-800 bg-[#121214]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tip: Puedes transferir fondos entre carteras desde "+ Registrar Movimiento".
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-bold font-sans text-white transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
