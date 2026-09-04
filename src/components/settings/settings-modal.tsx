'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Moon,
  Sun,
  RotateCcw,
  Palette,
  Check,
  Zap,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';
import {
  DEFAULT_SETTINGS,
  CurrencySymbol,
  APPLE_ACCENT_PALETTE,
  AppleAccentColor,
} from '@/lib/types/settings';
import { exportAppBackup, importAppBackup } from '@/lib/utils/backup-manager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, accent, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleReset = () => {
    updateSettings(DEFAULT_SETTINGS);
  };

  const handleExport = () => {
    try {
      exportAppBackup();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (e: any) {
      setImportStatus({ type: 'error', message: 'Error al exportar los datos.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = importAppBackup(content);
      if (result.success) {
        setImportStatus({
          type: 'success',
          message: `${result.message} Recargando aplicación...`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus({
          type: 'error',
          message: result.message,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

          {/* 5. COPIA DE SEGURIDAD Y TRANSFERENCIA DE DATOS */}
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`rounded-xl p-2 ${accent.tintBgClass} ${accent.textClass}`}>
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  5. Copia de Seguridad y Transferencia de Datos
                </span>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Exporta o carga tus datos (configuración, cartera, alertas y lista) para usarlos en otro dispositivo o navegador.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleExport}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                  exportSuccess
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : isDark
                    ? 'border-slate-700 bg-[#1c1c1e] text-slate-200 hover:text-white hover:bg-[#27272a] hover:border-slate-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {exportSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>¡Descargado!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                    <span>Exportar Datos (.json)</span>
                  </>
                )}
              </button>

              {/* Import Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-[#1c1c1e] text-slate-200 hover:text-white hover:bg-[#27272a] hover:border-slate-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Upload className="h-3.5 w-3.5 text-emerald-400" />
                <span>Cargar / Restaurar Datos</span>
              </button>
            </div>

            {/* Status Feedback Notification */}
            {importStatus && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-xl p-2.5 text-[11px] font-medium border animate-in fade-in zoom-in-95 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
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
