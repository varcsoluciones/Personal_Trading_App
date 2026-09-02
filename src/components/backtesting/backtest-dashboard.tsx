'use client';

import React from 'react';
import { BacktestResult } from '@/lib/types/market';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';

interface BacktestDashboardProps {
  result: BacktestResult | null;
  symbol?: string;
  onOpenGuide?: () => void;
}

function InfoTooltip({ text, title }: { text: string; title: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-blue-500 transition-colors"
        aria-label="Info"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-60 rounded-2xl border border-slate-700/80 bg-[#1c1c1e] p-3 text-xs text-slate-200 shadow-xl backdrop-blur-xl">
          <p className="font-bold text-white mb-1">{title}</p>
          <p className="text-slate-300 leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}

export function BacktestDashboard({ result }: BacktestDashboardProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  if (!result) {
    return (
      <div
        className={`flex h-48 items-center justify-center rounded-3xl border ${
          isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'
        }`}
      >
        <p className="text-xs text-slate-500">Cargando datos para el backtest...</p>
      </div>
    );
  }

  const isStrategyWinner = result.totalNetProfitPct > result.buyAndHoldProfitPct;
  const isPositiveReturn = result.totalNetProfitPct >= 0;

  return (
    <div className="space-y-6">
      {/* 4 Main KPI Cards (Apple iOS Style) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Win Rate */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tasa de Acierto</span>
            <InfoTooltip text="Porcentaje de operaciones cerradas con ganancia sobre el total de trades ejecutados." title="Win Rate %" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-emerald-500">
              {result.winRate.toFixed(1)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Ganadas: <strong className="text-emerald-500">{result.winningTrades}</strong></span>
            <span>Perdidas: <strong className="text-rose-500">{result.losingTrades}</strong></span>
            <span>Total: <strong>{result.totalTrades}</strong></span>
          </div>
        </div>

        {/* KPI 2: Strategy Return vs Buy & Hold */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Retorno Estrategia</span>
            <InfoTooltip text="Rendimiento neto de la estrategia quant tras deducir comisiones y deslizamiento." title="Retorno Total %" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-black ${
                isPositiveReturn ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isPositiveReturn ? '+' : ''}{result.totalNetProfitPct.toFixed(2)}%
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Buy & Hold: <strong className="font-mono">{result.buyAndHoldProfitPct.toFixed(2)}%</strong></span>
            <span
              className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                isStrategyWinner
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : isDark ? 'bg-[#2c2c2e] text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isStrategyWinner ? '¡Supera Benchmark!' : 'Estrategia Defensiva'}
            </span>
          </div>
        </div>

        {/* KPI 3: Max Drawdown */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Máxima Caída</span>
            <InfoTooltip text="La mayor pérdida acumulada de la cuenta desde un pico máximo hasta un fondo." title="Max Drawdown %" />
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

        {/* KPI 4: Profit Factor */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Factor de Beneficio</span>
            <InfoTooltip text="Ganancias brutas divididas entre pérdidas brutas (> 1.5 es un excelente sistema cuantitativo)." title="Profit Factor" />
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
              Evolución del balance con $1,000 USD iniciales y deducción de fricción real
            </p>
          </div>

          {/* Legend */}
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
