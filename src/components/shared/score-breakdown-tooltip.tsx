'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ScoreBreakdown } from '@/lib/types/market';
import { useSettings } from '@/lib/context/settings-context';
import {
  TrendingUp,
  Activity,
  Zap,
  ShieldCheck,
  BarChart2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';

interface ScoreBreakdownTooltipProps {
  score: number;
  breakdown?: ScoreBreakdown;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function ScoreBreakdownTooltip({
  score,
  breakdown,
  children,
  align = 'center',
  className = '',
}: ScoreBreakdownTooltipProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getCriterionIcon = (id: string) => {
    switch (id) {
      case 'trend':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'rsi':
        return <Activity className="h-3.5 w-3.5" />;
      case 'adx':
        return <Zap className="h-3.5 w-3.5" />;
      case 'risk':
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case 'volume':
        return <BarChart2 className="h-3.5 w-3.5" />;
      case 'weekly':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'signal':
        return <Sparkles className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  };

  // Alignment classes
  const alignmentClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  const scoreColor =
    score >= 75
      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
      : score >= 50
      ? 'text-blue-400 bg-blue-500/15 border-blue-500/30'
      : 'text-amber-400 bg-amber-500/15 border-amber-500/30';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Trigger element (Badge or Circle) */}
      <div className="cursor-help transition-transform hover:scale-105 active:scale-95">
        {children}
      </div>

      {/* Floating Breakdown Popover Window */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2.5 z-50 w-[300px] sm:w-[340px] rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in zoom-in-95 duration-150 ${alignmentClass} ${
            isDark
              ? 'bg-[#18181b]/95 border-slate-700/70 text-slate-100 shadow-black/60'
              : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-300/60'
          }`}
          style={{ maxWidth: '90vw' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold border ${scoreColor}`}
              >
                {score}
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans flex items-center gap-1.5">
                  <span>Desglose del Score</span>
                  <span className="text-[10px] text-blue-400 font-normal">({score}/100)</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-sans">
                  Puntuación cuantitativa multifactorial
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                score >= 80
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : score >= 60
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {score >= 80 ? 'Excelente' : score >= 60 ? 'Favorable' : 'Moderado'}
            </span>
          </div>

          {/* Criteria List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {breakdown?.criteria && breakdown.criteria.length > 0 ? (
              breakdown.criteria.map((item) => {
                const isPositive = item.points > 0;
                const isNegative = item.points < 0;
                const isNeutral = item.points === 0;

                const badgeStyle = isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isNegative
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-slate-700/30 text-slate-400 border-slate-700/50';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-2 border transition-colors ${
                      isDark
                        ? 'border-slate-800/80 bg-[#27272a]/50 hover:bg-[#27272a]'
                        : 'border-slate-100 bg-slate-50/80 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span
                          className={`${
                            isPositive
                              ? 'text-emerald-400'
                              : isNegative
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {getCriterionIcon(item.id)}
                        </span>
                        <span className="truncate max-w-[170px]">{item.name}</span>
                      </div>

                      {/* Points / Max Note Badge */}
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${badgeStyle}`}
                      >
                        {item.id === 'base'
                          ? `Base ${item.points}`
                          : `${item.points > 0 ? '+' : ''}${item.points} / ${item.maxPoints}`}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      {item.description}
                    </p>
                  </div>
                );
              })
            ) : (
              // Fallback if breakdown not available
              <div className="text-center py-4 text-xs text-slate-400">
                Score cuantitativo total: {score} / 100
              </div>
            )}
          </div>

          {/* Footer formula info */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/30 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-400" />
              Suma ponderada de 7 criterios
            </span>
            <span className="font-mono font-semibold text-slate-300">
              Total: {score} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
