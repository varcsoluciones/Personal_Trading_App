'use client';

import React from 'react';
import { Sliders, RotateCcw, ShieldCheck } from 'lucide-react';
import { BacktestConfig } from '@/lib/types/market';
import { DEFAULT_BACKTEST_CONFIG } from '@/lib/quant/backtest-engine';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface StrategyControlsProps {
  config: BacktestConfig;
  onChange: (updates: Partial<BacktestConfig>) => void;
}

export function StrategyControls({ config, onChange }: StrategyControlsProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const handleReset = () => {
    onChange(DEFAULT_BACKTEST_CONFIG);
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm backdrop-blur-md transition-colors ${
        isDark
          ? 'border-slate-800/80 bg-[#1c1c1e]'
          : 'border-slate-200/80 bg-white shadow-xs text-slate-900'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`rounded-2xl p-2.5 ${accent.tintBgClass} ${accent.textClass}`}>
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Parámetros de la Estrategia
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mueve los controles para recalcular métricas instantáneamente en memoria
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            isDark
              ? 'border-slate-700/80 bg-[#2c2c2e]/80 text-slate-300 hover:bg-[#3a3a3c]'
              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. RSI Period */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Periodo RSI:</span>
              <InfoTooltip text="Número de velas usadas para calcular el oscilador de momento (14 es el estándar)." title="Periodo RSI" />
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

        {/* 2. RSI Oversold (Sobreventa) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Umbral Sobreventa (Compra):</span>
              <InfoTooltip text="Nivel de RSI por debajo del cual se busca comprar en retroceso favorable." title="Sobreventa RSI" />
            </div>
            <span className="font-mono font-bold text-emerald-500">&le; {config.rsiOversold}</span>
          </div>
          <input
            type="range"
            min={20}
            max={45}
            step={1}
            value={config.rsiOversold}
            onChange={(e) => onChange({ rsiOversold: Number(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>20 (Extremo)</span>
            <span>35 (Óptimo)</span>
            <span>45 (Conservador)</span>
          </div>
        </div>

        {/* 3. RSI Overbought (Sobrecompra) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Umbral Sobrecompra (Salida):</span>
              <InfoTooltip text="Nivel de RSI a partir del cual se toma ganancia por agotamiento de impulso." title="Sobrecompra RSI" />
            </div>
            <span className="font-mono font-bold text-rose-500">&ge; {config.rsiOverbought}</span>
          </div>
          <input
            type="range"
            min={55}
            max={85}
            step={1}
            value={config.rsiOverbought}
            onChange={(e) => onChange({ rsiOverbought: Number(e.target.value) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>55 (Cierre Temprano)</span>
            <span>70 (Estándar)</span>
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

        {/* 9. Realism Friction Badge */}
        <div
          className={`flex flex-col justify-center rounded-3xl border p-3.5 ${
            isDark ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/60'
          }`}
        >
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Fricción Real Deducida</span>
          </div>
          <div className={`text-[11px] space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div>• Comisiones: <span className="font-mono font-bold text-blue-500">0.10%</span> por trade</div>
            <div>• Deslizamiento (Slippage): <span className="font-mono font-bold text-blue-500">0.05%</span> por orden</div>
          </div>
        </div>
      </div>
    </div>
  );
}
