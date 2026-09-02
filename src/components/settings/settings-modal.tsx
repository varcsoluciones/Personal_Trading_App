'use client';

import React from 'react';
import {
  X,
  Moon,
  Sun,
  Sparkles,
  RotateCcw,
  Palette,
  Check,
  Zap,
} from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';
import {
  DEFAULT_SETTINGS,
  CurrencySymbol,
  APPLE_ACCENT_PALETTE,
  AppleAccentColor,
} from '@/lib/types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, accent, updateSettings } = useSettings();

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleReset = () => {
    updateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col max-h-[90vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white shadow-black/60'
            : 'border-slate-200/80 bg-white text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl ${accent.tintBgClass} ${accent.textClass}`}
            >
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Configuración</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Personaliza tema, color de acento Apple y preferencias
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${
              isDark
                ? 'bg-[#2c2c2e] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          
          {/* 1. TEMA VISUAL (DARK / LIGHT MODE CON TARJETAS DE VISTA PREVIA DEFINIDAS) */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              1. Apariencia Visual
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  settings.theme === 'dark'
                    ? `${accent.borderClass} ${accent.ringClass} ring-2 bg-[#141416] text-white shadow-md`
                    : 'border-slate-800 bg-[#141416] text-white hover:border-slate-700'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2c2c2e] text-amber-400">
                  <Moon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Fondo Oscuro</span>
                    {settings.theme === 'dark' && (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${accent.bgClass} text-white`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Apple Dark Mode</p>
                </div>
              </button>

              {/* Light Theme Button */}
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  settings.theme === 'light'
                    ? `${accent.borderClass} ${accent.ringClass} ring-2 bg-white text-slate-900 shadow-md`
                    : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
                  <Sun className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Fondo Claro</span>
                    {settings.theme === 'light' && (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${accent.bgClass} text-white`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Apple Light Mode</p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. PALETA DE COLORES DE ACENTO DE APPLE */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                2. Color de Acento Apple
              </label>
              <span className={`text-xs font-bold ${accent.textClass}`}>
                {accent.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {APPLE_ACCENT_PALETTE.map((pal) => {
                const isSelected = settings.accentColor === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => updateSettings({ accentColor: pal.id })}
                    className={`flex items-center gap-2 rounded-2xl border p-2 text-left transition-all ${
                      isSelected
                        ? isDark
                          ? 'border-white/80 bg-[#2c2c2e] shadow-xs'
                          : 'border-slate-800 bg-slate-50 shadow-xs'
                        : isDark
                        ? 'border-slate-800/80 bg-[#1c1c1e] hover:border-slate-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-xs text-white"
                      style={{ backgroundColor: pal.hex }}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {pal.name.replace('Apple', '').trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SÍMBOLO DE MONEDA */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              3. Moneda Predeterminada
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['USD', 'EUR', 'GBP', 'USDT'] as CurrencySymbol[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => updateSettings({ currency: cur })}
                  className={`rounded-2xl border py-2 text-xs font-mono font-bold transition-all ${
                    settings.currency === cur
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} shadow-xs`
                      : isDark
                      ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cur === 'USD' ? '$ USD' : cur === 'EUR' ? '€ EUR' : cur === 'GBP' ? '£ GBP' : '₮ USDT'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. FRECUENCIA DE ACTUALIZACIÓN */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              4. Actualización de Mercado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '30 seg', val: 30 },
                { label: '60 seg', val: 60 },
                { label: '2 min', val: 120 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => updateSettings({ refreshInterval: item.val })}
                  className={`rounded-2xl border py-2 text-xs font-semibold transition-all ${
                    settings.refreshInterval === item.val
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} shadow-xs font-bold`
                      : isDark
                      ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. ANIMACIONES */}
          <div
            className={`flex items-center justify-between rounded-2xl border p-3.5 ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${accent.tintBgClass} ${accent.textClass}`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Animación de Confeti & Celebración
                </span>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Disparar efectos al batir el rendimiento de Buy & Hold
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ confettiCelebration: !settings.confettiCelebration })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.confettiCelebration ? accent.bgClass : isDark ? 'bg-slate-800' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.confettiCelebration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/30' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={onClose}
            className={`rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-md ${accent.bgClass} hover:opacity-90 transition-all`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
