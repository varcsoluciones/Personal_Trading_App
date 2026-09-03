'use client';

import React, { useMemo } from 'react';
import { Asset, Candle } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import {
  calculateEMA,
  calculateRSI,
  calculateADX,
  calculateMACD,
  calculateBollingerBands,
} from '@/lib/quant/indicators';
import { ConfidenceBadge, calculateConfidence } from '@/components/ui/confidence-badge';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Clock,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart2,
  Zap,
  Layers,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface ChartExecutiveAnalysisProps {
  asset: Asset;
  candles: Candle[];
  selectedInterval: string;
}

type SignalEvaluation = 'FAVORABLE' | 'NEUTRAL' | 'DESFAVORABLE';

export function ChartExecutiveAnalysis({
  asset,
  candles,
  selectedInterval,
}: ChartExecutiveAnalysisProps) {
  const { settings, accent, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const analysis = asset.analysis;

  // Reliability & Confidence calculations
  const reliabilityScore = asset.backtestReliabilityScore ?? 60;
  const reliabilityLabel = asset.backtestReliabilityLabel ?? 'MEDIA';
  const lowSampleWarning = Boolean(asset.backtestLowSampleWarning);
  const isSimulated = Boolean(asset.isSimulated);

  const confidence = useMemo(() => {
    return calculateConfidence({
      opportunityScore: analysis?.opportunityScore ?? 50,
      reliabilityScore,
      lowSampleWarning,
      isSimulated,
    });
  }, [analysis?.opportunityScore, reliabilityScore, lowSampleWarning, isSimulated]);

  // Real-time calculations across the currently selected candles/timeframe
  const metrics = useMemo(() => {
    if (!candles || candles.length === 0) return null;

    const len = candles.length;
    const closes = candles.map((c) => c.close);
    const currentClose = closes[len - 1];

    // 1. EMAs
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const curEma20 = ema20[len - 1];
    const curEma50 = ema50[len - 1];
    const curEma200 = ema200[len - 1];

    // 2. Bollinger Bands
    const boll = calculateBollingerBands(closes, 20, 2);
    const curBollUp = boll.upper[len - 1];
    const curBollMid = boll.middle[len - 1];
    const curBollLow = boll.lower[len - 1];

    // 3. RSI
    const rsi = calculateRSI(closes, 14);
    const curRsi = rsi[len - 1];

    // 4. ADX & DIs
    const adxRes = calculateADX(candles, 14);
    const curAdx = adxRes.adx[len - 1];
    const curPlusDI = adxRes.plusDI[len - 1];
    const curMinusDI = adxRes.minusDI[len - 1];

    // 5. MACD
    const macdRes = calculateMACD(candles, 12, 26, 9);
    const curMacd = macdRes.macdLine[len - 1];
    const curSignal = macdRes.signalLine[len - 1];
    const curHist = macdRes.histogram[len - 1];

    // 6. Volume
    const currentVol = candles[len - 1].volume || 0;
    const recentCandles = candles.slice(-20);
    const avgVol = recentCandles.reduce((s, c) => s + (c.volume || 0), 0) / Math.max(1, recentCandles.length);
    const volRatio = avgVol > 0 ? currentVol / avgVol : 1;

    // =========================================================================
    // PARAMETER EVALUATIONS (FAVORABLE / NEUTRAL / DESFAVORABLE)
    // =========================================================================

    // A. EMA & Structure
    let emaStatus: SignalEvaluation = 'NEUTRAL';
    let emaSummary = '';
    if (!isNaN(curEma20) && !isNaN(curEma50)) {
      if (currentClose > curEma20 && curEma20 > curEma50) {
        emaStatus = 'FAVORABLE';
        emaSummary = 'Alineación alcista sólida (Precio > EMA 20 > EMA 50). El activo tiene soporte dinámico favorable.';
      } else if (currentClose < curEma20 && curEma20 < curEma50) {
        emaStatus = 'DESFAVORABLE';
        emaSummary = 'Alineación bajista (Precio < EMA 20 < EMA 50). Presión de venta activa y resistencia superior.';
      } else {
        emaStatus = 'NEUTRAL';
        emaSummary = 'Transición o compresión de medias. El precio oscila entre EMA 20 y EMA 50 sin definición direccional clara.';
      }
    }

    // B. Bollinger Bands
    let bollStatus: SignalEvaluation = 'NEUTRAL';
    let bollSummary = '';
    if (!isNaN(curBollUp) && !isNaN(curBollLow) && !isNaN(curBollMid)) {
      if (currentClose >= curBollUp) {
        bollStatus = 'DESFAVORABLE';
        bollSummary = 'Sobreextensión en Banda Superior. Alta probabilidad de retroceso o consolidación a la media.';
      } else if (currentClose <= curBollLow) {
        bollStatus = 'FAVORABLE';
        bollSummary = 'Zona de soporte en Banda Inferior. Condiciones estadísticas favorables para rebote de reversión a la media.';
      } else if (currentClose > curBollMid) {
        bollStatus = 'FAVORABLE';
        bollSummary = 'Precio sobre la Banda Media (SMA 20). Mantiene sesgo positivo dentro del canal de volatilidad.';
      } else {
        bollStatus = 'NEUTRAL';
        bollSummary = 'Precio bajo la Banda Media en rango controlado. Volatilidad normal sin rupturas extremas.';
      }
    }

    // C. RSI (14)
    let rsiStatus: SignalEvaluation = 'NEUTRAL';
    let rsiSummary = '';
    if (!isNaN(curRsi)) {
      if (curRsi >= 38 && curRsi <= 60) {
        rsiStatus = 'FAVORABLE';
        rsiSummary = `RSI en zona óptima de impulso (${curRsi.toFixed(1)}). Margen saludable de expansión alcista sin sobrecompra.`;
      } else if (curRsi < 35) {
        rsiStatus = 'FAVORABLE';
        rsiSummary = `RSI en sobreventa (${curRsi.toFixed(1)}). Potencial agotamiento de ventas y rebote inminente.`;
      } else if (curRsi > 70) {
        rsiStatus = 'DESFAVORABLE';
        rsiSummary = `RSI en sobrecompra extrema (${curRsi.toFixed(1)}). Riesgo elevado de corrección técnica a corto plazo.`;
      } else {
        rsiStatus = 'NEUTRAL';
        rsiSummary = `RSI neutro (${curRsi.toFixed(1)}). Momentum moderado dentro de parámetros normales.`;
      }
    }

    // D. ADX (14) & Dirección
    let adxStatus: SignalEvaluation = 'NEUTRAL';
    let adxSummary = '';
    if (!isNaN(curAdx) && !isNaN(curPlusDI) && !isNaN(curMinusDI)) {
      if (curAdx >= 25 && curPlusDI > curMinusDI) {
        adxStatus = 'FAVORABLE';
        adxSummary = `Tendencia alcista fuerte (ADX: ${curAdx.toFixed(1)}, +DI > -DI). Alta convicción y velocidad de movimiento.`;
      } else if (curAdx >= 25 && curMinusDI > curPlusDI) {
        adxStatus = 'DESFAVORABLE';
        adxSummary = `Fuerza bajista dominante (ADX: ${curAdx.toFixed(1)}, -DI > +DI). Presión vendedora institucional.`;
      } else {
        adxStatus = 'NEUTRAL';
        adxSummary = `Mercado lateral o en rango (ADX: ${curAdx.toFixed(1)} < 25). Baja direccionalidad; ideal para operar rebotes de soporte a resistencia.`;
      }
    }

    // E. MACD (12, 26, 9)
    let macdStatus: SignalEvaluation = 'NEUTRAL';
    let macdSummary = '';
    if (!isNaN(curMacd) && !isNaN(curSignal)) {
      if (curMacd > curSignal && curHist > 0) {
        macdStatus = 'FAVORABLE';
        macdSummary = `Cruce alcista activo (MACD > Señal, Hist: +${curHist.toFixed(2)}). Aceleración positiva de compras.`;
      } else if (curMacd < curSignal && curHist < 0) {
        macdStatus = 'DESFAVORABLE';
        macdSummary = `Cruce bajista activo (MACD < Señal, Hist: ${curHist.toFixed(2)}). Desaceleración y salida de capital.`;
      } else {
        macdStatus = 'NEUTRAL';
        macdSummary = `Histograma en contracción hacia la línea cero. Momentum equilibrado a la espera de confirmación.`;
      }
    }

    // F. Volumen & Flujo
    let volStatus: SignalEvaluation = 'NEUTRAL';
    let volSummary = '';
    if (volRatio >= 1.25) {
      volStatus = 'FAVORABLE';
      volSummary = `Volumen institucional elevado (+${((volRatio - 1) * 100).toFixed(0)}% vs promedio). Alta liquidez y validación de precios.`;
    } else if (volRatio < 0.75) {
      volStatus = 'NEUTRAL';
      volSummary = `Volumen por debajo del promedio (${(volRatio * 100).toFixed(0)}% de la media). Transacciones en calma sin participación institucional agresiva.`;
    } else {
      volStatus = 'FAVORABLE';
      volSummary = `Volumen normal dentro del rango esperado (100% de la media de 20 periodos).`;
    }

    return {
      currentClose,
      curEma20,
      curEma50,
      curEma200,
      curBollUp,
      curBollMid,
      curBollLow,
      curRsi,
      curAdx,
      curPlusDI,
      curMinusDI,
      curMacd,
      curSignal,
      curHist,
      volRatio,
      currentVol,
      // Statuses
      emaStatus,
      emaSummary,
      bollStatus,
      bollSummary,
      rsiStatus,
      rsiSummary,
      adxStatus,
      adxSummary,
      macdStatus,
      macdSummary,
      volStatus,
      volSummary,
    };
  }, [candles]);

  if (!analysis || !metrics) return null;

  const score = analysis.opportunityScore;
  const isScoreHigh = score >= 80;
  const isScoreMedium = score >= 50 && score < 80;

  // Helper for Status Badge
  const renderBadge = (status: SignalEvaluation) => {
    switch (status) {
      case 'FAVORABLE':
        return (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
            isDark ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Favorable</span>
          </span>
        );
      case 'NEUTRAL':
        return (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
            isDark ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span>Neutro</span>
          </span>
        );
      case 'DESFAVORABLE':
        return (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
            isDark ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <XCircle className="h-3 w-3 text-rose-500" />
            <span>Desfavorable</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-7 shadow-xs transition-colors space-y-6 ${
        isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-200/80 bg-white'
      }`}
    >
      {/* 1. Header Section: Title, Asset Context & Integrated Confidence & Score Verdict */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Diagnóstico Cuantitativo & Resumen Gerencial
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Evaluación integral multidimensional de <strong>{asset.symbol}</strong> ({asset.name}) en temporalidad <strong>{selectedInterval.toUpperCase()}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Global Opportunity Score + Unified Confidence Pill */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Opportunity Score Pill */}
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Score Técnico
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-black ${
              isScoreHigh
                ? 'text-emerald-500'
                : isScoreMedium
                ? 'text-blue-400'
                : 'text-amber-500'
            }`}>
              {score} <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>

          {/* Unified Confidence Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Confiabilidad
            </div>
            <ConfidenceBadge
              opportunityScore={score}
              reliabilityScore={reliabilityScore}
              lowSampleWarning={lowSampleWarning}
              isSimulated={isSimulated}
              size="md"
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* 2. Executive Pillar Breakdown (6 Dimensions of the active charts) */}
      <div className="space-y-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Desglose Técnico de Parámetros & Señales
        </h4>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Pillar 1: Estructura & EMAs */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  1. Medias Móviles (EMAs)
                </span>
                {renderBadge(metrics.emaStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.emaSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>EMA 20: ${metrics.curEma20 ? metrics.curEma20.toFixed(2) : '-'}</span>
              <span>EMA 50: ${metrics.curEma50 ? metrics.curEma50.toFixed(2) : '-'}</span>
            </div>
          </div>

          {/* Pillar 2: Bandas de Bollinger */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Bandas de Bollinger (20, 2)
                </span>
                {renderBadge(metrics.bollStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.bollSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>Sup: ${metrics.curBollUp ? metrics.curBollUp.toFixed(2) : '-'}</span>
              <span>Inf: ${metrics.curBollLow ? metrics.curBollLow.toFixed(2) : '-'}</span>
            </div>
          </div>

          {/* Pillar 3: RSI (14) */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  3. Momentum Relativo (RSI 14)
                </span>
                {renderBadge(metrics.rsiStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.rsiSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>Valor RSI: {metrics.curRsi ? metrics.curRsi.toFixed(1) : '-'}</span>
              <span>Divergencia: {analysis.indicators.rsiDivergence || 'Ninguna'}</span>
            </div>
          </div>

          {/* Pillar 4: ADX & Fuerza Direccional */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  4. Fuerza de Tendencia (ADX 14)
                </span>
                {renderBadge(metrics.adxStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.adxSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>ADX: {metrics.curAdx ? metrics.curAdx.toFixed(1) : '-'}</span>
              <span>Dirección: +DI ({metrics.curPlusDI ? metrics.curPlusDI.toFixed(0) : '-'}) vs -DI ({metrics.curMinusDI ? metrics.curMinusDI.toFixed(0) : '-'})</span>
            </div>
          </div>

          {/* Pillar 5: MACD (12, 26, 9) */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  5. Convergencia / Momentum (MACD)
                </span>
                {renderBadge(metrics.macdStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.macdSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>MACD: {metrics.curMacd ? metrics.curMacd.toFixed(2) : '-'}</span>
              <span>Hist: {metrics.curHist ? (metrics.curHist > 0 ? `+${metrics.curHist.toFixed(2)}` : metrics.curHist.toFixed(2)) : '-'}</span>
            </div>
          </div>

          {/* Pillar 6: Volumen & Participación */}
          <div
            className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200/80 bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  6. Volumen & Liquidez
                </span>
                {renderBadge(metrics.volStatus)}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metrics.volSummary}
              </p>
            </div>
            <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>Volumen Actual: {metrics.currentVol.toLocaleString()}</span>
              <span>Ratio vs Media: {(metrics.volRatio * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Executive Summary, Reliability Reasoning & Action Plan */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 ${
          isDark
            ? 'border-blue-500/30 bg-blue-950/15 text-slate-200'
            : 'border-blue-200 bg-blue-50/60 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
            <Layers className="h-4 w-4" />
            <span>Conclusión Gerencial & Razonamiento de Confiabilidad ({confidence.compositeScore}/100)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Confiabilidad Histórica:</span>
            <span className={`font-mono font-bold ${
              reliabilityLabel === 'ALTA' ? 'text-emerald-500' : reliabilityLabel === 'MEDIA' ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {reliabilityLabel} ({reliabilityScore}/100)
            </span>
          </div>
        </div>

        {/* Narrative Justification integrating Technical Score + Historical Reliability */}
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            {score >= 80 ? (
              <>
                <strong>Veredicto Favorable:</strong> El activo <strong>{asset.symbol}</strong> presenta una excelente alineación técnica cuantitativa ({score}/100). La estructura de medias móviles, el momentum RSI sin sobrecompra y la dirección positiva del MACD generan una ventaja estadística asimétrica.
              </>
            ) : score >= 50 ? (
              <>
                <strong>Veredicto Neutral / En Seguimiento:</strong> El activo <strong>{asset.symbol}</strong> mantiene un puntaje moderado ({score}/100). Aunque algunos indicadores muestran estabilidad o soporte en rango, aún no existe un consenso pleno de ruptura institucional.
              </>
            ) : (
              <>
                <strong>Veredicto Cauteloso:</strong> El activo <strong>{asset.symbol}</strong> se encuentra bajo presión técnica ({score}/100) debido a divergencias bajistas o pérdida de medias clave. Se aconseja no abrir compras agresivas hasta que el precio recupere la EMA 20 con volumen.
              </>
            )}
          </p>

          {/* Explicit Reasoning on Historical Reliability */}
          <div className={`rounded-xl border p-3 flex items-start gap-2.5 ${
            reliabilityLabel === 'ALTA' && !lowSampleWarning
              ? isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : reliabilityLabel === 'MEDIA' || lowSampleWarning
              ? isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50/80 text-amber-900'
              : isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50/80 text-rose-900'
          }`}>
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold">Razonamiento de Confiabilidad Histórica:</strong>
              <p className="text-[11px] leading-relaxed">
                {reliabilityLabel === 'ALTA' && !lowSampleWarning
                  ? `La señal técnica actual cuenta con un respaldo estadístico robusto fuera de muestra (Confiabilidad ${reliabilityScore}/100). Las simulaciones históricas Walk-Forward confirman que este activo ha mantenido una consistencia de ganancias y control de drawdown favorable ante estas condiciones.`
                  : lowSampleWarning
                  ? `La confiabilidad histórica es calificada como ${reliabilityLabel} (${reliabilityScore}/100) debido a un historial operativo limitado (menos de 30 operaciones simuladas). Aunque la configuración técnica es prometedora, se aconseja utilizar un tamaño de posición conservador.`
                  : reliabilityLabel === 'MEDIA'
                  ? `La confiabilidad histórica es moderada (${reliabilityScore}/100). El activo muestra rentabilidad histórica aceptable pero con cierta variabilidad entre periodos de prueba y validación.`
                  : `Precaución: La confiabilidad histórica es baja (${reliabilityScore}/100), lo que refleja alta dispersión o bajo rendimiento en pruebas históricas previas. Se recomienda esperar una confirmación de mayor calidad.`}
              </p>
            </div>
          </div>
        </div>

        {/* Actionable Executive Execution Box (5 Key Trade Parameters) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 pt-2 border-t border-blue-500/20 font-mono text-xs">
          {/* Suggested Entry */}
          <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] text-blue-500 font-sans font-bold flex items-center gap-1">
              <Target className="h-3 w-3" /> Entrada Sugerida
            </span>
            <div className="font-bold text-sm sm:text-base mt-0.5">
              {formatCurrency(analysis.orderSetup.suggestedEntryPrice)}
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">
              {analysis.orderSetup.entryLabel}
            </div>
          </div>

          {/* Stop Loss */}
          <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] text-rose-500 font-sans font-bold flex items-center gap-1">
              <Shield className="h-3 w-3" /> Stop Loss Límit
            </span>
            <div className="font-bold text-sm sm:text-base mt-0.5 text-rose-500">
              {formatCurrency(analysis.orderSetup.suggestedStopLoss)}
            </div>
            <div className="text-[10px] text-rose-400 font-sans mt-0.5">
              -{analysis.orderSetup.suggestedStopLossPct}% de corte
            </div>
          </div>

          {/* Take Profit */}
          <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] text-emerald-500 font-sans font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Take Profit Obj.
            </span>
            <div className="font-bold text-sm sm:text-base mt-0.5 text-emerald-500">
              {formatCurrency(analysis.orderSetup.suggestedTakeProfit)}
            </div>
            <div className="text-[10px] text-emerald-400 font-sans mt-0.5">
              +{analysis.orderSetup.suggestedTakeProfitPct}% objetivo
            </div>
          </div>

          {/* Confiabilidad Cuantitativa */}
          <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] text-amber-500 font-sans font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Confiabilidad
            </span>
            <div className={`font-bold text-sm sm:text-base mt-0.5 ${
              confidence.level === 'ALTA' ? 'text-emerald-500' : confidence.level === 'MEDIA' ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {confidence.level} ({confidence.compositeScore})
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">
              {confidence.sublabel}
            </div>
          </div>

          {/* Horizon */}
          <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] text-purple-400 font-sans font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Horizonte
            </span>
            <div className="font-bold text-sm sm:text-base mt-0.5 text-purple-400 truncate">
              {analysis.orderSetup.horizonSuggestion?.horizonLabel || 'Mediano Plazo'}
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">
              ~{analysis.orderSetup.horizonSuggestion?.durationLabel || '10 - 20 días'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
