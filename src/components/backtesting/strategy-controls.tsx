'use client';

import React from 'react';
import { Asset, BacktestConfig } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { AssetDropdownSelect } from '@/components/shared/asset-dropdown-select';
import {
  RotateCcw,
  Shield,
  Scale,
  Zap,
  Sliders,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StrategyControlsProps {
  config: BacktestConfig;
  onChange: (updates: Partial<BacktestConfig>) => void;
  assets?: Asset[];
  selectedAsset?: Asset;
  onSelectAsset?: (id: string) => void;
}

interface StrategyPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  config: Partial<BacktestConfig>;
}

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'conservative',
    name: 'Conservador',
    tagline: 'Protección & Selectividad',
    description: 'Entra con más cautela y protege el capital con un stop más ceñido. Menos operaciones, pero más selectivas.',
    icon: Shield,
    config: {
      rsiPeriod: 14,
      rsiOversold: 40,
      rsiOverbought: 65,
      emaFastPeriod: 20,
      emaSlowPeriod: 50,
      stopLossPct: 2.5,
      takeProfitRatio: 1.8,
      useAtrStop: true,
    },
  },
  {
    id: 'balanced',
    name: 'Equilibrado',
    tagline: 'Recomendado por Defecto',
    description: 'El balance recomendado entre frecuencia de operaciones y control de riesgo.',
    icon: Scale,
    config: {
      rsiPeriod: 14,
      rsiOversold: 38,
      rsiOverbought: 70,
      emaFastPeriod: 20,
      emaSlowPeriod: 50,
      stopLossPct: 3.5,
      takeProfitRatio: 2.2,
      useAtrStop: true,
    },
  },
  {
    id: 'aggressive',
    name: 'Agresivo',
    tagline: 'Mayor Frecuencia & Retorno',
    description: 'Busca más oportunidades y tolera mayor volatilidad. Mayor riesgo, mayor potencial de retorno.',
    icon: Zap,
    config: {
      rsiPeriod: 10,
      rsiOversold: 32,
      rsiOverbought: 75,
      emaFastPeriod: 12,
      emaSlowPeriod: 40,
      stopLossPct: 5.0,
      takeProfitRatio: 3.0,
      useAtrStop: true,
    },
  },
];

