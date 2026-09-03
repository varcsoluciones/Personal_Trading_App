'use client';

import React, { useState } from 'react';
import { useSettings } from '@/lib/context/settings-context';
import {
  X,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  BarChart2,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Wallet,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface IndicatorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IndicatorGuideModal({ isOpen, onClose }: IndicatorGuideModalProps) {
  const { settings, accent } = useSettings();
  const isDark = settings.theme === 'dark';

  const [activeTab, setActiveTab] = useState<
    'quick' | 'indicators' | 'executive' | 'portfolio' | 'backtest'
  >('quick');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* 1. Modal Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 shrink-0 ${
            isDark ? 'border-slate-800 bg-[#121214]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Guía Completa & Manual del Sistema
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                QuantPulse Pro • Indicadores, Estrategias Cuantitativas y Gestión de Cartera
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-xl p-2 transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Navigation Tabs */}
        <div
          className={`flex overflow-x-auto border-b px-4 py-2 gap-1.5 shrink-0 custom-horizontal-scrollbar ${
            isDark ? 'border-slate-800 bg-[#1c1c1e]' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          {[
            { id: 'quick', label: 'Guía Rápida & Señales', icon: Sparkles },
            { id: 'indicators', label: 'Indicadores Técnicos', icon: Activity },
            { id: 'executive', label: 'Diagnóstico Gerencial', icon: Layers },
            { id: 'portfolio', label: 'Mi Cartera & Riesgo', icon: Wallet },
            { id: 'backtest', label: 'Backtest & Confiabilidad', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? `${accent.bgClass} text-white shadow-xs font-bold`
                    : isDark
                    ? 'text-slate-400 hover:bg-[#2c2c2e] hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar">
          
          {/* ============================================================ */}
          {/* TAB 1: GUÍA RÁPIDA & SEÑALES */}
          {/* ============================================================ */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Score Cuantitativo */}
              <div
                className={`p-4 rounded-3xl border space-y-2.5 ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Opportunity Score (0 - 99)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Puntaje Cuantitativo</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Calificación matemática que evalúa en tiempo real la confluencia técnica de cada activo combinando tendencia, momentum, volatilidad y relación riesgo/beneficio:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="font-bold text-emerald-500 mb-1">🟢 75 - 99 (Excelente)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Alta confluencia: tendencia alcista firme, RSI en rango óptimo, ADX fuerte y R:B &gt; 1:2.0.
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="font-bold text-amber-500 mb-1">🟡 50 - 74 (Aceptable)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Condición favorable pero con alguna métrica en consolidación o rango lateral.
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="font-bold text-rose-500 mb-1">🔴 &lt; 50 (Baja Probabilidad)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Desalineación técnica, tendencia bajista o sobrecompra extrema. No se recomienda operar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interpretación de Señales de la App */}
              <div
                className={`p-4 rounded-3xl border space-y-2.5 ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <Activity className="h-4 w-4" />
                  <span>¿Cómo interpretar la Columna Estructura & Señal?</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${isDark ? 'border-emerald-500/30 bg-emerald-950/15' : 'border-emerald-200 bg-emerald-50/70'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-500">🟢 Oportunidad de Entrada:</strong> El precio actual coincide con el punto óptimo de compra (zona de retroceso a la EMA 20 y RSI en impulso). **Es el momento de ejecutar la operación.**
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${isDark ? 'border-amber-500/30 bg-amber-950/15' : 'border-amber-200 bg-amber-50/70'}`}>
                    <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-500">🟡 Esperar / Mantener:</strong> El setup es el plan proyectado si el activo retrocede a la entrada ideal. No compres a mercado; coloca una orden límite o mantén si ya estás dentro.
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${isDark ? 'border-rose-500/30 bg-rose-950/15' : 'border-rose-200 bg-rose-50/70'}`}>
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-500">🔴 Oportunidad de Salida:</strong> El activo alcanzó sobrecompra extrema (RSI &gt; 70) o rompió la EMA 50 a la baja. Momento de tomar beneficios o cerrar.
                    </div>
                  </div>
                </div>
              </div>

              {/* Podio Top 3 Recomendados */}
              <div
                className={`p-4 rounded-3xl border space-y-2 ${
                  isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                  <Flame className="h-4 w-4" />
                  <span>Podio Top 3 de Activos Recomendados</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  En la pestaña **Oportunidades**, la app destaca las 3 mejores opciones del mercado mediante un algoritmo ponderado: <strong>60% Opportunity Score + 40% Confiabilidad Histórica Walk-Forward</strong>. Puedes pulsar cualquiera de los 3 para abrir su gráfico de inmediato.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: INDICADORES TÉCNICOS */}
          {/* ============================================================ */}
          {activeTab === 'indicators' && (
            <div className="space-y-3">
              {/* Bollinger Bands */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                  <Activity className="h-4 w-4" />
                  <span>Bandas de Bollinger (BOLL 20, 2)</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Calculadas con una Media Móvil Simple (SMA) de 20 periodos y bandas superior e inferior situadas a 2 desviaciones estándar (2 desviaciones estandar). 
                  Miden la volatilidad: cuando las bandas se estrechan (*squeeze*), anticipan una fuerte explosión de volatilidad; cuando el precio toca la banda inferior con rebote alcista, valida zonas óptimas de compra.
                </p>
              </div>

              {/* MACD */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                  <BarChart2 className="h-4 w-4" />
                  <span>MACD (12, 26, 9) & Histograma</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Mide la convergencia y divergencia de medias móviles exponenciales (EMA 12 - EMA 26). La línea Signal (EMA 9) y las barras de histograma muestran la aceleración del impulso. Un cruce del MACD por encima de la Signal con histograma verde confirma presión compradora dominante.
                </p>
              </div>

              {/* EMAs */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Medias Móviles Exponenciales (EMA 20, 50 y 200)</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Suavizan el precio dando más peso a las velas recientes. La EMA 20 actúa como soporte dinámico de corto plazo, la EMA 50 como filtro de tendencia media, y la EMA 200 define la tendencia institucional de largo plazo.
                </p>
              </div>

              {/* RSI */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                  <Activity className="h-4 w-4" />
                  <span>RSI (Relative Strength Index - 14 periodos)</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Oscilador de momentum (0 a 100). En tendencias alcistas saludables, las compras ideales ocurren con RSI entre 38 y 58 (retroceso controlado). Valores &gt; 70 advierten sobrecompra y riesgo de giro.
                </p>
              </div>

              {/* ADX */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>ADX con +DI y -DI (14 periodos)</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Cuantifica la fuerza de la tendencia. Un valor de ADX &gt; 25 indica una tendencia sólida y operable. Si la línea $+DI$ está por encima de $-DI$, la dirección dominante es compradora.
                </p>
              </div>

              {/* Volume */}
              <div className={`p-4 rounded-3xl border space-y-1.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-500">
                  <Coins className="h-4 w-4" />
                  <span>Volumen de Negociación Coloreado</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Muestra la liquidez negociada en cada vela. Las barras verdes (Cierre &gt;= Apertura) y rojas (Cierre &lt; Apertura) permiten validar si las rupturas de precio están respaldadas por volumen institucional.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: DIAGNÓSTICO GERENCIAL */}
          {/* ============================================================ */}
          {activeTab === 'executive' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <Layers className="h-4 w-4" />
                  <span>Los 6 Pilares del Diagnóstico Cuantitativo</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Al final de la pestaña **Gráfico**, el sistema genera un resumen ejecutivo que evalúa el activo en 6 pilares clave con insignias de estado (<strong>🟢 Favorable</strong>, <strong>🟡 Neutro</strong>, <strong>🔴 Desfavorable</strong>):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>1. Medias Móviles (EMAs):</strong> Estructura y alineación tendencial.
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>2. Bandas de Bollinger:</strong> Posición del precio frente a volatilidad y extremos.
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>3. Momentum (RSI):</strong> Nivel de sobrecompra o margen de impulso alcista.
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>4. Fuerza de Tendencia (ADX):</strong> Potencia y direccionalidad (+DI/-DI).
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>5. Convergencia MACD:</strong> Cruce de medias y aceleración del histograma.
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong>6. Volumen & Liquidez:</strong> Respaldo de capital en 24 horas.
                  </div>
                </div>
              </div>

              {/* Plan de Ejecución de 5 Cajas */}
              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <Target className="h-4 w-4" />
                  <span>Plan de Ejecución Cuantitativa (5 Cajas Clave)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] pt-1">
                  <div className={`p-2 rounded-2xl border ${isDark ? 'border-blue-500/30 bg-blue-950/20 text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                    <strong className="block font-sans">Entrada Sugerida</strong>
                    <span className="font-mono font-bold">Zona Óptima</span>
                  </div>
                  <div className={`p-2 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                    <strong className="block font-sans">Stop Loss Límite</strong>
                    <span className="font-mono font-bold">Protección ATR</span>
                  </div>
                  <div className={`p-2 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                    <strong className="block font-sans">Take Profit</strong>
                    <span className="font-mono font-bold">Objetivo Asimétrico</span>
                  </div>
                  <div className={`p-2 rounded-2xl border ${isDark ? 'border-purple-500/30 bg-purple-950/20 text-purple-400' : 'border-purple-200 bg-purple-50 text-purple-800'}`}>
                    <strong className="block font-sans">Confiabilidad</strong>
                    <span className="font-mono font-bold">Walk-Forward</span>
                  </div>
                  <div className={`p-2 rounded-2xl border col-span-2 sm:col-span-1 ${isDark ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}>
                    <strong className="block font-sans">Horizonte</strong>
                    <span className="font-mono font-bold">Días Estimados</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: MI CARTERA & GESTIÓN DE RIESGO */}
          {/* ============================================================ */}
          {activeTab === 'portfolio' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <Wallet className="h-4 w-4" />
                  <span>Seguimiento Real en la Pestaña "Mi Cartera"</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Permite llevar el registro exacto de las operaciones ejecutadas en tu broker o exchange:
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-slate-400">
                  <li><strong>Movimientos de Capital:</strong> Registra depósitos, retiros y ajustes para mantener tu balance contable limpio.</li>
                  <li><strong>Selector con Autocompletado:</strong> Al pulsar <code>+ Nueva Operación</code>, puedes seleccionar cualquier activo en la lista desplegable y el modal autocompleta los precios sugeridos de Entrada, Stop Loss y Take Profit.</li>
                  <li><strong>Cierre Automático por SL / TP:</strong> El motor de mercado monitorea los precios en vivo; si el activo toca tu Stop Loss o Take Profit, la posición se cierra sola y calcula el beneficio neto en USD y porcentaje.</li>
                  <li><strong>Edición & Eliminación:</strong> Puedes corregir el precio real de salida si cerraste en un valor distinto o eliminar operaciones aplicadas por error.</li>
                </ul>
              </div>

              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <Shield className="h-4 w-4" />
                  <span>Asimetría Matemática & Gestión de Capital</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  La plataforma utiliza una relación Riesgo:Beneficio mínima de <strong>1:2.0</strong> a <strong>1:3.0</strong>. Esto significa que cuando ganas, ganas el doble o triple de lo que arriesgas en un corte por Stop Loss, haciendo que tu cuenta crezca incluso con rachas donde solo aciertes 4 de cada 10 operaciones.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: BACKTEST & CONFIABILIDAD */}
          {/* ============================================================ */}
          {activeTab === 'backtest' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                  <BarChart2 className="h-4 w-4" />
                  <span>Indicador de Confiabilidad Cuantitativa (Walk-Forward)</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  A diferencia de un backtesting simple que puede sobreajustarse al pasado, la Confiabilidad Cuantitativa evalúa la estrategia sobre <strong>datos fuera de muestra (*Out-of-Sample*)</strong> simulando condiciones reales futuras:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <strong className="text-emerald-500 block mb-1">🟢 Alta (&gt; 65%):</strong>
                    Estrategia consistente y robusta con alta probabilidad de repetición estadística.
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <strong className="text-amber-500 block mb-1">🟡 Moderada (45% - 64%):</strong>
                    Rendimiento positivo pero con sensibilidad a cambios de régimen de mercado.
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <strong className="text-rose-500 block mb-1">🔴 Baja (&lt; 45%):</strong>
                    Curva inestable en datos fuera de muestra; operar con tamaño de posición reducido.
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <BarChart2 className="h-4 w-4" />
                  <span>Fricción de Mercado Realista</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  En cada simulación, se descuenta automáticamente un <strong>0.1% de comisión de corretaje</strong> y un <strong>0.05% de deslizamiento (*slippage*)</strong> en entrada y salida, asegurando que los resultados reflejen la realidad operativa de un trader profesional.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* 4. Modal Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/30' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Guía Interactiva QuantPulse Pro v2.5</span>
          </div>

          <button
            onClick={onClose}
            className={`rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-md ${accent.bgClass} hover:opacity-90 transition-all`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
