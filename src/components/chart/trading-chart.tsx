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
  LogicalRange,
} from 'lightweight-charts';
import { Asset, Candle } from '@/lib/types/market';
import {
  calculateADX,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from '@/lib/quant/indicators';
import { getTrendBadgeStyle, getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { useSettings } from '@/lib/context/settings-context';
import { useAlerts } from '@/lib/context/alerts-context';
import { AssetDropdownSelect } from '@/components/shared/asset-dropdown-select';
import { ChartExecutiveAnalysis } from './chart-executive-analysis';
import {
  TrendingUp,
  Shield,
  Target,
  CheckCircle,
  Bell,
  Clock,
  AlertCircle,
  Loader2,
  BarChart2,
  Activity,
  Layers,
  LogIn,
} from 'lucide-react';

interface TradingChartProps {
  asset: Asset;
  assets?: Asset[];
  onSelectAsset?: (id: string) => void;
}

interface HoverData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  variationPct: number;
  volume?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  bollUpper?: number;
  bollMiddle?: number;
  bollLower?: number;
  rsi?: number;
  adx?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
}

const TIMEFRAMES = [
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1S' },
  { id: '1M', label: '1M' },
];

export function TradingChart({ asset, assets, onSelectAsset }: TradingChartProps) {
  const { settings, accent, formatCurrency, updateSettings } = useSettings();
  const isDark = settings.theme === 'dark';
  const { getActiveAlertsCount, openAlertsModal } = useAlerts();
  const activeAlertsCount = getActiveAlertsCount(asset.id);

  // Chart Container DOM Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const adxContainerRef = useRef<HTMLDivElement>(null);

  // Synchronization References
  const activeChartsRef = useRef<IChartApi[]>([]);
  const isSyncingRangeRef = useRef<boolean>(false);
  const lastVisibleRangeRef = useRef<LogicalRange | null>(null);
  const lastAssetIdRef = useRef<string>(asset.id);
  const lastIntervalRef = useRef<string>('1d');

  // Timeframe interval state
  const [selectedInterval, setSelectedInterval] = useState<string>('1d');
  const [chartCandles, setChartCandles] = useState<Candle[]>(asset.candles || []);
  const [isLoadingInterval, setIsLoadingInterval] = useState(false);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const chartIndicators = {
    showEma20: true,
    showEma50: true,
    showEma200: true,
    showBollinger: true,
    showMarkers: true,
    showVolume: true,
    showMacd: true,
    showRsi: true,
    showAdx: true,
    ...settings.chartIndicators,
  };

  const [showEma20, setShowEma20] = useState(chartIndicators.showEma20);
  const [showEma50, setShowEma50] = useState(chartIndicators.showEma50);
  const [showEma200, setShowEma200] = useState(chartIndicators.showEma200);
  const [showBollinger, setShowBollinger] = useState(chartIndicators.showBollinger);
  const [showMarkers, setShowMarkers] = useState(chartIndicators.showMarkers);
  const [showVolume, setShowVolume] = useState(chartIndicators.showVolume);
  const [showMacd, setShowMacd] = useState(chartIndicators.showMacd);
  const [showRsi, setShowRsi] = useState(chartIndicators.showRsi);
  const [showAdx, setShowAdx] = useState(chartIndicators.showAdx);

  const [hoverData, setHoverData] = useState<HoverData | null>(null);

  // Toggle Handlers
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

  const toggleBollinger = () => {
    const next = !showBollinger;
    setShowBollinger(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showBollinger: next } });
  };

  const toggleMarkers = () => {
    const next = !showMarkers;
    setShowMarkers(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showMarkers: next } });
  };

  const toggleVolume = () => {
    const next = !showVolume;
    setShowVolume(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showVolume: next } });
  };

  const toggleMacd = () => {
    const next = !showMacd;
    setShowMacd(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showMacd: next } });
  };

  const toggleRsi = () => {
    const next = !showRsi;
    setShowRsi(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showRsi: next } });
  };

  const toggleAdx = () => {
    const next = !showAdx;
    setShowAdx(next);
    updateSettings({ chartIndicators: { ...chartIndicators, showAdx: next } });
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

  // Unified Multi-Chart Initialization & Synchronization
  useEffect(() => {
    if (!chartContainerRef.current || !chartCandles || chartCandles.length === 0) return;

    // Reset list of active synchronized chart instances
    const createdCharts: IChartApi[] = [];
    activeChartsRef.current = [];

    const isMobile = window.innerWidth < 640;
    const mainChartHeight = isMobile ? 320 : 440;
    const subchartHeight = isMobile ? 95 : 110;

    // Common TimeScale options to ensure exact horizontal and vertical pixel alignment
    const commonTimeScale = {
      borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
      timeVisible: selectedInterval === '1h' || selectedInterval === '4h',
      secondsVisible: false,
      rightOffset: 12,
      barSpacing: 6,
      fixLeftEdge: false,
      fixRightEdge: false,
    };

    const commonGrid = {
      vertLines: { color: isDark ? 'rgba(56, 56, 58, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
      horzLines: { color: isDark ? 'rgba(56, 56, 58, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
    };

    const commonLayout = {
      background: { type: ColorType.Solid, color: isDark ? '#1c1c1e' : '#ffffff' },
      textColor: isDark ? '#94a3b8' : '#64748b',
    };

    const closes = chartCandles.map((c) => c.close);
    const ema20Data = calculateEMA(closes, 20);
    const ema50Data = calculateEMA(closes, 50);
    const ema200Data = calculateEMA(closes, 200);
    const { upper: bollUpper, middle: bollMiddle, lower: bollLower } = calculateBollingerBands(closes, 20, 2);
    const rsiValues = calculateRSI(closes, 14);
    const { adx: adxValues, plusDI, minusDI } = calculateADX(chartCandles, 14);
    const { macdLine, signalLine, histogram: macdHist } = calculateMACD(chartCandles, 12, 26, 9);

    // ==========================================
    // 1. MAIN CANDLESTICK, EMA & BOLL CHART
    // ==========================================
    const mainContainer = chartContainerRef.current;
    mainContainer.innerHTML = '';

    const mainChart = createChart(mainContainer, {
      width: mainContainer.clientWidth,
      height: mainChartHeight,
      layout: commonLayout,
      grid: commonGrid,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: commonTimeScale,
    });
    createdCharts.push(mainChart);

    const candleSeries = mainChart.addCandlestickSeries({
      upColor: '#34c759',
      downColor: '#ff3b30',
      borderVisible: false,
      wickUpColor: '#34c759',
      wickDownColor: '#ff3b30',
    });

    candleSeries.setData(
      chartCandles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // EMAs
    const ema20Series = mainChart.addLineSeries({ color: accent.hex, lineWidth: 2, title: 'EMA 20' });
    const ema50Series = mainChart.addLineSeries({ color: '#ff9500', lineWidth: 2, title: 'EMA 50' });
    const ema200Series = mainChart.addLineSeries({ color: '#6366f1', lineWidth: 2, title: 'EMA 200' });

    if (showEma20) {
      ema20Series.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: ema20Data[i] }))
          .filter((d) => !isNaN(d.value))
      );
    }
    if (showEma50) {
      ema50Series.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: ema50Data[i] }))
          .filter((d) => !isNaN(d.value))
      );
    }
    if (showEma200) {
      ema200Series.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: ema200Data[i] }))
          .filter((d) => !isNaN(d.value))
      );
    }

    // BOLLINGER BANDS (20, 2)
    const bollUpperSeries = mainChart.addLineSeries({
      color: '#0ea5e9',
      lineWidth: 1,
      title: 'BOLL Sup',
    });
    const bollMiddleSeries = mainChart.addLineSeries({
      color: isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BOLL Media',
    });
    const bollLowerSeries = mainChart.addLineSeries({
      color: '#0ea5e9',
      lineWidth: 1,
      title: 'BOLL Inf',
    });

    if (showBollinger) {
      bollUpperSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: bollUpper[i] }))
          .filter((d) => !isNaN(d.value))
      );
      bollMiddleSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: bollMiddle[i] }))
          .filter((d) => !isNaN(d.value))
      );
      bollLowerSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: bollLower[i] }))
          .filter((d) => !isNaN(d.value))
      );
    }

    // Markers
    if (showMarkers) {
      const markers: SeriesMarker<Time>[] = [];
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

    // Price Lines
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

    // ==========================================
    // 2. VOLUME SUBCHART (Instantly Below Main)
    // ==========================================
    if (showVolume && volumeContainerRef.current) {
      const volContainer = volumeContainerRef.current;
      volContainer.innerHTML = '';

      const volumeChart = createChart(volContainer, {
        width: volContainer.clientWidth,
        height: subchartHeight,
        layout: commonLayout,
        grid: commonGrid,
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
          scaleMargins: { top: 0.1, bottom: 0.05 },
        },
        timeScale: commonTimeScale,
      });

      const volumeSeries = volumeChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.setData(
        chartCandles.map((c) => ({
          time: c.time as Time,
          value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(52, 199, 89, 0.75)' : 'rgba(255, 59, 48, 0.75)',
        }))
      );

      createdCharts.push(volumeChart);
    }

    // ==========================================
    // 3. MACD SUBCHART (Visual Reference)
    // ==========================================
    if (showMacd && macdContainerRef.current) {
      const macdContainer = macdContainerRef.current;
      macdContainer.innerHTML = '';

      const macdChart = createChart(macdContainer, {
        width: macdContainer.clientWidth,
        height: subchartHeight,
        layout: commonLayout,
        grid: commonGrid,
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
          scaleMargins: { top: 0.15, bottom: 0.15 },
        },
        timeScale: commonTimeScale,
      });

      // MACD Histogram
      const macdHistSeries = macdChart.addHistogramSeries({
        priceScaleId: '',
        title: 'Hist',
      });
      macdHistSeries.setData(
        chartCandles
          .map((c, i) => ({
            time: c.time as Time,
            value: isNaN(macdHist[i]) ? 0 : macdHist[i],
            color: (macdHist[i] || 0) >= 0 ? 'rgba(52, 199, 89, 0.75)' : 'rgba(255, 59, 48, 0.75)',
          }))
          .filter((d) => !isNaN(d.value))
      );

      // MACD Fast Line (12,26)
      const macdFastSeries = macdChart.addLineSeries({
        color: '#007aff',
        lineWidth: 2,
        title: 'MACD',
      });
      macdFastSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: macdLine[i] }))
          .filter((d) => !isNaN(d.value))
      );

      // MACD Signal Line (9)
      const macdSignalSeries = macdChart.addLineSeries({
        color: '#ff9500',
        lineWidth: 2,
        title: 'Signal',
      });
      macdSignalSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: signalLine[i] }))
          .filter((d) => !isNaN(d.value))
      );

      macdFastSeries.createPriceLine({
        price: 0,
        color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false,
      });

      createdCharts.push(macdChart);
    }

    // ==========================================
    // 4. RSI (14) SUBCHART
    // ==========================================
    if (showRsi && rsiContainerRef.current) {
      const rsiContainer = rsiContainerRef.current;
      rsiContainer.innerHTML = '';

      const rsiChart = createChart(rsiContainer, {
        width: rsiContainer.clientWidth,
        height: subchartHeight,
        layout: commonLayout,
        grid: commonGrid,
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: commonTimeScale,
      });

      const rsiSeries = rsiChart.addLineSeries({
        color: '#a855f7',
        lineWidth: 2,
        title: 'RSI 14',
      });

      rsiSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: rsiValues[i] }))
          .filter((d) => !isNaN(d.value))
      );

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

      createdCharts.push(rsiChart);
    }

    // ==========================================
    // 5. ADX (14) SUBCHART
    // ==========================================
    if (showAdx && adxContainerRef.current) {
      const adxContainer = adxContainerRef.current;
      adxContainer.innerHTML = '';

      const adxChart = createChart(adxContainer, {
        width: adxContainer.clientWidth,
        height: subchartHeight,
        layout: commonLayout,
        grid: commonGrid,
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: commonTimeScale,
      });

      const adxSeries = adxChart.addLineSeries({
        color: '#ff9500',
        lineWidth: 2,
        title: 'ADX',
      });

      const plusDISeries = adxChart.addLineSeries({
        color: '#34c759',
        lineWidth: 1,
        title: '+DI',
      });

      const minusDISeries = adxChart.addLineSeries({
        color: '#ff3b30',
        lineWidth: 1,
        title: '-DI',
      });

      adxSeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: adxValues[i] }))
          .filter((d) => !isNaN(d.value))
      );

      plusDISeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: plusDI[i] }))
          .filter((d) => !isNaN(d.value))
      );

      minusDISeries.setData(
        chartCandles
          .map((c, i) => ({ time: c.time as Time, value: minusDI[i] }))
          .filter((d) => !isNaN(d.value))
      );

      adxSeries.createPriceLine({
        price: 25,
        color: isDark ? '#64748b' : '#94a3b8',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: '25 (Fuerza)',
      });

      createdCharts.push(adxChart);
    }

    // =========================================================================
    // BIDIRECTIONAL TIME SCALE & CROSSHAIR SYNCHRONIZATION ACROSS ALL INSTANCES
    // =========================================================================
    activeChartsRef.current = createdCharts;

    createdCharts.forEach((chart) => {
      // 1. Time Range Synchronization (Zoom / Pan) with Persistent State
      chart.timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
        if (range) {
          lastVisibleRangeRef.current = range;
        }
        if (isSyncingRangeRef.current || !range) return;
        isSyncingRangeRef.current = true;
        activeChartsRef.current.forEach((targetChart) => {
          if (targetChart !== chart) {
            try {
              targetChart.timeScale().setVisibleLogicalRange(range);
            } catch (err) {
              // ignore
            }
          }
        });
        isSyncingRangeRef.current = false;
      });

      // 2. Crosshair Movement Synchronization (Header Hover Readout)
      chart.subscribeCrosshairMove((param) => {
        if (!param.time) {
          setHoverData(null);
          return;
        }

        const idx = chartCandles.findIndex((c) => c.time === param.time);
        if (idx !== -1) {
          const candle = chartCandles[idx];
          const openVal = candle.open;
          const closeVal = candle.close;
          const variationPct = openVal ? ((closeVal - openVal) / openVal) * 100 : 0;

          setHoverData({
            time: candle.time,
            open: openVal,
            high: candle.high,
            low: candle.low,
            close: closeVal,
            variationPct,
            volume: candle.volume,
            ema20: !isNaN(ema20Data[idx]) ? ema20Data[idx] : undefined,
            ema50: !isNaN(ema50Data[idx]) ? ema50Data[idx] : undefined,
            ema200: !isNaN(ema200Data[idx]) ? ema200Data[idx] : undefined,
            bollUpper: !isNaN(bollUpper[idx]) ? bollUpper[idx] : undefined,
            bollMiddle: !isNaN(bollMiddle[idx]) ? bollMiddle[idx] : undefined,
            bollLower: !isNaN(bollLower[idx]) ? bollLower[idx] : undefined,
            rsi: !isNaN(rsiValues[idx]) ? Number(rsiValues[idx].toFixed(1)) : undefined,
            adx: !isNaN(adxValues[idx]) ? Number(adxValues[idx].toFixed(1)) : undefined,
            macd: !isNaN(macdLine[idx]) ? Number(macdLine[idx].toFixed(2)) : undefined,
            macdSignal: !isNaN(signalLine[idx]) ? Number(signalLine[idx].toFixed(2)) : undefined,
            macdHist: !isNaN(macdHist[idx]) ? Number(macdHist[idx].toFixed(2)) : undefined,
          });
        }
      });
    });

    // Preserve existing Zoom & Pan Viewport if toggling indicators on the same asset and timeframe
    const preservedRange = lastVisibleRangeRef.current;
    const isSameAssetAndInterval =
      lastAssetIdRef.current === asset.id &&
      lastIntervalRef.current === selectedInterval;

    if (preservedRange && isSameAssetAndInterval) {
      createdCharts.forEach((c) => {
        try {
          c.timeScale().setVisibleLogicalRange(preservedRange);
        } catch (err) {
          c.timeScale().fitContent();
        }
      });
    } else {
      mainChart.timeScale().fitContent();
      lastAssetIdRef.current = asset.id;
      lastIntervalRef.current = selectedInterval;
      lastVisibleRangeRef.current = null;
    }

    // Responsive Resize Handler
    const handleResize = () => {
      const isMob = window.innerWidth < 640;
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        mainChart.applyOptions({ width, height: isMob ? 320 : 440 });
        createdCharts.forEach((c) => {
          if (c !== mainChart) {
            c.applyOptions({ width, height: isMob ? 95 : 110 });
          }
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      createdCharts.forEach((c) => c.remove());
      activeChartsRef.current = [];
    };
  }, [
    chartCandles,
    showEma20,
    showEma50,
    showEma200,
    showBollinger,
    showMarkers,
    showVolume,
    showMacd,
    showRsi,
    showAdx,
    analysis,
    isDark,
    selectedInterval,
    settings.currency,
    accent,
  ]);

  const lastCandle = chartCandles.length > 0 ? chartCandles[chartCandles.length - 1] : null;
  const activeCandle = hoverData || (lastCandle ? {
    time: lastCandle.time,
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    close: lastCandle.close,
    variationPct: lastCandle.open ? ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100 : 0,
    volume: lastCandle.volume,
    ema20: undefined,
    ema50: undefined,
    ema200: undefined,
  } : null);

  return (
    <div className="space-y-4">
      {/* 1. Header Card: Asset Info, Controls & Indicators Bar */}
      <div
        className={`relative z-30 rounded-3xl border p-4 sm:p-5 shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Top Row: Asset Selector, Live Price & Action Buttons */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Asset Dropdown Selector */}
              {assets && onSelectAsset ? (
                <AssetDropdownSelect
                  assets={assets}
                  selectedAsset={asset}
                  onSelectAsset={onSelectAsset}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {asset.symbol}
                  </span>
                  <span className={`rounded-xl border px-2 py-0.5 text-xs font-bold uppercase ${getAssetTypeBadgeStyle(asset.type, isDark)}`}>
                    {asset.type}
                  </span>
                </div>
              )}

              {analysis && (
                <div className="flex items-center gap-2">
                  <span className={`rounded-xl border px-2.5 py-1 text-xs font-bold ${getTrendBadgeStyle(analysis.trend, isDark)}`}>
                    {analysis.trendLabel}
                  </span>
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${accent.tintBgClass} ${accent.textClass}`}>
                    Score: {analysis.opportunityScore}
                  </span>
                </div>
              )}
            </div>

            {/* Price Info & Quick Alerts Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-left sm:text-right">
                <div className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(asset.price)}
                </div>
                <div className={`font-mono text-xs font-bold ${asset.change24hPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {asset.change24hPct >= 0 ? '+' : ''}{asset.change24hPct.toFixed(2)}% (24h)
                </div>
              </div>

              {/* Price Alerts Bell Button */}
              <button
                type="button"
                onClick={() => openAlertsModal(asset)}
                className={`relative flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shrink-0 ${
                  activeAlertsCount > 0
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/30'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-300 hover:bg-[#2c2c2e] hover:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="hidden sm:inline">Alertas</span>
                {activeAlertsCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Timeframes & Indicators Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/40">
            {/* Timeframes Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-horizontal-scrollbar pb-1">
              <span className={`text-[11px] font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Temporalidad:
              </span>
              <div className={`flex items-center p-0.5 rounded-2xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200 bg-slate-100'}`}>
                {TIMEFRAMES.map((tf) => {
                  const isSelected = selectedInterval === tf.id;
                  return (
                    <button
                      key={tf.id}
                      type="button"
                      disabled={isLoadingInterval}
                      onClick={() => setSelectedInterval(tf.id)}
                      className={`relative px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1c1c1e] text-white shadow-xs'
                            : 'bg-white text-slate-900 shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      } ${isLoadingInterval ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {tf.label}
                    </button>
                  );
                })}
              </div>

              {isLoadingInterval && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 ml-1" />
              )}
            </div>

            {/* Indicators & Subchart Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto custom-horizontal-scrollbar pb-1">
              <span className={`text-[11px] font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Indicadores:
              </span>

              {/* EMA 20 */}
              <button
                type="button"
                onClick={toggleEma20}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showEma20
                    ? `${accent.borderClass} ${accent.tintBgClass} ${accent.textClass}`
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                EMA 20
              </button>

              {/* EMA 50 */}
              <button
                type="button"
                onClick={toggleEma50}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showEma50
                    ? 'border-orange-500/40 bg-orange-500/15 text-orange-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                EMA 50
              </button>

              {/* EMA 200 */}
              <button
                type="button"
                onClick={toggleEma200}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showEma200
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                EMA 200
              </button>

              {/* BOLLINGER BANDS (20, 2) */}
              <button
                type="button"
                onClick={toggleBollinger}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showBollinger
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                BOLL (20, 2)
              </button>

              {/* Signals */}
              <button
                type="button"
                onClick={toggleMarkers}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showMarkers
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                Señales
              </button>

              {/* Subcharts Divider */}
              <div className={`h-4 w-[1px] mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

              {/* Volume Toggle */}
              <button
                type="button"
                onClick={toggleVolume}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showVolume
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <BarChart2 className="h-3 w-3" />
                <span>Volumen</span>
              </button>

              {/* MACD Toggle */}
              <button
                type="button"
                onClick={toggleMacd}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showMacd
                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Activity className="h-3 w-3" />
                <span>MACD</span>
              </button>

              {/* RSI Toggle */}
              <button
                type="button"
                onClick={toggleRsi}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showRsi
                    ? 'border-purple-500/40 bg-purple-500/15 text-purple-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>RSI</span>
              </button>

              {/* ADX Toggle */}
              <button
                type="button"
                onClick={toggleAdx}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all ${
                  showAdx
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e]/40 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>ADX</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interval Error Banner */}
      {intervalError && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{intervalError}</span>
        </div>
      )}

      {/* 2. MAIN CANDLESTICK CHART CONTAINER */}
      <div
        className={`relative z-10 overflow-hidden rounded-3xl border shadow-xs transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
        }`}
      >
        {/* Live OHLCV & Indicators Hover Pill */}
        <div
          className={`flex items-center justify-between border-b px-4 py-2.5 text-xs font-mono transition-colors ${
            isDark ? 'border-slate-800 bg-[#2c2c2e]/60 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {activeCandle ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`text-[10px] sm:text-[11px] font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {hoverData ? 'Vela:' : 'Última:'}
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
              <div className="border-l border-slate-700/40 pl-2">
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

              {/* BOLL readings in Hover pill if active */}
              {showBollinger && hoverData?.bollUpper !== undefined && (
                <div className="hidden md:flex items-center gap-2 border-l border-slate-700/40 pl-2 text-[11px]">
                  <span className="text-sky-400">BS: {formatCurrency(hoverData.bollUpper)}</span>
                  <span className="text-slate-400">BM: {formatCurrency(hoverData.bollMiddle || 0)}</span>
                  <span className="text-sky-400">BI: {formatCurrency(hoverData.bollLower || 0)}</span>
                </div>
              )}
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

      {/* 3. SUBCHART 1: VOLUMEN (Immediately Below Main Candlestick Chart) */}
      {showVolume && (
        <div
          className={`rounded-3xl border p-3.5 sm:p-4 shadow-xs transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Subgráfico: Volumen de Transacciones (Barras)
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-400">
              {hoverData?.volume ? `Vol: ${hoverData.volume.toLocaleString()}` : lastCandle?.volume ? `Vol: ${lastCandle.volume.toLocaleString()}` : 'Volumen'}
            </span>
          </div>
          <div ref={volumeContainerRef} className="w-full" />
        </div>
      )}

      {/* 4. SUBCHART 2: MACD (Visual Reference Overlay) */}
      {showMacd && (
        <div
          className={`rounded-3xl border p-3.5 sm:p-4 shadow-xs transition-colors ${
            isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Subgráfico: MACD (12, 26, 9)
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">
                (Línea MACD <span className="text-blue-400 font-bold">•</span> | Señal <span className="text-orange-400 font-bold">•</span> | Histograma)
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs font-bold">
              {hoverData?.macd !== undefined && (
                <>
                  <span className="text-blue-400">MACD: {hoverData.macd}</span>
                  <span className="text-orange-400">Sig: {hoverData.macdSignal}</span>
                  <span className={hoverData.macdHist && hoverData.macdHist >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    H: {hoverData.macdHist}
                  </span>
                </>
              )}
            </div>
          </div>
          <div ref={macdContainerRef} className="w-full" />
        </div>
      )}

      {/* 5. SUBCHARTS GRID: RSI & ADX */}
      {(showRsi || showAdx) && (
        <div className={`grid grid-cols-1 gap-4 ${showRsi && showAdx ? 'lg:grid-cols-2' : ''}`}>
          {/* RSI Subchart */}
          {showRsi && (
            <div
              className={`rounded-3xl border p-3.5 sm:p-4 shadow-xs transition-colors ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Subgráfico: RSI (14 periodos)
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-purple-400">
                  RSI: {hoverData?.rsi ?? analysis?.indicators.rsi}
                </span>
              </div>
              <div ref={rsiContainerRef} className="w-full" />
            </div>
          )}

          {/* ADX Subchart */}
          {showAdx && (
            <div
              className={`rounded-3xl border p-3.5 sm:p-4 shadow-xs transition-colors ${
                isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${accent.bgClass}`} />
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Subgráfico: ADX & Dirección (+DI / -DI)
                  </span>
                </div>
                <span className={`font-mono text-xs font-bold ${accent.textClass}`}>
                  ADX: {hoverData?.adx ?? analysis?.volatilityMetrics.adx}
                </span>
              </div>
              <div ref={adxContainerRef} className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* 6. Strategic Price Lines / Order Setup Cards (4 Compact Badges) */}
      {analysis && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Suggested Entry Card */}
          <div
            className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
              isDark
                ? 'border-blue-500/20 bg-blue-950/20'
                : 'border-blue-200 bg-blue-50/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 text-blue-500 mb-1">
              <LogIn className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Entrada Sugerida</span>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(analysis.orderSetup.suggestedEntryPrice)}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Estrategia:</span>
              <span className="font-mono font-bold text-blue-500 truncate max-w-[130px]" title={analysis.orderSetup.entryLabel}>
                {analysis.orderSetup.entryLabel || 'Punto óptimo'}
              </span>
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nivel de ejecución técnica
            </div>
          </div>

          {/* Card 2: Stop Loss Card */}
          <div
            className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
              isDark
                ? 'border-rose-500/20 bg-rose-950/20'
                : 'border-rose-200 bg-rose-50/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-500 mb-1">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Stop Loss Dinámico</span>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(analysis.orderSetup.suggestedStopLoss)}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Distancia de Corte:</span>
              <span className="font-mono font-bold text-rose-500">-{analysis.orderSetup.suggestedStopLossPct}%</span>
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Riesgo por unidad: -{formatCurrency(analysis.orderSetup.potentialRiskUSD)}
            </div>
          </div>

          {/* Card 3: Take Profit Card */}
          <div
            className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
              isDark
                ? 'border-emerald-500/20 bg-emerald-950/20'
                : 'border-emerald-200 bg-emerald-50/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
              <Target className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Take Profit Sugerido</span>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(analysis.orderSetup.suggestedTakeProfit)}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Objetivo Ganancia:</span>
              <span className="font-mono font-bold text-emerald-500">+{analysis.orderSetup.suggestedTakeProfitPct}%</span>
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Beneficio / ud: +{formatCurrency(analysis.orderSetup.potentialRewardUSD)}
            </div>
          </div>

          {/* Card 4: Risk Reward Ratio Card */}
          <div
            className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
              isDark
                ? `${accent.borderClass} ${accent.tintBgClass}`
                : `${accent.borderClass} ${accent.tintBgClass} shadow-xs`
            }`}
          >
            <div className={`flex items-center gap-1.5 ${accent.textClass} mb-1`}>
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Relación R / B</span>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              1 : {analysis.orderSetup.riskRewardRatio}
            </div>
            <div className={`mt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Eficiencia:</span>
              <span className="font-bold text-emerald-500">
                {Number(analysis.orderSetup.riskRewardRatio) >= 2.0 ? 'Favorable (> 1:2)' : 'Moderada'}
              </span>
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Gestión de riesgo asimétrica
            </div>
          </div>
        </div>
      )}

      {/* 7. Executive Managerial Analysis & Parameter Breakdown */}
      <ChartExecutiveAnalysis
        asset={asset}
        candles={chartCandles}
        selectedInterval={selectedInterval}
      />
    </div>
  );
}
