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
import { Asset, Candle } from '@/lib/types/market';
import { calculateADX, calculateEMA, calculateRSI } from '@/lib/quant/indicators';
import { getAssetTypeBadgeStyle, getTrendBadgeStyle } from '@/lib/ui/badge-styles';
import { useSettings } from '@/lib/context/settings-context';
import { useAlerts } from '@/lib/context/alerts-context';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  CheckCircle,
  Bell,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TradingChartProps {
  asset: Asset;
}

interface HoverData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  variationPct: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
}

const TIMEFRAMES = [
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1S' },
  { id: '1M', label: '1M' },
];

export function TradingChart({ asset }: TradingChartProps) {
  const { settings, accent, formatCurrency, updateSettings } = useSettings();
  const isDark = settings.theme === 'dark';
  const { getActiveAlertsCount, openAlertsModal } = useAlerts();
  const activeAlertsCount = getActiveAlertsCount(asset.id);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const adxContainerRef = useRef<HTMLDivElement>(null);

  // Timeframe interval state
  const [selectedInterval, setSelectedInterval] = useState<string>('1d');
  const [chartCandles, setChartCandles] = useState<Candle[]>(asset.candles || []);
  const [isLoadingInterval, setIsLoadingInterval] = useState(false);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const chartIndicators = settings.chartIndicators || {
    showEma20: true,
    showEma50: true,
    showEma200: true,
    showMarkers: true,
  };

  const [showEma20, setShowEma20] = useState(chartIndicators.showEma20);
  const [showEma50, setShowEma50] = useState(chartIndicators.showEma50);
  const [showEma200, setShowEma200] = useState(chartIndicators.showEma200);
  const [showMarkers, setShowMarkers] = useState(chartIndicators.showMarkers);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);

  // Sync indicator changes with persistent AppSettings
  const toggleEma20 = () => {
    const next = !showEma20;
    setShowEma20(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showEma20: next } });
  };

  const toggleEma50 = () => {
    const next = !showEma50;
    setShowEma50(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showEma50: next } });
  };

  const toggleEma200 = () => {
    const next = !showEma200;
    setShowEma200(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showEma200: next } });
  };

  const toggleMarkers = () => {
    const next = !showMarkers;
    setShowMarkers(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showMarkers: next } });
  };

  // Reset or fetch candles when asset or interval changes
  useEffect(() => {
    if (selectedInterval === '1d') {
      setChartCandles(asset.candles || []);
      setIntervalError(null);
      return;
    }

    setIsLoadingInterval(true);
    setIntervalError(null);

    const cleanSym = asset.symbol.replace('/', '').toUpperCase();
    fetch(`/api/market-data?symbol=${encodeURIComponent(cleanSym)}&type=${asset.type}&interval=${selectedInterval}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        if (data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
          setChartCandles(data.candles);
          setIntervalError(null);
        } else {
          throw new Error('No se encontraron velas para esta temporalidad.');
        }
      })
      .catch((err) => {
        console.warn(`[ChartTimeframe] Error loading ${selectedInterval} for ${asset.symbol}:`, err);
        setIntervalError(
          err.message ||
            `Este activo (${asset.symbol}) no tiene histórico disponible para la temporalidad ${selectedInterval}.`
        );
      })
      .finally(() => setIsLoadingInterval(false));
  }, [asset.id, asset.symbol, asset.type, asset.candles, selectedInterval]);

  const analysis = asset.analysis;
  const isPositiveChange = asset.change24hPct >= 0;

  // 1. Candlestick Chart Initialization
  useEffect(() => {
    if (!chartContainerRef.current || !chartCandles || chartCandles.length === 0) return;

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1c1c1e' : '#ffffff' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(56, 56, 58, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
        horzLines: { color: isDark ? 'rgba(56, 56, 58, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
        timeVisible: selectedInterval === '1h' || selectedInterval === '4h',
        secondsVisible: false,
      },
    });

    // Candlestick Series (Apple-inspired Pro theme colors)
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34c759',
      downColor: '#ff3b30',
      borderVisible: false,
      wickUpColor: '#34c759',
      wickDownColor: '#ff3b30',
    });

    const formattedCandles = chartCandles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(formattedCandles);

    // 2. Add EMA 20, EMA 50 & EMA 200 Series
    const closes = chartCandles.map((c) => c.close);
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
      color: '#6366f1',
      lineWidth: 2,
      title: 'EMA 200',
    });

    const formattedEma20 = chartCandles
      .map((c, i) => ({
        time: c.time as Time,
        value: ema20Data[i],
      }))
      .filter((d) => !isNaN(d.value));

    const formattedEma50 = chartCandles
      .map((c, i) => ({
        time: c.time as Time,
        value: ema50Data[i],
      }))
      .filter((d) => !isNaN(d.value));

    const formattedEma200 = chartCandles
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
      for (let i = 20; i < chartCandles.length; i++) {
        const c = chartCandles[i];
        const prevC = chartCandles[i - 1];
        const e20 = ema20Data[i];
        const rsi = rsiValues[i];

        if (c.close > e20 && prevC.close <= ema20Data[i - 1] && rsi < 55) {
          markers.push({
            time: c.time as Time,
            position: 'belowBar',
            color: '#34c759',
            shape: 'arrowUp',
            text: 'COMPRA',
          });
        } else if (c.close < e20 && prevC.close >= ema20Data[i - 1] && rsi > 55) {
          markers.push({
            time: c.time as Time,
            position: 'aboveBar',
            color: '#ff3b30',
            shape: 'arrowDown',
            text: 'VENTA',
          });
        }
      }
      candleSeries.setMarkers(markers);
    }

    // 4. Strategic Price Lines (Stop Loss & Take Profit)
    if (analysis) {
      candleSeries.createPriceLine({
        price: analysis.orderSetup.suggestedStopLoss,
        color: '#ff3b30',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `STOP LOSS (${formatCurrency(analysis.orderSetup.suggestedStopLoss)}) -${analysis.orderSetup.suggestedStopLossPct}%`,
      });

      candleSeries.createPriceLine({
        price: analysis.orderSetup.suggestedTakeProfit,
        color: '#34c759',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TAKE PROFIT (${formatCurrency(analysis.orderSetup.suggestedTakeProfit)}) +${analysis.orderSetup.suggestedTakeProfitPct}%`,
      });
    }

    // 5. Crosshair Hover Subscription with Variation Percentage
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
        const openVal = candleData.open;
        const closeVal = candleData.close;
        const variationPct = openVal ? ((closeVal - openVal) / openVal) * 100 : 0;

        setHoverData({
          time: param.time as string,
          open: openVal,
          high: candleData.high,
          low: candleData.low,
          close: closeVal,
          variationPct,
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
  }, [
    chartCandles,
    showEma20,
    showEma50,
    showEma200,
    showMarkers,
    analysis,
    isDark,
    selectedInterval,
    settings.currency,
    accent,
  ]);

  // 6. Subcharts: RSI (14)
  useEffect(() => {
    if (!rsiContainerRef.current || !chartCandles || chartCandles.length === 0) return;
    const container = rsiContainerRef.current;
    container.innerHTML = '';

    const closes = chartCandles.map((c) => c.close);
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
      color: '#a855f7',
      lineWidth: 2,
      title: 'RSI 14',
    });

    const formattedRsi = chartCandles
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
      title: '30 (Sobrevenda)',
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
  }, [chartCandles, isDark]);

  // 7. Subcharts: ADX (14)
  useEffect(() => {
    if (!adxContainerRef.current || !chartCandles || chartCandles.length === 0) return;
    const container = adxContainerRef.current;
    container.innerHTML = '';

    const { adx, plusDI, minusDI } = calculateADX(chartCandles, 14);

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

    const formattedAdx = chartCandles
      .map((c, i) => ({ time: c.time as Time, value: adx[i] }))
      .filter((d) => !isNaN(d.value));

    const formattedPlus = chartCandles
      .map((c, i) => ({ time: c.time as Time, value: plusDI[i] }))
      .filter((d) => !isNaN(d.value));

    const formattedMinus = chartCandles
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
  }, [chartCandles, isDark, accent]);

  // Active Candle for constant, non-jumping OHLC bar (hovered candle OR latest candle)
  const lastCandle = chartCandles.length > 0 ? chartCandles[chartCandles.length - 1] : null;
  const activeCandle = hoverData || (lastCandle ? {
    time: lastCandle.time,
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    close: lastCandle.close,
    variationPct: lastCandle.open ? ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100 : 0,
  } : null);

  return (
    <div className="space-y-4">
      {/* Unsupported Interval Error Warning Banner */}
      {intervalError && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold animate-fade-in ${
            isDark
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-amber-300 bg-amber-50 text-amber-900 shadow-xs'
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{intervalError}</span>
        </div>
      )}

      {/* 1. FIXED-HEIGHT, MINIMALIST TOP CONTROL BAR (Never shifts or jumps on hover) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-4 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-[#1c1c1e]'
            : 'border-slate-200/80 bg-white shadow-xs text-slate-900'
        }`}
      >
        {/* Left Side: Asset Identity & Current Price */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</h2>
              <span
                className={`rounded-xl border px-2 py-0.5 text-xs font-bold uppercase ${getAssetTypeBadgeStyle(asset.type, isDark)}`}
              >
                {asset.type}
              </span>
              {analysis && (
                <span
                  className={`rounded-xl px-2.5 py-0.5 text-xs font-semibold border ${getTrendBadgeStyle(analysis.trend, isDark).badgeClass}`}
                >
                  {analysis.trendLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(asset.price)}
              </span>
              <span className={`font-mono font-semibold text-[11px] ${isPositiveChange ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositiveChange ? '+' : ''}{asset.change24hPct.toFixed(2)}%
              </span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
              <span className={`truncate max-w-[140px] sm:max-w-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asset.name}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Fixed-Width Timeframes, Alerts & Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector (1H | 4H | 1D | 1S | 1M) */}
          <div
            className={`flex items-center gap-1 rounded-2xl border p-1 ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200 bg-slate-100'
            }`}
          >
            {TIMEFRAMES.map((tf) => {
              const isSelected = selectedInterval === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedInterval(tf.id)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-500 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
            {isLoadingInterval && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin mx-1" />}
          </div>

          {/* Price Alerts Bell Button */}
          <button
            type="button"
            onClick={() => openAlertsModal(asset)}
            className={`relative flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              activeAlertsCount > 0
                ? isDark
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/30'
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-300 hover:border-slate-700 hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-blue-500" />
            <span>Alertas</span>
            {activeAlertsCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Indicator Toggles */}
          <button
            onClick={toggleEma20}
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
            onClick={toggleEma200}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showEma200
                ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-400'
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-500'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>EMA 200</span>
          </button>

          <button
            onClick={toggleEma50}
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
            onClick={toggleMarkers}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              showMarkers
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500'
                : isDark
                ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-500'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Señales</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CANDLESTICK CANVAS CONTAINER WITH DEDICATED OHLC LEGEND BAR */}
      <div
        className={`relative overflow-hidden rounded-3xl border shadow-lg transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        {/* Sleek Fixed-Height OHLC Bar (TradingView Style, 0 Layout Shift) */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs font-mono transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          {activeCandle ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[11px] font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {hoverData ? 'Vela Seleccionada:' : 'Última Vela:'}
              </span>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>O:</span>{' '}
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatCurrency(activeCandle.open)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>H:</span>{' '}
                <span className="text-emerald-500 font-semibold">{formatCurrency(activeCandle.high)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>L:</span>{' '}
                <span className="text-rose-500 font-semibold">{formatCurrency(activeCandle.low)}</span>
              </div>
              <div>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>C:</span>{' '}
                <span className={`font-bold ${accent.textClass}`}>{formatCurrency(activeCandle.close)}</span>
              </div>
              <div className="border-l border-slate-700/40 pl-2.5">
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Var:</span>{' '}
                <span
                  className={`font-bold ${
                    activeCandle.variationPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {activeCandle.variationPct >= 0 ? '+' : ''}
                  {activeCandle.variationPct.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="h-4" />
          )}

          {/* Timeframe indicator badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
            <Clock className="h-3 w-3" />
            <span>Temporalidad: <strong className="text-blue-400 font-mono uppercase">{selectedInterval}</strong></span>
          </div>
        </div>

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
