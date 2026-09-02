'use client';

import React, { useState } from 'react';
import { BacktestResult } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BacktestDashboardProps {
  result: BacktestResult | null;
  symbol?: string;
}

export function BacktestDashboard({ result, symbol }: BacktestDashboardProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const [showWalkForwardDetails, setShowWalkForwardDetails] = useState(false);

  if (!result) {
    return (
      <div
        className={`p-10 text-center rounded-3xl border ${
          isDark ? 'border-slate-800 bg-[#1c1c1e] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs font-semibold">Calculando simulación cuantitativa para {symbol || "el activo"}...</p>
      </div>
    );
  }
  const isNetProfitPositive = result.totalNetProfit >= 0;
  const isStrategyWinner = result.totalNetProfitPct > result.buyAndHoldProfitPct;


  const wf = result.walkForwardMetrics;

  return (
    <div className="space-y-6">
      {/* Top Section: Prominent Unified Confidence Hero Banner */}
      <div
        className={`rounded-3xl border p-5 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Evaluación de Confiabilidad Cuantitativa
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulación con $1,000 USD iniciales, comisiones reales IBKR y prueba ciega fuera de muestra
            </p>
          </div>

          {/* Live Dynamic Score computed from current Backtest & Walk-Forward calibration */}
          <ConfidenceBadge
            opportunityScore={Math.min(
              95,
              Math.max(
                15,
                Math.round(
                  (result.winRate >= 50 ? 50 + (result.winRate - 50) * 0.8 : result.winRate * 0.9) +
                  (result.profitFactor >= 2.0 ? 25 : result.profitFactor >= 1.2 ? 15 : result.profitFactor >= 1.0 ? 5 : -20)
                )
              )
            )}
            reliabilityScore={result.reliabilityScore}
            lowSampleWarning={result.lowSampleWarning}
            size="lg"
            isDark={isDark}
          />
        </div>

        {/* Clear explanations without technical jargon */}
        {(result.lowSampleWarning || (result.ambiguousBarsCount && result.ambiguousBarsCount > 0)) && (
          <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-800/40 text-xs">
            {result.lowSampleWarning && (
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Aún no hay suficientes operaciones históricas para confiar del todo en este resultado (n = {result.totalTrades} operaciones).
                </span>
              </div>
            )}
            {result.ambiguousBarsCount !== undefined && result.ambiguousBarsCount > 0 && (
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span>
                  {result.ambiguousBarsCount} señales tuvieron un desenlace ambiguo, resueltas de forma conservadora priorizando la salida por Stop Loss.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Optional Collapsible Out-of-Sample Walk-Forward Comparison */}
        {wf && (
          <div className="mt-4 pt-3 border-t border-slate-800/40">
            <button
              type="button"
              onClick={() => setShowWalkForwardDetails(!showWalkForwardDetails)}
              className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-2.5 py-1.5 transition-all ${
                isDark ? 'text-slate-300 hover:bg-[#2c2c2e]' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
              <span>Ver validación fuera de muestra (Walk-Forward)</span>
              {showWalkForwardDetails ? (
                <ChevronUp className="h-3.5 w-3.5 opacity-70" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              )}
            </button>

            {showWalkForwardDetails && (
              <div
                className={`mt-3 rounded-2xl border p-4 text-xs transition-colors ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* In-Sample Column */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      1. Calibración (70% Histórico)
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Factor Beneficio:</span>
                        <strong>{wf.inSampleProfitFactor.toFixed(2)}x</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tasa de Acierto:</span>
                        <strong>{wf.inSampleWinRate.toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Operaciones:</span>
                        <strong>{wf.inSampleTrades} trades</strong>
                      </div>
                    </div>
                  </div>

                  {/* Out-of-Sample Column */}
                  <div className="space-y-1.5 md:border-l md:pl-4 border-slate-800/40">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                      2. Prueba Ciega (30% Fuera de Muestra)
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Factor Beneficio:</span>
                        <strong className={wf.outOfSampleProfitFactor >= 1.0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {wf.outOfSampleProfitFactor.toFixed(2)}x
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tasa de Acierto:</span>
                        <strong>{wf.outOfSampleWinRate.toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Operaciones:</span>
                        <strong>{wf.outOfSampleTrades} trades</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`mt-3 pt-2 border-t border-slate-800/40 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  El score premia estrategias cuyos resultados en la prueba ciega se mantienen estables respecto al periodo de calibración.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4 KPI Cards Grid: REORDERED (Risk First -> Profit Last) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Máxima Caída (Riesgo Primero) */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              1. Máxima Caída
            </span>
            <InfoTooltip
              text="La mayor pérdida acumulada de la cuenta desde un pico máximo hasta un fondo."
              title="Max Drawdown %"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-rose-500">
              -{result.maxDrawdown.toFixed(2)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Drawdown: <strong className="font-mono text-rose-500">-{formatCurrency(result.maxDrawdownUSD, 0)}</strong></span>
            <span>Final: <strong className="font-mono">{formatCurrency(result.finalCapital, 0)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Tasa de Acierto */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              2. Tasa de Acierto
            </span>
            <InfoTooltip
              text="Porcentaje de operaciones cerradas con ganancia sobre el total ejecutado."
              title="Win Rate %"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-emerald-500">
              {result.winRate.toFixed(1)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Ganadoras: <strong className="font-mono text-emerald-500">{result.winningTrades}</strong></span>
            <span>Perdedoras: <strong className="font-mono text-rose-500">{result.losingTrades}</strong></span>
          </div>
        </div>

        {/* KPI 3: Retorno Estrategia */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              3. Retorno Estrategia
            </span>
            <InfoTooltip
              text="Rendimiento porcentual neto obtenido tras descontar todas las comisiones de compra/venta."
              title="Net Profit %"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-black ${
                isNetProfitPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isNetProfitPositive ? '+' : ''}{result.totalNetProfitPct.toFixed(2)}%
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ({isNetProfitPositive ? '+' : ''}{formatCurrency(result.totalNetProfit)})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              B&H: {result.buyAndHoldProfitPct.toFixed(1)}%
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isStrategyWinner
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : isDark ? 'bg-[#2c2c2e] text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isStrategyWinner ? '¡Supera Benchmark!' : 'Estrategia Defensiva'}
            </span>
          </div>
        </div>

        {/* KPI 4: Factor de Beneficio (Ganancia al Final) */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              4. Factor de Beneficio
            </span>
            <InfoTooltip
              text="Ganancias brutas divididas entre pérdidas brutas (> 1.5 es un excelente sistema cuantitativo)."
              title="Profit Factor"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-black ${accent.textClass}`}>
              {result.profitFactor.toFixed(2)}x
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Comisiones: <strong className="font-mono">-{formatCurrency(result.totalFeesPaid)}</strong></span>
            <span className="text-emerald-500 font-bold">R:B 1:{result.riskRewardRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div
        className={`rounded-3xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Curva de Capital (Equity Curve) vs. Comprar & Mantener (Buy & Hold)
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Evolución del balance con $1,000 USD iniciales y deducción de comisiones de Interactive Brokers
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${accent.bgClass}`} />
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Estrategia Quant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Buy & Hold (Benchmark)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent.hex} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={accent.hex} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2c2c2e' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  borderColor: isDark ? '#3a3a3c' : '#e2e8f0',
                  borderRadius: '1rem',
                  fontSize: '11px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
              />
              <Area
                type="monotone"
                dataKey="buyAndHoldEquity"
                name="Buy & Hold"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="equity"
                name="Estrategia Quant"
                stroke={accent.hex}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#strategyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Underwater Drawdown Chart */}
      <div
        className={`rounded-3xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="mb-3">
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Perfil de Riesgo: Gráfico de Caídas Submarinas (Underwater Drawdown %)
          </h4>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Muestra el porcentaje de retroceso desde el máximo histórico en cada momento
          </p>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.equityCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2c2c2e' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `-${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  borderColor: isDark ? '#3a3a3c' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`-${Number(val).toFixed(2)}%`, 'Drawdown']}
              />
              <Area type="monotone" dataKey="drawdownPct" stroke="#ff3b30" strokeWidth={1.5} fill="#ff3b30" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
