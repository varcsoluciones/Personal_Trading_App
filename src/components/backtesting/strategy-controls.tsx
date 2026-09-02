'use client';

import React from 'react';
import { BacktestConfig } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';
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

export function StrategyControls({ config, onChange }: StrategyControlsProps) {
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
      className={`rounded-3xl border p-5 backdrop-blur-md transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Configuración de la Estrategia
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Selecciona un perfil predeterminado o despliega los controles avanzados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ backtestAdvancedMode: !isAdvanced })}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
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
            className={`flex items-center gap-1 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              isDark
                ? 'border-slate-700/80 bg-[#2c2c2e] text-slate-300 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* 3 PRESETS GRID */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {STRATEGY_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const Icon = preset.icon;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? isDark
                    ? 'border-blue-500 bg-[#2c2c2e] shadow-md shadow-blue-500/10 ring-2 ring-blue-500/50'
                    : 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/50'
                  : isDark
                  ? 'border-slate-800 bg-[#2c2c2e]/40 hover:border-slate-700 hover:bg-[#2c2c2e]/70'
                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-xs'
                          : isDark
                          ? 'bg-[#1c1c1e] text-slate-400'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {preset.name}
                      </h4>
                      <p className={`text-[10px] font-semibold ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {preset.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                      Activo
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {preset.description}
                </p>
              </div>

              {/* Quick Strategy Blueprint Pill */}
              <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono font-semibold ${
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

      {/* ADVANCED SLIDERS & CONTROLS (COLLAPSIBLE) */}
      {isAdvanced && (
        <div
          className={`mt-5 pt-5 border-t space-y-5 transition-all ${
            isDark ? 'border-slate-800/80' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Ajuste Fino de Parámetros Cuantitativos
            </h4>
            {activePresetId === null && (
              <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                Configuración Manual Personalizada
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. RSI Period */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Periodo RSI:</span>
                  <InfoTooltip text="Número de velas para calcular el oscilador RSI (14 es el estándar de Wilder)." title="Periodo RSI" />
                </div>
                <span className={`font-mono font-bold ${accent.textClass}`}>{config.rsiPeriod} velas</span>
              </div>
              <input
                type="range"
                min={7}
                max={28}
                step={1}
                value={config.rsiPeriod}
                onChange={(e) => onChange({ rsiPeriod: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>7 (Rápido)</span>
                <span>14 (Estándar)</span>
                <span>28 (Lento)</span>
              </div>
            </div>

            {/* 2. RSI Oversold (Compra) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Umbral de Sobreventa (RSI Entrada):</span>
                  <InfoTooltip text="Nivel de RSI a partir del cual se busca comprar retrocesos (pullbacks)." title="RSI Sobreventa" />
                </div>
                <span className="font-mono font-bold text-emerald-500">&lt;= {config.rsiOversold}</span>
              </div>
              <input
                type="range"
                min={25}
                max={50}
                step={1}
                value={config.rsiOversold}
                onChange={(e) => onChange({ rsiOversold: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>25 (Extremo)</span>
                <span>38 (Recomendado)</span>
                <span>50 (Temprano)</span>
              </div>
            </div>

            {/* 3. RSI Overbought (Salida) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Umbral de Sobrecompra (RSI Salida):</span>
                  <InfoTooltip text="Nivel de RSI donde se cierran posiciones para asegurar ganancias." title="RSI Sobrecompra" />
                </div>
                <span className="font-mono font-bold text-rose-500">&gt;= {config.rsiOverbought}</span>
              </div>
              <input
                type="range"
                min={60}
                max={85}
                step={1}
                value={config.rsiOverbought}
                onChange={(e) => onChange({ rsiOverbought: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>60 (Prudente)</span>
                <span>70 (Defecto)</span>
                <span>85 (Extremo)</span>
              </div>
            </div>

            {/* 4. Fast EMA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>EMA Rápida:</span>
                  <InfoTooltip text="Media móvil rápida (suele ser 20 periodos) para detectar giros de corto plazo." title="EMA Rápida" />
                </div>
                <span className={`font-mono font-bold ${accent.textClass}`}>EMA {config.emaFastPeriod}</span>
              </div>
              <input
                type="range"
                min={9}
                max={30}
                step={1}
                value={config.emaFastPeriod}
                onChange={(e) => onChange({ emaFastPeriod: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>9</span>
                <span>20 (Defecto)</span>
                <span>30</span>
              </div>
            </div>

            {/* 5. Slow EMA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>EMA Lenta (Filtro Tendencia):</span>
                  <InfoTooltip text="Media móvil de tendencia base (suele ser 50 periodos). Filtra operaciones contra-tendencia." title="EMA Lenta" />
                </div>
                <span className="font-mono font-bold text-orange-500">EMA {config.emaSlowPeriod}</span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                step={5}
                value={config.emaSlowPeriod}
                onChange={(e) => onChange({ emaSlowPeriod: Number(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>30</span>
                <span>50 (Defecto)</span>
                <span>100</span>
              </div>
            </div>

            {/* 6. Stop Loss % */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Stop Loss %:</span>
                  <InfoTooltip text="Porcentaje máximo de pérdida tolerada por operación para cortar pérdidas." title="Stop Loss" />
                </div>
                <span className="font-mono font-bold text-rose-500">-{config.stopLossPct}%</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={10.0}
                step={0.5}
                value={config.stopLossPct}
                onChange={(e) => onChange({ stopLossPct: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>-1.0% (Ceñido)</span>
                <span>-3.5% (Equilibrado)</span>
                <span>-10.0% (Amplio)</span>
              </div>
            </div>

            {/* 7. Take Profit Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Multiplicador Take Profit (R:R):</span>
                  <InfoTooltip text="Ratio matemática de ganancia respecto al riesgo (1:2.2 significa ganar $2.20 por cada $1 arriesgado)." title="Multiplicador Take Profit" />
                </div>
                <span className="font-mono font-bold text-emerald-500">1 : {config.takeProfitRatio}x</span>
              </div>
              <input
                type="range"
                min={1.5}
                max={4.0}
                step={0.1}
                value={config.takeProfitRatio}
                onChange={(e) => onChange({ takeProfitRatio: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>1:1.5</span>
                <span>1:2.2 (Recomendado)</span>
                <span>1:4.0</span>
              </div>
            </div>

            {/* 8. Initial Capital */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Capital Inicial Simulado:</span>
                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(config.initialCapital, 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                {[500, 1000, 5000, 10000].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => onChange({ initialCapital: cap })}
                    className={`flex-1 rounded-2xl border py-1.5 text-xs font-mono font-bold transition-all ${
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
            </div>

            {/* 9. Broker Cost Model (Interactive Brokers) */}
            <div
              className={`flex flex-col justify-center rounded-3xl border p-3.5 ${
                isDark ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Costos Interactive Brokers</span>
                </div>
                <span className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-bold text-indigo-400">
                  IBKR SmartRouting
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => onChange({ brokerPreset: 'IBKR_TIERED', commissionRate: 0.0005, slippageRate: 0.0002 })}
                  className={`flex-1 rounded-xl py-1 text-[10px] font-bold transition-all ${
                    config.commissionRate === 0.0005
                      ? 'bg-indigo-500 text-white shadow-xs'
                      : isDark ? 'bg-[#2c2c2e] text-slate-400' : 'bg-slate-200/70 text-slate-700'
                  }`}
                >
                  IBKR Tiered (~0.05%)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ brokerPreset: 'IBKR_FIXED', commissionRate: 0.001, slippageRate: 0.0005 })}
                  className={`flex-1 rounded-xl py-1 text-[10px] font-bold transition-all ${
                    config.commissionRate === 0.001
                      ? 'bg-indigo-500 text-white shadow-xs'
                      : isDark ? 'bg-[#2c2c2e] text-slate-400' : 'bg-slate-200/70 text-slate-700'
                  }`}
                >
                  Crypto / Fixed (0.10%)
                </button>
              </div>

              <div className={`text-[11px] space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <div>• Comisión IBKR: <span className="font-mono font-bold text-indigo-400">{(config.commissionRate * 100).toFixed(2)}%</span> ($0.0035/acción)</div>
                <div>• Deslizamiento: <span className="font-mono font-bold text-indigo-400">{(config.slippageRate * 100).toFixed(2)}%</span> (SmartRouting)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