export function StrategyControls({
  config,
  onChange,
  assets,
  selectedAsset,
  onSelectAsset,
}: StrategyControlsProps) {
  const { settings, accent, updateSettings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const isAdvanced = !!settings.backtestAdvancedMode;

  // Determine which preset matches current config, if any
  const activePresetId = STRATEGY_PRESETS.find((p) =>
    config.rsiOversold === p.config.rsiOversold &&
    config.rsiOverbought === p.config.rsiOverbought &&
    config.emaFastPeriod === p.config.emaFastPeriod &&
    config.emaSlowPeriod === p.config.emaSlowPeriod &&
    config.stopLossPct === p.config.stopLossPct &&
    config.takeProfitRatio === p.config.takeProfitRatio &&
    (p.config.rsiPeriod === undefined || config.rsiPeriod === p.config.rsiPeriod)
  )?.id || null;

  const handleSelectPreset = (preset: StrategyPreset) => {
    onChange(preset.config);
  };

  const handleResetDefaults = () => {
    const balanced = STRATEGY_PRESETS.find((p) => p.id === 'balanced')!;
    onChange(balanced.config);
  };

  return (
    <div
      className={`rounded-3xl border p-3.5 sm:p-5 backdrop-blur-md transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
      }`}
    >
      {/* Header Bar with Integrated Asset Dropdown Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {assets && selectedAsset && onSelectAsset && (
            <AssetDropdownSelect
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={onSelectAsset}
            />
          )}

          <div>
            <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Simulación de Estrategia Quant
            </h3>
            <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecciona un perfil predeterminado o despliega los controles avanzados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ backtestAdvancedMode: !isAdvanced })}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
              isAdvanced
                ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`
                : isDark
                ? 'border-slate-700/80 bg-[#2c2c2e] text-slate-300 hover:bg-[#3a3a3c]'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isAdvanced ? 'Ocultar ajuste manual' : 'Ajustar manualmente ⚙'}</span>
            {isAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restablecer a valores recomendados"
            className={`flex items-center gap-1 rounded-xl sm:rounded-2xl border px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
              isDark
                ? 'border-slate-700/80 bg-[#2c2c2e] text-slate-300 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* 3 PRESETS GRID - Exact same design as Opportunity Screener */}
      <div className="flex sm:grid sm:grid-cols-3 gap-2.5 sm:gap-3.5 overflow-x-auto custom-horizontal-scrollbar p-0.5 pb-1 sm:pb-0.5">
        {STRATEGY_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const Icon = preset.icon;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink flex flex-col justify-between rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-left transition-all ${
                isSelected
                  ? isDark
                    ? 'border-blue-500 bg-[#2c2c2e] shadow-md shadow-blue-500/20'
                    : 'border-blue-500 bg-blue-50/70 shadow-md shadow-blue-500/20'
                  : isDark
                  ? 'border-slate-800/80 bg-[#2c2c2e]/40 hover:border-slate-700 hover:bg-[#2c2c2e]/70'
                  : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-2 overflow-x-auto custom-horizontal-scrollbar pb-0.5 sm:pb-1 min-w-0">
                    <div
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-xs'
                          : isDark
                          ? 'bg-[#1c1c1e] text-slate-400'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {preset.name}
                      </h4>
                      <p className={`text-[9px] sm:text-[10px] font-semibold truncate ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {preset.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="shrink-0 rounded-full bg-blue-500/15 border border-blue-500/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-500">
                      Activo
                    </span>
                  )}
                </div>

                <p className={`text-[11px] sm:text-xs leading-snug sm:leading-relaxed mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {preset.description}
                </p>
              </div>

              {/* Quick Strategy Blueprint Pill */}
              <div className={`mt-2.5 sm:mt-3 pt-1.5 sm:pt-2 border-t flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-semibold ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}>
                <span>SL: -{preset.config.stopLossPct}%</span>
                <span>TP: 1:{preset.config.takeProfitRatio}x</span>
                <span>RSI: {preset.config.rsiOversold}-{preset.config.rsiOverbought}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ADVANCED CUSTOM CONTROLS DRAWER */}
      {isAdvanced && (
        <div
          className={`mt-5 rounded-3xl border p-4 sm:p-5 transition-all animate-fade-in ${
            isDark ? 'border-slate-800 bg-[#252528]/80' : 'border-slate-200 bg-slate-50/80 shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/30">
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Parámetros Cuantitativos Manuales
              </h4>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ajusta las variables de entrada y salida para calibrar la estrategia
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Recálculo instantáneo
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. RSI Period */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Periodo RSI
                  </span>
                  <InfoTooltip text="Número de velas usadas para calcular el Relative Strength Index." title="Periodo RSI" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-blue-500/15 text-blue-400 border-blue-500/30">
                  {config.rsiPeriod} velas
                </span>
              </div>
              <input
                type="range"
                min={7}
                max={21}
                step={1}
                value={config.rsiPeriod}
                onChange={(e) => onChange({ rsiPeriod: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-blue-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>7 (Rápido)</span>
                <span className="text-blue-500/80 font-bold">14 (Estándar)</span>
                <span>21 (Lento)</span>
              </div>
            </div>

            {/* 2. RSI Oversold */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Sobrevenda (Compra)
                  </span>
                  <InfoTooltip text="Nivel de RSI por debajo del cual se considera una oportunidad de rebote alcista." title="Umbral Sobrevenda" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  &lt; {config.rsiOversold}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={45}
                step={1}
                value={config.rsiOversold}
                onChange={(e) => onChange({ rsiOversold: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-emerald-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>20 (Extremo)</span>
                <span className="text-emerald-500/80 font-bold">38 (Recomendado)</span>
                <span>45 (Flexible)</span>
              </div>
            </div>

            {/* 3. RSI Overbought */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Sobrecompra (Cierre)
                  </span>
                  <InfoTooltip text="Nivel de RSI a partir del cual el activo se considera agotado y se toma ganancia." title="Umbral Sobrecompra" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-rose-500/15 text-rose-400 border-rose-500/30">
                  &gt; {config.rsiOverbought}
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={85}
                step={1}
                value={config.rsiOverbought}
                onChange={(e) => onChange({ rsiOverbought: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-rose-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>60 (Pronto)</span>
                <span className="text-rose-500/80 font-bold">70 (Estándar)</span>
                <span>85 (Extremo)</span>
              </div>
            </div>

            {/* 4. Fast EMA */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    EMA Rápida (Entrada)
                  </span>
                  <InfoTooltip text="Media móvil exponencial de reacción rápida (suele ser 20 periodos)." title="EMA Rápida" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-blue-500/15 text-blue-400 border-blue-500/30">
                  EMA {config.emaFastPeriod}
                </span>
              </div>
              <input
                type="range"
                min={9}
                max={30}
                step={1}
                value={config.emaFastPeriod}
                onChange={(e) => onChange({ emaFastPeriod: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-blue-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>9</span>
                <span className="text-blue-500/80 font-bold">20 (Defecto)</span>
                <span>30</span>
              </div>
            </div>

            {/* 5. Slow EMA */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    EMA Lenta (Tendencia)
                  </span>
                  <InfoTooltip text="Media móvil de tendencia base (suele ser 50 periodos). Filtra operaciones contra-tendencia." title="EMA Lenta" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-amber-500/15 text-amber-400 border-amber-500/30">
                  EMA {config.emaSlowPeriod}
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                step={5}
                value={config.emaSlowPeriod}
                onChange={(e) => onChange({ emaSlowPeriod: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-amber-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>30</span>
                <span className="text-amber-500/80 font-bold">50 (Defecto)</span>
                <span>100</span>
              </div>
            </div>

            {/* 6. Stop Loss % */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Stop Loss %
                  </span>
                  <InfoTooltip text="Porcentaje máximo de pérdida tolerada por operación para cortar pérdidas." title="Stop Loss" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-rose-500/15 text-rose-400 border-rose-500/30">
                  -{config.stopLossPct}%
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={10.0}
                step={0.5}
                value={config.stopLossPct}
                onChange={(e) => onChange({ stopLossPct: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-rose-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>-1.0% (Ceñido)</span>
                <span className="text-rose-500/80 font-bold">-3.5% (Equilibrado)</span>
                <span>-10.0% (Amplio)</span>
              </div>
            </div>

            {/* 7. Take Profit Ratio */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ratio Take Profit (R:R)
                  </span>
                  <InfoTooltip text="Ratio matemática de ganancia respecto al riesgo (1:2.2 significa ganar $2.20 por cada $1 arriesgado)." title="Multiplicador Take Profit" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  1 : {config.takeProfitRatio}x
                </span>
              </div>
              <input
                type="range"
                min={1.5}
                max={4.0}
                step={0.1}
                value={config.takeProfitRatio}
                onChange={(e) => onChange({ takeProfitRatio: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-emerald-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>1:1.5</span>
                <span className="text-emerald-500/80 font-bold">1:2.2 (Recomendado)</span>
                <span>1:4.0</span>
              </div>
            </div>

            {/* 8. Initial Capital */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Capital Inicial Simulado
                </span>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                }`}>
                  {formatCurrency(config.initialCapital, 0)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                {[500, 1000, 5000, 10000].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => onChange({ initialCapital: cap })}
                    className={`flex-1 rounded-xl border py-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                      config.initialCapital === cap
                        ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} shadow-xs`
                        : isDark
                        ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-400 hover:text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ${cap >= 1000 ? `${cap / 1000}k` : cap}
                  </button>
                ))}
              </div>
              <div className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Base para cálculo de curva de capital
              </div>
            </div>

            {/* 9. Broker Cost Model (Interactive Brokers) */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                isDark ? 'border-indigo-500/20 bg-[#1c1c1e]' : 'border-indigo-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Costos Broker (IBKR)</span>
                </div>
                <span className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-bold text-indigo-400">
                  SmartRouting
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ brokerPreset: 'IBKR_TIERED', commissionRate: 0.0005, slippageRate: 0.0002 })}
                  className={`flex-1 rounded-xl py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    config.commissionRate === 0.0005
                      ? 'bg-indigo-500 text-white shadow-xs'
                      : isDark ? 'bg-[#2c2c2e] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tiered (0.05%)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ brokerPreset: 'IBKR_FIXED', commissionRate: 0.001, slippageRate: 0.0005 })}
                  className={`flex-1 rounded-xl py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    config.commissionRate === 0.001
                      ? 'bg-indigo-500 text-white shadow-xs'
                      : isDark ? 'bg-[#2c2c2e] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Fixed (0.10%)
                </button>
              </div>

              <div className={`text-[10px] space-y-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <div>• Comisión: <span className="font-bold text-indigo-400">{(config.commissionRate * 100).toFixed(2)}%</span> ($0.0035/ud)</div>
                <div>• Deslizamiento: <span className="font-bold text-indigo-400">{(config.slippageRate * 100).toFixed(2)}%</span> (IBKR)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
