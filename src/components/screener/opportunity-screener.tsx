'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Flame,
  Zap,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Filter,
  Target,
  Shield,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Asset, AssetCategory } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface OpportunityScreenerProps {
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  onOpenChart: (id: string) => void;
  onOpenBacktest: (id: string) => void;
}

export function OpportunityScreener({
  assets,
  onSelectAsset,
  onOpenChart,
  onOpenBacktest,
}: OpportunityScreenerProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'crypto' | 'stock' | 'etf'>('all');

  const categories = [
    {
      id: 'all',
      name: 'Todas las Oportunidades',
      icon: Sparkles,
      description: 'Todos los activos clasificados por el algoritmo Opportunity Score (0-100).',
    },
    {
      id: 'stable',
      name: 'Más Estables / Conservadores',
      icon: ShieldCheck,
      description: 'Menor volatilidad (ATR bajo), ideales para seguimiento a largo plazo o swing trading seguro.',
    },
    {
      id: 'range',
      name: 'Mejores para Rango / Laterales',
      icon: Activity,
      description: 'Activos con ADX < 20, ideales para operar rebotes de RSI en soportes y resistencias.',
    },
    {
      id: 'trend',
      name: 'Mejores para Tendencia Fuerte',
      icon: TrendingUp,
      description: 'Activos con ADX > 25 y EMAs alineadas, ideales para compras en retrocesos (pullbacks).',
    },
    {
      id: 'volatile',
      name: 'Alta Volatilidad / Alto Riesgo',
      icon: Flame,
      description: 'Movimientos amplios recientes y alto ATR para trading dinámico y momentum de corto plazo.',
    },
  ];

  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (!asset.analysis) return false;
        const matchesCategory =
          activeCategory === 'all' || asset.analysis.opportunityCategory === activeCategory;
        const matchesType = selectedType === 'all' || asset.type === selectedType;
        return matchesCategory && matchesType;
      })
      .sort((a, b) => (b.analysis?.opportunityScore || 0) - (a.analysis?.opportunityScore || 0));
  }, [assets, activeCategory, selectedType]);

  return (
    <div className="space-y-6">
      {/* Category Pills Header (iOS Style) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = assets.filter((a) =>
            cat.id === 'all' ? true : a.analysis?.opportunityCategory === cat.id
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex flex-col justify-between rounded-3xl border p-4 text-left transition-all ${
                isActive
                  ? isDark
                    ? `${accent.borderClass} bg-[#1c1c1e] shadow-lg ${accent.ringClass} ring-1`
                    : `${accent.borderClass} bg-white shadow-md ${accent.ringClass} ring-1`
                  : isDark
                  ? 'border-slate-800/80 bg-[#1c1c1e]/70 hover:border-slate-700 hover:bg-[#2c2c2e]/60'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`rounded-2xl p-2.5 ${
                    isActive
                      ? `${accent.bgClass} text-white`
                      : isDark
                      ? 'bg-[#2c2c2e] text-slate-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
                    isDark ? 'bg-[#2c2c2e] text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </div>
              <div className="mt-3">
                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h3>
                <p className={`text-[11px] line-clamp-2 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cat.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar by Asset Type */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border px-5 py-3 backdrop-blur-md transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white shadow-xs text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Filter className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Filtrar por Mercado:
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {(['all', 'crypto', 'stock', 'etf'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedType === t
                    ? `${accent.bgClass} text-white shadow-xs font-bold`
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#2c2c2e]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t === 'all' ? 'Todos' : t}
              </button>
            ))}
          </div>
        </div>

        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Mostrando <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{filteredAssets.length}</span> activos ordenados por{' '}
          <strong className={accent.textClass}>Opportunity Score</strong>
        </div>
      </div>

      {/* Asset Opportunity Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset, index) => {
          const analysis = asset.analysis;
          if (!analysis) return null;

          const order = analysis.orderSetup;

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset.id)}
              className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-800/80 bg-[#1c1c1e] hover:border-slate-700 hover:shadow-xl'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Ranking Badge & Score Circle */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isDark ? 'bg-[#2c2c2e] text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span
                      className={`rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isDark ? 'border-slate-700 bg-[#2c2c2e]/60 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {analysis.categoryLabel}
                    </span>
                  </div>

                  {/* Opportunity Score Pill */}
                  <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`}>
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Score: {analysis.opportunityScore}/100</span>
                  </div>
                </div>

                {/* Symbol & Price */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</h4>
                      <span className={`text-xs uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({asset.type})</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asset.name}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(asset.price)}
                    </div>
                    <div
                      className={`font-mono text-xs font-semibold ${
                        asset.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {asset.change24hPct >= 0 ? '+' : ''}{asset.change24hPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className={`my-3 h-[1px] ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`} />

                {/* ========================================================== */}
                {/* VALORES EXACTOS DE LA OPORTUNIDAD DETECTADA POR LA APP */}
                {/* ========================================================== */}
                <div
                  className={`rounded-2xl border p-3.5 space-y-2.5 mb-3 transition-colors ${
                    isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Plan de Entrada & Salida</span>
                    <span className="text-blue-500 font-mono">R:B 1:{order.riskRewardRatio}</span>
                  </div>

                  {/* 1. Compra Recomendada */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-blue-500 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Compra (Entrada):</span>
                    </div>
                    <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(order.currentPrice)}
                    </span>
                  </div>

                  {/* 2. Take Profit (Venta para Salir) */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <Target className="h-3.5 w-3.5" />
                      <span>Take Profit (Salida):</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-500">
                        {formatCurrency(order.suggestedTakeProfit)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">
                        (+{order.suggestedTakeProfitPct}%)
                      </span>
                    </div>
                  </div>

                  {/* 3. Stop Loss Configurable */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Stop Loss Sugerido:</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-500">
                        {formatCurrency(order.suggestedStopLoss)}
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold ml-1">
                        (-{order.suggestedStopLossPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Risk / Reward USD Breakdown */}
                  <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span>Ganancia por unidad: <strong className="text-emerald-500">+{formatCurrency(order.potentialRewardUSD)}</strong></span>
                    <span>Riesgo máx: <strong className="text-rose-500">-{formatCurrency(order.potentialRiskUSD)}</strong></span>
                  </div>
                </div>

                {/* Score Reason Banner */}
                <div
                  className={`rounded-2xl border p-2.5 text-[11px] ${
                    isDark ? 'bg-[#2c2c2e]/20 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{analysis.signalReason}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`mt-4 pt-3 border-t flex items-center gap-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAsset(asset.id);
                    onOpenChart(asset.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
                    isDark
                      ? 'border-slate-700/80 bg-[#2c2c2e]/70 text-white hover:bg-[#3a3a3c]'
                      : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  <span>Ver Gráfico</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAsset(asset.id);
                    onOpenBacktest(asset.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border py-2 text-xs font-bold transition-all ${
                    isDark
                      ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} hover:opacity-90`
                      : `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass} hover:opacity-90`
                  }`}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Simular Backtest</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
