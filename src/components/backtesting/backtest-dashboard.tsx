'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BacktestResult } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
} from 'lucide-react';

interface BacktestDashboardProps {
  result: BacktestResult | null;
  symbol: string;
}

export function BacktestDashboard({ result, symbol }: BacktestDashboardProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const underwaterData = useMemo(() => {
    if (!result?.equityCurve) return [];
    return result.equityCurve.map((point) => ({
      ...point,
      negativeDrawdownPct: -Math.abs(point.drawdownPct),
    }));
  }, [result?.equityCurve]);

  if (!result || result.totalTrades === 0) {
    return (
      <div
        className={`rounded-3xl border p-8 text-center backdrop-blur-md transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
          <Zap className="h-6 w-6" />
        </div>
        <h3 className={`mt-4 text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Sin señales de trading ejecutadas en el periodo para {symbol}
        </h3>
        <p className={`mt-1 text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Los filtros de entrada actuales son muy estrictos para la volatilidad histórica de este activo.
          Prueba cambiando al perfil <strong>Agresivo</strong> o ajustando los umbrales de RSI y EMAs en los controles manuales.
        </p>
      </div>
    );
  }

  const isNetProfitPositive = result.totalNetProfit >= 0;
  const isStrategyWinner = result.totalNetProfitPct > result.buyAndHoldProfitPct;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Walk-Forward Robustness Badge Banner */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border p-4 transition-all ${
          result.reliabilityScore >= 70
            ? isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/70 shadow-xs'
            : result.reliabilityScore >= 40
            ? isDark ? 'border-blue-500/30 bg-blue-950/20' : 'border-blue-200 bg-blue-50/70 shadow-xs'
            : isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50/70 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              result.reliabilityScore >= 70
                ? 'bg-emerald-500 text-white'
                : result.reliabilityScore >= 40
                ? 'bg-blue-500 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Validación Walk-Forward (Fuera de Muestra):
              </span>
              <span
                className={`rounded-xl px-2 py-0.5 text-xs font-black uppercase ${
                  result.reliabilityScore >= 70
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                    : result.reliabilityScore >= 40
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                Robustez {result.reliabilityLabel} ({result.reliabilityScore}/100)
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Calibración 70% histórico → Verificación 30% restante no visto (evita sobreajuste de curva).
            </p>
          </div>
        </div>

        {result.lowSampleWarning && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <span>Muestra limitada (n &lt; 30)</span>
          </div>
        )}
      </div>

      {/* 4 TOP PERFORMANCE METRICS (RESPONSIVE GRID) */}
      <div className="relative z-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Win Rate */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              1. Tasa de Acierto
            </span>
            <InfoTooltip
              text="Porcentaje de operaciones cerradas con ganancia neta positiva."
              title="Win Rate"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-xl sm:text-3xl font-black ${
                result.winRate >= 50 ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {result.winRate.toFixed(1)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Trades: <strong className="font-mono">{result.totalTrades}</strong></span>
            <span className="text-emerald-500 font-semibold">{result.winningTrades}W / {result.losingTrades}L</span>
          </div>
        </div>

        {/* KPI 2: Max Drawdown (Riesgo Controlado) */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              2. Caída Máxima (DD)
            </span>
            <InfoTooltip
              text="Pérdida máxima porcentual desde el punto más alto del balance en toda la simulación."
              title="Max Drawdown"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-xl sm:text-3xl font-black text-rose-500">
              -{result.maxDrawdown.toFixed(2)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Drawdown $: <strong className="font-mono">-{formatCurrency(result.maxDrawdownUSD)}</strong></span>
          </div>
        </div>

        {/* KPI 3: Retorno Total Neto de Estrategia */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              3. Retorno Estrategia
            </span>
            <InfoTooltip
              text="Rendimiento porcentual neto obtenido tras descontar todas las comisiones de compra/venta."
              title="Net Profit %"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span
              className={`font-mono text-xl sm:text-3xl font-black ${
                isNetProfitPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isNetProfitPositive ? '+' : ''}{result.totalNetProfitPct.toFixed(2)}%
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ({isNetProfitPositive ? '+' : ''}{formatCurrency(result.totalNetProfit)})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              B&H: {result.buyAndHoldProfitPct.toFixed(1)}%
            </span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                isStrategyWinner
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : isDark ? 'bg-[#2c2c2e] text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isStrategyWinner ? '¡Supera B&H!' : 'Defensiva'}
            </span>
          </div>
        </div>

        {/* KPI 4: Factor de Beneficio */}
        <div
          className={`relative rounded-3xl border p-4 sm:p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              4. Factor de Beneficio
            </span>
            <InfoTooltip
              text="Ganancias brutas divididas entre pérdidas brutas (> 1.5 es un excelente sistema cuantitativo)."
              title="Profit Factor"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-3xl font-black ${accent.textClass}`}>
              {result.profitFactor.toFixed(2)}x
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Comisiones: <strong className="font-mono">-{formatCurrency(result.totalFeesPaid)}</strong></span>
            <span className="text-emerald-500 font-bold">R:B 1:{result.riskRewardRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div
        className={`rounded-3xl border p-4 sm:p-5 shadow-sm transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Curva de Capital (Equity Curve) vs. Buy & Hold
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Evolución del balance con capital inicial y comisiones de Interactive Brokers
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${accent.bgClass}`} />
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Estrategia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Buy & Hold</span>
            </div>
          </div>
        </div>

        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent.hex} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={accent.hex} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2c2c2e' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
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
        className={`rounded-3xl border p-4 sm:p-5 shadow-sm transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="mb-3">
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Perfil de Riesgo: Caídas Submarinas (Drawdown %)
          </h4>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Porcentaje de retroceso desde el máximo histórico del balance en cada momento
          </p>
        </div>

        <div className="h-32 sm:h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={underwaterData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2c2c2e' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={9}
                tickLine={false}
                domain={[(dataMin: number) => Math.min(-1, Math.floor(dataMin * 1.15)), 0]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  borderColor: isDark ? '#3a3a3c' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Retroceso (Drawdown)']}
              />
              <Area
                type="monotone"
                dataKey="negativeDrawdownPct"
                stroke="#ff3b30"
                strokeWidth={1.8}
                fill="#ff3b30"
                fillOpacity={0.25}
                baseValue={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
