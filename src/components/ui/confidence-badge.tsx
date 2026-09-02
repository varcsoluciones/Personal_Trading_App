'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export type ConfidenceLevel = 'ALTA' | 'MEDIA' | 'BAJA';

export interface ConfidenceBadgeProps {
  opportunityScore?: number;
  reliabilityScore?: number;
  lowSampleWarning?: boolean;
  isSimulated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  isDark?: boolean;
}

export function calculateConfidence(params: {
  opportunityScore?: number;
  reliabilityScore?: number;
  lowSampleWarning?: boolean;
  isSimulated?: boolean;
}): {
  compositeScore: number;
  level: ConfidenceLevel;
  label: string;
  sublabel: string;
} {
  const opp = params.opportunityScore ?? 50;
  const rel = params.reliabilityScore ?? 60;
  const isSim = params.isSimulated ?? false;
  const lowSample = params.lowSampleWarning ?? false;

  // Weighted calculation (55% market opportunity + 45% walk-forward robustness)
  let rawScore = Math.round(opp * 0.55 + rel * 0.45);

  if (lowSample) {
    rawScore = Math.min(rawScore - 12, 68); // Penalize sample size below 30
  }

  if (isSim) {
    rawScore = Math.min(rawScore, 42); // Force low for simulated contingency data
    return {
      compositeScore: rawScore,
      level: 'BAJA',
      label: 'Confianza Baja',
      sublabel: 'Datos no verificados (Simulado)',
    };
  }

  rawScore = Math.min(99, Math.max(15, rawScore));

  if (rawScore >= 75 && !lowSample) {
    return {
      compositeScore: rawScore,
      level: 'ALTA',
      label: 'Confianza Alta',
      sublabel: 'Estructura sólida y validada fuera de muestra',
    };
  }

  if (rawScore >= 50) {
    return {
      compositeScore: rawScore,
      level: 'MEDIA',
      label: 'Confianza Media',
      sublabel: lowSample ? 'Muestra estadística limitada (n < 30)' : 'Señal moderada o en espera',
    };
  }

  return {
    compositeScore: rawScore,
    level: 'BAJA',
    label: 'Confianza Baja',
    sublabel: 'Riesgo elevado o baja persistencia estadística',
  };
}

export function ConfidenceBadge({
  opportunityScore = 50,
  reliabilityScore = 60,
  lowSampleWarning = false,
  isSimulated = false,
  size = 'md',
  showScore = true,
  isDark = true,
}: ConfidenceBadgeProps) {
  const { compositeScore, level, label, sublabel } = calculateConfidence({
    opportunityScore,
    reliabilityScore,
    lowSampleWarning,
    isSimulated,
  });

  const levelStyles = {
    ALTA: {
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      lightBg: 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      badgeText: 'Alta',
      scorePillDark: 'bg-emerald-500/20 text-emerald-300',
      scorePillLight: 'bg-emerald-600/15 text-emerald-900',
    },
    MEDIA: {
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      lightBg: 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      badgeText: 'Media',
      scorePillDark: 'bg-amber-500/20 text-amber-300',
      scorePillLight: 'bg-amber-600/15 text-amber-900',
    },
    BAJA: {
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      lightBg: 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
      badgeText: 'Baja',
      scorePillDark: 'bg-rose-500/20 text-rose-300',
      scorePillLight: 'bg-rose-600/15 text-rose-900',
    },
  }[level];

  const Icon = levelStyles.icon;
  const currentBgClass = isDark ? levelStyles.bg : levelStyles.lightBg;
  const scorePillClass = isDark ? levelStyles.scorePillDark : levelStyles.scorePillLight;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${currentBgClass}`}
        title={`${label} - ${sublabel}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${levelStyles.dot}`} />
        <span>{levelStyles.badgeText}</span>
        {showScore && <span className="font-mono opacity-85 font-semibold">({compositeScore})</span>}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all ${currentBgClass}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 shrink-0" />
          <div>
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{label}</span>
              <span className={`rounded-md px-1.5 py-0.2 font-mono text-[11px] font-black ${scorePillClass}`}>
                {compositeScore}/100
              </span>
            </div>
            <div className={`text-[11px] font-medium leading-tight mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {sublabel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${currentBgClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {showScore && (
          <span className={`rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold ${scorePillClass}`}>
            {compositeScore}/100
          </span>
        )}
      </div>
    </div>
  );
}
