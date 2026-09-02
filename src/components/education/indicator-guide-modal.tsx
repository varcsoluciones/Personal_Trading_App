'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Shield,
  Target,
  BarChart2,
  Percent,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context';

interface IndicatorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IndicatorGuideModal({ isOpen, onClose }: IndicatorGuideModalProps) {
  const { settings, accent } = useSettings();
  const isDark = settings.theme === 'dark';

  const [activeTab, setActiveTab] = useState<'indicators' | 'examples' | 'risk' | 'strategy'>('examples');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col max-h-[92vh] w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white shadow-black/60'
            : 'border-slate-200/80 bg-white text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/40' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${accent.tintBgClass} ${accent.textClass}`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Guía & Ejemplos de Indicadores</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Aprende qué valores son Buenos 🟢, Neutros 🟡 o Malos 🔴 en cada métrica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${
              isDark
                ? 'bg-[#2c2c2e] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Controls (Tabs) */}
        <div className={`px-6 py-3 border-b ${isDark ? 'border-slate-800/80 bg-[#1c1c1e]' : 'border-slate-100 bg-white'}`}>
          <div className={`grid grid-cols-4 p-1 rounded-2xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/60' : 'border-slate-200/80 bg-slate-100/80'}`}>
            {[
              { id: 'examples', title: 'Valores de Ejemplo (KPIs)', icon: Sparkles },
              { id: 'indicators', title: '¿Qué es cada Indicador?', icon: Activity },
              { id: 'risk', title: 'Gestión de Riesgo', icon: Shield },
              { id: 'strategy', title: 'Estrategia & Backtesting', icon: BarChart2 },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-[#3a3a3c] text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs leading-relaxed">

          {/* TAB 1: EJEMPLOS CONCRETOS (BUENO, NEUTRO, MALO) */}
          {activeTab === 'examples' && (
            <div className="space-y-4">
              <div className={`p-3 rounded-2xl border text-[11px] ${
                isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}>
                💡 <strong>Guía Rápida:</strong> Usa esta tabla de referencia para saber al instante si los valores que ves en un activo indican oportunidad de compra, momento de espera o riesgo de salida.
              </div>

              {/* KPI 1: Tendencia y Medias Móviles */}
              <div className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>1. Tendencia y Medias Móviles (EMA 20 vs EMA 50)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="font-bold text-emerald-500 mb-1 flex items-center gap-1">
                      <span>🟢 Bueno (Alcista)</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-emerald-600 mb-1">Precio &gt; EMA 20 &gt; EMA 50</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Ejemplo: BTC a $65k con EMA 20 en $63k y EMA 50 en $60k. <strong>Acción:</strong> Buscar compras en retrocesos.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="font-bold text-amber-500 mb-1 flex items-center gap-1">
                      <span>🟡 Neutro (Lateral)</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-amber-600 mb-1">EMA 20 ≈ EMA 50</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Ejemplo: Medias planas y cruzándose. <strong>Acción:</strong> Operar rebotes en soportes o esperar ruptura.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="font-bold text-rose-500 mb-1 flex items-center gap-1">
                      <span>🔴 Malo (Bajista)</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-rose-600 mb-1">Precio &lt; EMA 20 &lt; EMA 50</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Ejemplo: Precio cayendo con medias descendentes. <strong>Acción:</strong> Evitar compras o cerrar posiciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI 2: Riesgo de Giro */}
              <div className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>2. Riesgo de Cambio de Tendencia (%)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="font-bold text-emerald-500 mb-1">🟢 Bajo Riesgo (10% - 35%)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Estructura técnica sólida y congruente. No hay divergencias bajistas. La tendencia tiene espacio libre para avanzar.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="font-bold text-amber-500 mb-1">🟡 Riesgo Medio (40% - 60%)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Pendiente de medias desacelerando o tendencia con más de 30 días activa. Ajustar Stop Loss a punto de equilibrio.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="font-bold text-rose-500 mb-1">🔴 Alto Riesgo (&gt; 65%)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Divergencia bajista en RSI o sobrecompra extrema (RSI &gt; 75). Alta probabilidad de corrección. Tomar beneficios sugerido.
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI 3: Fuerza ADX */}
              <div className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>3. Indicador de Fuerza ADX (0 a 100)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="font-bold text-emerald-500 mb-1">🟢 ADX &gt; 25 (Fuerte)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Movimiento direccional institucional sólido. Las señales de tendencia son de alta fiabilidad.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="font-bold text-amber-500 mb-1">🟡 ADX 18 - 25 (Moderado)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Tendencia en formación o transición. Esperar confirmación de volumen antes de entrar fuerte.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="font-bold text-rose-500 mb-1">🔴 ADX &lt; 18 (Débil / Rango)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Mercado sin dirección o plano. No operar rupturas tendenciales; solo rebotes de rango.
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI 4: Opportunity Score */}
              <div className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span>4. Opportunity Score (0 a 100)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="font-bold text-emerald-500 mb-1">🟢 Score 75 - 99 (Excelente)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Cumple con 4 de 4 confirmaciones: tendencia alcista, RSI en retroceso saludable, ADX potente y ratio R:B &gt; 1:2.2.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="font-bold text-amber-500 mb-1">🟡 Score 50 - 74 (Aceptable)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Condición favorable pero con alguna métrica neutra (ej. tendencia extendida o ADX medio).
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="font-bold text-rose-500 mb-1">🔴 Score &lt; 50 (Baja Probabilidad)</div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Desalineación técnica, tendencia bajista o sobrecompra. Es mejor buscar otros activos de la lista.
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI 5: Backtesting Win Rate & Drawdown */}
              <div className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                    <span>5. Métricas de Efectividad del Backtest</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong className="text-blue-500 block mb-1">Tasa de Acierto (Win Rate):</strong>
                    <ul className="space-y-0.5 list-disc pl-4 text-slate-400">
                      <li><strong>&gt; 55%:</strong> Excelente rendimiento y consistencia.</li>
                      <li><strong>40% - 54%:</strong> Muy rentable si la relación R:B es 1:2.0 o superior.</li>
                      <li><strong>&lt; 35%:</strong> Estrategia requiere ajustar umbrales de RSI o stop loss.</li>
                    </ul>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-slate-700 bg-[#2c2c2e]' : 'border-slate-200 bg-white'}`}>
                    <strong className="text-blue-500 block mb-1">Máxima Caída (Max Drawdown):</strong>
                    <ul className="space-y-0.5 list-disc pl-4 text-slate-400">
                      <li><strong>&lt; 15%:</strong> Riesgo bajo y curva de capital suave.</li>
                      <li><strong>15% - 25%:</strong> Riesgo moderado típico de acciones y ETFs.</li>
                      <li><strong>&gt; 30%:</strong> Alta volatilidad; considerar ajustar el Stop Loss % más ceñido.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETALLES DE INDICADORES */}
          {activeTab === 'indicators' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-blue-500">Medias Móviles Exponenciales (EMA 20 & EMA 50)</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Las medias móviles suavizan las fluctuaciones del precio ponderando más las velas recientes. Cuando la EMA 20 (rápida) está por encima de la EMA 50 (lenta), la inercia del mercado es compradora.
                </p>
              </div>

              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-purple-500">RSI (Relative Strength Index de 14 periodos)</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Mide la velocidad del cambio de precio (0 a 100). Valores por debajo de 35 indican sobreventa (oportunidad de rebote), mientras que valores por encima de 70 indican sobrecompra (momento de asegurar ganancias).
                </p>
              </div>

              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-cyan-500">ADX (+DI y -DI)</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Desarrollado por J. Welles Wilder para cuantificar la fuerza de la tendencia sin importar si es alcista o bajista. La línea +DI mide la presión compradora y -DI la vendedora.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GESTIÓN DE RIESGO */}
          {activeTab === 'risk' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-rose-500">Stop Loss Dinámico</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Calcula automáticamente el corte de pérdida utilizando el indicador de volatilidad ATR (Average True Range) multiplicado por 1.5. Esto asegura que el stop quede ubicado fuera del ruido normal de oscilación del activo.
                </p>
              </div>

              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-emerald-500">Take Profit y Asimetría Matemática (1:2.2)</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Al colocar un objetivo de ganancia 2.2 veces mayor que el riesgo asumido, una cuenta de trading puede crecer consistentemente incluso con una tasa de acierto del 40%, protegiendo al inversor de rachas adversas.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ESTRATEGIA & BACKTESTING */}
          {activeTab === 'strategy' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-3xl border ${isDark ? 'border-slate-800 bg-[#2c2c2e]/30' : 'border-slate-200/80 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-1 text-blue-500">Simulación con Fricción Realista</h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  En cada operación simulada, la plataforma descuenta un <strong>0.1% de comisión de corretaje</strong> y un <strong>0.05% de deslizamiento de precio (slippage)</strong> en entrada y salida. Esto garantiza que las curvas de capital reflejen lo que realmente obtendrías en una cuenta real.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex justify-end ${
            isDark ? 'border-slate-800/80 bg-[#2c2c2e]/30' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
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
