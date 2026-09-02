'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

export type ConfidenceLevel = 'ALTA' | 'MEDIA' | 'BAJA';

export interface ConfidenceBadgeProps {
  opportunityScore?: number;
  reliabilityScore?: number;
  lowSampleWarning?: boolean;
  isSimulated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
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
      sublabel: 'Estructura sólida y validada',
    };
  }

  if (rawScore >= 50) {
    return {
      compositeScore: rawScore,
      level: 'MEDIA',
      label: 'Confianza Media',
      sublabel: lowSample ? 'Muestra estadística n < 30' : 'Señal moderada o en espera',
    };
  }

  return {
    compositeScore: rawScore,
    level: 'BAJA',
    label: 'Confianza Baja',
    sublabel: 'Riesgo elevado o baja persistencia',
  };
}

export function ConfidenceBadge({
  opportunityScore = 50,
  reliabilityScore = 60,
  lowSampleWarning = false,
  isSimulated = false,
  size = 'md',
  showScore = true,
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
      lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      badgeText: 'Alta',
    },
    MEDIA: {
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      lightBg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      badgeText: 'Media',
    },
    BAJA: {
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      lightBg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
      badgeText: 'Baja',
    },
  }[level];

  const Icon = levelStyles.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${levelStyles.bg}`}
        title={`${label} - ${sublabel}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${levelStyles.dot}`} />
        <span>{levelStyles.badgeText}</span>
        {showScore && <span className="font-mono opacity-80 font-normal">({compositeScore})</span>}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${levelStyles.bg}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {showScore && (
          <span className="rounded-md bg-white/10 px-1.5 py-0.2 font-mono text-[10px] font-bold">
            {compositeScore}/100
          </span>
        )}
      </div>
    </div>
  );
}
