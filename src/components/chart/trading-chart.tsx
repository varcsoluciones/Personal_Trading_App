'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ColorType,
  CrosshairMode,
  LineStyle,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { Asset } from '@/lib/types/market';
import { calculateADX, calculateEMA, calculateRSI } from '@/lib/quant/indicators';
import { useSettings } from '@/lib/context/settings-context';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  CheckCircle,
} from 'lucide-react';

interface TradingChartProps {
  asset: Asset;
}

export function TradingChart({ asset }: TradingChartProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const adxContainerRef = useRef<HTMLDivElement>(null);

  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [hoverData, setHoverData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
  } | null>(null);

  const analysis = asset.analysis;

  useEffect(() => {
    if (!chartContainerRef.current || !asset.candles || asset.candles.length === 0) {
      return;
    }

    const container = chartContainerRef.current;
    container.innerHTML = '';

    // Theme-based colors
    const chartBg = isDark ? '#1c1c1e' : '#ffffff';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(56, 56, 58, 0.4)' : 'rgba(226, 232, 240, 0.8)';
    const borderColor = isDark ? '#2c2c2e' : '#e2e8f0';
    const crosshairColor = accent.hex;

    // 1. Initialize Main Candlestick Chart
    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor,
        autoScale: true,
      },
      timeScale: {
        borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add Candlestick Series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34c759',
      downColor: '#ff3b30',
      borderUpColor: '#34c759',
      borderDownColor: '#ff3b30',
      wickUpColor: '#34c759',
      wickDownColor: '#ff3b30',
    });

    const formattedCandles = asset.candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(formattedCandles);

    // 2. Add EMA 20, EMA 50 & EMA 200 Series
    const closes = asset.candles.map((c) => c.close);
    const ema20Data = calculateEMA(closes, 20);
    const ema50Data = calculateEMA(closes, 50);
    const ema200Data = calculateEMA(closes, 200);

    const ema20Series = chart.addLineSeries({
      color: accent.hex,
      lineWidth: 2,
      title: 'EMA 20',
    });

    const ema50Series = chart.addLineSeries({
      color: '#ff9500',
      lineWidth: 2,
      title: 'EMA 50',
    });

    const ema200Series = chart.addLineSeries({
      color: '#5856d6',
      lineWidth: 2,
      title: 'EMA 200',
    });

    const formattedEma20 = asset.candles
      .map((c, i) => ({
        time: c.time as Time,
        value: ema20Data[i],
      }))
      .filter((d) => !isNaN(d.value));

    const formattedEma50 = asset.candles
      .map((c, i) => ({
        time: c.time as Time,
        value: ema50Data[i],
      }))
      .filter((d) => !isNaN(d.value));

    const formattedEma200 = asset.candles
      .map((c, i) => ({
        time: c.time as Time,
        value: ema200Data[i],
      }))
      .filter((d) => !isNaN(d.value));

    if (showEma20) ema20Series.setData(formattedEma20);
    if (showEma50) ema50Series.setData(formattedEma50);
    if (showEma200) ema200Series.setData(formattedEma200);

    // 3. Add Buy / Sell Signal Markers
    const rsiValues = calculateRSI(closes, 14);
    const markers: SeriesMarker<Time>[] = [];

    if (showMarkers) {
      for (let i = 40; i < asset.candles.length; i++) {
        const c = asset.candles[i];
        const prevC = asset.candles[i - 1];
        const e20 = ema20Data[i];
        const e50 = ema50Data[i];
        const r = rsiValues[i];
        const prevR = rsiValues[i - 1];

        // Buy Condition
        if (e20 > e50 && prevR <= 42 && r > prevR && c.close > e50) {
          markers.push({
            time: c.time as Time,
            position: 'belowBar',
            color: '#34c759',
            shape: 'arrowUp',
            text: 'COMPRA',
          });
        }
        // Sell Condition
        else if (r >= 70 || (e20 < e50 && prevC.close > e50 && c.close < e50)) {
          markers.push({
            time: c.time as Time,
            position: 'aboveBar',
            color: '#ff3b30',
            shape: 'arrowDown',
            text: 'VENTA',
          });
        }
      }

      if (markers.length > 0) {
        candleSeries.setMarkers(markers);
      }
    }

    // 4. Add Dynamic Stop Loss & Take Profit Price Lines
    if (analysis) {
      // Stop Loss Line
      candleSeries.createPriceLine({
        price: analysis.orderSetup.suggestedStopLoss,
        color: '#ff3b30',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `STOP LOSS (${formatCurrency(analysis.orderSetup.suggestedStopLoss)}) -${analysis.orderSetup.suggestedStopLossPct}%`,
      });

      // Take Profit Line
      candleSeries.createPriceLine({
        price: analysis.orderSetup.suggestedTakeProfit,
        color: '#34c759',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TAKE PROFIT (${formatCurrency(analysis.orderSetup.suggestedTakeProfit)}) +${analysis.orderSetup.suggestedTakeProfitPct}%`,
      });
    }

    // 5. Crosshair Hover Subscription
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries) as any;
      const ema20Val = param.seriesData.get(ema20Series) as any;
      const ema50Val = param.seriesData.get(ema50Series) as any;
      const ema200Val = param.seriesData.get(ema200Series) as any;

      if (candleData) {
        setHoverData({
          time: param.time as string,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          ema20: ema20Val?.value,
          ema50: ema50Val?.value,
          ema200: ema200Val?.value,
        });
      }
    });

    // Responsive Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [asset, showEma20, showEma50, showEma200, showMarkers, analysis, isDark, settings.currency, accent]);

  // 6. Subcharts: RSI (14)
  useEffect(() => {
    if (!rsiContainerRef.current || !asset.candles) return;
    const container = rsiContainerRef.current;
    container.innerHTML = '';

    const closes = asset.candles.map((c) => c.close);
    const rsiValues = calculateRSI(closes, 14);

    const rsiChart = createChart(container, {
      width: container.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1c1c1e' : '#ffffff' },
        textColor: isDark ? '#64748b' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(56, 56, 58, 0.3)' : 'rgba(226, 232, 240, 0.6)' },
        horzLines: { color: isDark ? 'rgba(56, 56, 58, 0.3)' : 'rgba(226, 232, 240, 0.6)' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
      },
    });

    const rsiSeries = rsiChart.addLineSeries({
      color: '#af52de',
      lineWidth: 2,
      title: 'RSI 14',
    });

    const formattedRsi = asset.candles
      .map((c, i) => ({
        time: c.time as Time,
        value: rsiValues[i],
      }))
      .filter((d) => !isNaN(d.value));

    rsiSeries.setData(formattedRsi);

    rsiSeries.createPriceLine({
      price: 70,
      color: '#ff3b30',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: '70 (Sobrecompra)',
    });

    rsiSeries.createPriceLine({
      price: 30,
      color: '#34c759',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: '30 (Sobreventa)',
    });

    rsiChart.timeScale().fitContent();

    const handleResize = () => {
      if (rsiContainerRef.current) {
        rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rsiChart.remove();
    };
  }, [asset, isDark]);

  // 7. Subcharts: ADX (14)
  useEffect(() => {
    if (!adxContainerRef.current || !asset.candles) return;
    const container = adxContainerRef.current;
    container.innerHTML = '';

    const { adx, plusDI, minusDI } = calculateADX(asset.candles, 14);

    const adxChart = createChart(container, {
      width: container.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1c1c1e' : '#ffffff' },
        textColor: isDark ? '#64748b' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(56, 56, 58, 0.3)' : 'rgba(226, 232, 240, 0.6)' },
        horzLines: { color: isDark ? 'rgba(56, 56, 58, 0.3)' : 'rgba(226, 232, 240, 0.6)' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
      },
    });

    const adxSeries = adxChart.addLineSeries({
      color: accent.hex,
      lineWidth: 2,
      title: 'ADX (Fuerza)',
    });

    const plusDISeries = adxChart.addLineSeries({
      color: '#34c759',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: '+DI',
    });

    const minusDISeries = adxChart.addLineSeries({
      color: '#ff3b30',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: '-DI',
    });

    const formattedAdx = asset.candles
      .map((c, i) => ({ time: c.time as Time, value: adx[i] }))
      .filter((d) => !isNaN(d.value));

    const formattedPlus = asset.candles
      .map((c, i) => ({ time: c.time as Time, value: plusDI[i] }))
      .filter((d) => !isNaN(d.value));

    const formattedMinus = asset.candles
      .map((c, i) => ({ time: c.time as Time, value: minusDI[i] }))
      .filter((d) => !isNaN(d.value));

    adxSeries.setData(formattedAdx);
    plusDISeries.setData(formattedPlus);
    minusDISeries.setData(formattedMinus);

    adxSeries.createPriceLine({
      price: 25,
      color: isDark ? '#e2e8f0' : '#475569',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '25 (Tendencia Fuerte)',
    });

    adxChart.timeScale().fitContent();

    const handleResize = () => {
      if (adxContainerRef.current) {
        adxChart.applyOptions({ width: adxContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      adxChart.remove();
    };
  }, [asset, isDark, accent]);

  return (
    <div className="space-y-4">
      {/* Chart Top Control Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-4 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-[#1c1c1e]'
            : 'border-slate-200/80 bg-white shadow-xs text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</h2>
              <span
                className={`rounded-xl px-2 py-0.5 text-xs font-bold uppercase ${
                  isDark ? 'bg-[#2c2c2e] text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {asset.type}
              </span>
              <span
                className={`rounded-xl px-2.5 py-0.5 text-xs font-semibold border ${
                  analysis?.trend === 'BULLISH'
                    ? isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : analysis?.trend === 'BEARISH'
                    ? isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                    : isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {analysis?.trendLabel}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asset.name}</p>
          </div>

          <div className={`hidden h-8 w-[1px] sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Current OHLC Hover Values */}
          {hoverData && (
            <div className="hidden gap-3 font-mono text-xs sm:flex">
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>O:</span>{' '}
                <span className={isDark ? 'text-white' : 'text-slate-800'}>{formatCurrency(hoverData.open || 0)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>H:</span>{' '}
                <span className="text-emerald-500">{formatCurrency(hoverData.high || 0)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>L:</span>{' '}
                <span className="text-rose-500">{formatCurrency(hoverData.low || 0)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>C:</span>{' '}
                <span className={`font-bold ${accent.textClass}`}>{formatCurrency(hoverData.close || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEma20(!showEma20)}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showEma20
                ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-500'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${accent.bgClass}`} />
            <span>EMA 20</span>
          </button>

          <button
            onClick={() => setShowEma200(!showEma200)}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showEma200
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : isDark
                ? "border-slate-800 bg-[#2c2c2e]/60 text-slate-500"
                : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>EMA 200</span>
          </button>

          <button
            onClick={() => setShowEma50(!showEma50)}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showEma50
                ? 'border-orange-500/50 bg-orange-500/15 text-orange-500'
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-500'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span>EMA 50</span>
          </button>

          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showMarkers
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500'
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-500'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Señales Compra/Venta</span>
          </button>
        </div>
      </div>

      {/* Main Candlestick Canvas Container */}
      <div
        className={`relative overflow-hidden rounded-3xl border shadow-lg transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Subcharts: RSI and ADX */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* RSI Subchart */}
        <div
          className={`rounded-3xl border p-4 shadow-sm transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Subgráfico: RSI (14 periodos)
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-purple-500">
              Valor: {analysis?.indicators.rsi}
            </span>
          </div>
          <div ref={rsiContainerRef} className="w-full" />
        </div>

        {/* ADX Subchart */}
        <div
          className={`rounded-3xl border p-4 shadow-sm transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${accent.bgClass}`} />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Subgráfico: ADX & Fuerza Direccional (+DI / -DI)
              </span>
            </div>
            <span className={`font-mono text-xs font-bold ${accent.textClass}`}>
              ADX: {analysis?.volatilityMetrics.adx}
            </span>
          </div>
          <div ref={adxContainerRef} className="w-full" />
        </div>
      </div>

      {/* Suggested Stop Loss & Take Profit Target Box */}
      {analysis && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Stop Loss Card */}
          <div
            className={`rounded-3xl border p-4 transition-all ${
              isDark
                ? 'border-rose-500/20 bg-rose-950/20'
                : 'border-rose-200 bg-rose-50/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 text-rose-500 mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Stop Loss Dinámico</span>
            </div>
            <div className={`font-mono text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(analysis.orderSetup.suggestedStopLoss)}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Distancia de Corte:</span>
              <span className="font-mono font-bold text-rose-500">-{analysis.orderSetup.suggestedStopLossPct}%</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Riesgo por unidad: -{formatCurrency(analysis.orderSetup.potentialRiskUSD)}
            </div>
          </div>

          {/* Take Profit Card */}
          <div
            className={`rounded-3xl border p-4 transition-all ${
              isDark
                ? 'border-emerald-500/20 bg-emerald-950/20'
                : 'border-emerald-200 bg-emerald-50/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Take Profit Sugerido</span>
            </div>
            <div className={`font-mono text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(analysis.orderSetup.suggestedTakeProfit)}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Objetivo de Ganancia:</span>
              <span className="font-mono font-bold text-emerald-500">+{analysis.orderSetup.suggestedTakeProfitPct}%</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Beneficio por unidad: +{formatCurrency(analysis.orderSetup.potentialRewardUSD)}
            </div>
          </div>

          {/* Risk Reward Ratio Card */}
          <div
            className={`rounded-3xl border p-4 transition-all ${
              isDark
                ? `${accent.borderClass} ${accent.tintBgClass}`
                : `${accent.borderClass} ${accent.tintBgClass} shadow-xs`
            }`}
          >
            <div className={`flex items-center gap-2 ${accent.textClass} mb-1`}>
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Relación Riesgo / Beneficio</span>
            </div>
            <div className={`font-mono text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              1 : {analysis.orderSetup.riskRewardRatio}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Eficiencia Matemática:</span>
              <span className="font-bold text-emerald-500">Favorable (&gt; 1:2.0)</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Gestión de riesgo asimétrica institucional
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
