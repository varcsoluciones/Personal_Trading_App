'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset } from '@/lib/types/market';
import { RealPosition } from '@/lib/types/portfolio';
import { useSettings } from '@/lib/context/settings-context';
import { usePortfolioContext } from '@/lib/context/portfolio-context';
import { AssetDropdownSelect } from '@/components/shared/asset-dropdown-select';
import { calculateWeightedAveragePosition, previewAddPurchase } from '@/lib/utils/weighted-average';
import {
  X,
  Wallet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
  Calculator,
  Sparkles,
  History,
  ArrowRight,
} from 'lucide-react';
import { getAssetTypeBadgeStyle } from '@/lib/ui/badge-styles';
import { calculatePriceCorrelation } from '@/lib/utils/correlation';

interface ApplyPositionModalProps {
  assets: Asset[];
  asset?: Asset | null;
  existingPosition?: RealPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyPositionModal({
  assets,
  asset,
  existingPosition,
  isOpen,
  onClose,
}: ApplyPositionModalProps) {
  const { settings, accent, updateSettings, formatCurrency } = useSettings();
  const isDark = settings.theme === 'dark';
  const {
    openPosition,
    addPurchaseToPosition,
    updatePosition,
    positions,
    totalCapital,
    availableCapital,
    wallets,
    getWalletAvailableCapital,
    openWalletModal,
    openHistoryModal,
  } = usePortfolioContext();

  const isEditing = Boolean(existingPosition);
  const isClosed = existingPosition?.status === 'CLOSED';

  // Selected portfolio wallet ID for this position
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
    existingPosition?.portfolioId || wallets[0]?.id || 'wallet_main'
  );

  // Currently selected asset ID (for new position creation)
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    asset?.id ?? assets[0]?.id ?? ''
  );

  const activeAsset = useMemo(() => {
    if (existingPosition) {
      return (
        assets.find(
          (a) =>
            a.id === existingPosition.assetId ||
            a.symbol === existingPosition.symbol ||
            a.symbol.replace('/', '').replace('-', '').toUpperCase() ===
              existingPosition.symbol.replace('/', '').replace('-', '').toUpperCase()
        ) || null
      );
    }
    return assets.find((a) => a.id === selectedAssetId) || asset || assets[0] || null;
  }, [assets, selectedAssetId, existingPosition, asset]);

  // Check if an OPEN position already exists for this asset in the selected portfolio
  const matchingOpenPosition = useMemo(() => {
    if (isEditing || !activeAsset) return null;
    return (
      positions.find(
        (p) =>
          p.status === 'OPEN' &&
          (p.portfolioId === selectedPortfolioId || (!p.portfolioId && selectedPortfolioId === 'wallet_main')) &&
          (p.assetId === activeAsset.id ||
            p.symbol === activeAsset.symbol ||
            p.symbol.replace('/', '').replace('-', '').toUpperCase() ===
              activeAsset.symbol.replace('/', '').replace('-', '').toUpperCase())
      ) || null
    );
  }, [isEditing, activeAsset, positions, selectedPortfolioId]);

  // Mode for averaging/accumulating into existing open position (DCA)
  const [isAccumulateMode, setIsAccumulateMode] = useState<boolean>(false);
  const [purchaseNote, setPurchaseNote] = useState<string>('');

  // Auto-set accumulate mode if matching open position exists
  useEffect(() => {
    if (matchingOpenPosition) {
      setIsAccumulateMode(true);
    } else {
      setIsAccumulateMode(false);
    }
  }, [matchingOpenPosition]);

  // Form states
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [capitalAllocated, setCapitalAllocated] = useState<string>('1000');
  const [useStopLoss, setUseStopLoss] = useState<boolean>(true);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(true);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>('');

  // Risk % per trade state (persisted in settings)
  const [riskPct, setRiskPct] = useState<string>(
    (settings.portfolioRiskPerTradePct ?? 1).toString()
  );

  useEffect(() => {
    if (settings.portfolioRiskPerTradePct !== undefined) {
      setRiskPct(settings.portfolioRiskPerTradePct.toString());
    }
  }, [settings.portfolioRiskPerTradePct]);

  const handleRiskChange = (val: string) => {
    setRiskPct(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateSettings({ portfolioRiskPerTradePct: num });
    }
  };

  // Closed position edit fields
  const [exitPrice, setExitPrice] = useState<string>('');
  const [exitDate, setExitDate] = useState<string>('');
  const [closeReason, setCloseReason] = useState<'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL'>('MANUAL');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Available capital for the selected portfolio
  const walletAvailable = useMemo(() => {
    return getWalletAvailableCapital(selectedPortfolioId);
  }, [getWalletAvailableCapital, selectedPortfolioId]);

  // Effective Available Capital (for existing open positions in the same wallet being edited, adds back their own allocated capital)
  const effectiveAvailableCapital = useMemo(() => {
    if (isEditing && existingPosition && existingPosition.status === 'OPEN') {
      const posWalletId = existingPosition.portfolioId || 'wallet_main';
      if (posWalletId === selectedPortfolioId) {
        return walletAvailable + (existingPosition.capitalAllocated || 0);
      }
    }
    return Math.max(0, walletAvailable);
  }, [isEditing, existingPosition, selectedPortfolioId, walletAvailable]);

  // Capital numeric validation
  const capNum = parseFloat(capitalAllocated);
  const isCapInvalidNumber = isNaN(capNum) || capNum <= 0;
  const isNoAvailableCapital = effectiveAvailableCapital <= 0;
  const isExceedingAvailableCapital = !isCapInvalidNumber && capNum > effectiveAvailableCapital;
  const isCapitalDisallowed = isCapInvalidNumber || isExceedingAvailableCapital || isNoAvailableCapital;

  // Real-time Weighted Average Preview when in Accumulate / DCA mode
  const preview = useMemo(() => {
    const targetPos = matchingOpenPosition;
    if (!isAccumulateMode || !targetPos) return null;
    const pPrice = parseFloat(entryPrice) || 0;
    const pCap = parseFloat(capitalAllocated) || 0;
    if (pPrice <= 0 || pCap <= 0) return null;

    return previewAddPurchase(
      targetPos.purchases,
      {
        price: targetPos.entryPrice,
        capitalAllocated: targetPos.capitalAllocated,
        date: targetPos.entryDate,
      },
      {
        price: pPrice,
        capitalAllocated: pCap,
        date: entryDate,
        note: purchaseNote,
      }
    );
  }, [isAccumulateMode, matchingOpenPosition, entryPrice, capitalAllocated, entryDate, purchaseNote]);

  // Position Size calculation by Risk formula
  const epNum = parseFloat(entryPrice);
  const slNum = useStopLoss && stopLoss ? parseFloat(stopLoss) : null;
  const currentRiskNum = parseFloat(riskPct) || 1;
  const riskInMoney = effectiveAvailableCapital * (currentRiskNum / 100);

  const suggestedCapital = useMemo(() => {
    if (!epNum || epNum <= 0 || slNum === null || slNum <= 0 || epNum <= slNum || effectiveAvailableCapital <= 0) return null;
    const capital = (riskInMoney * epNum) / (epNum - slNum);
    return Number(capital.toFixed(2));
  }, [epNum, slNum, riskInMoney, effectiveAvailableCapital]);

  const isEpInvalid = isNaN(epNum) || epNum <= 0;
  const isSubmitDisabled = isEpInvalid || isCapitalDisallowed;

  // Correlation evaluation against currently open positions
  const correlatedPositions = useMemo(() => {
    if (isClosed || !activeAsset?.candles || activeAsset.candles.length < 5) return [];

    const openPos = positions.filter(
      (p) => p.status === 'OPEN' && p.assetId !== activeAsset.id && p.symbol !== activeAsset.symbol
    );
    const results: { pos: RealPosition; symbol: string; corr: number; capitalAllocated: number }[] = [];

    for (const p of openPos) {
      const matchAsset = assets.find(
        (a) =>
          a.id === p.assetId ||
          a.symbol === p.symbol ||
          a.symbol.replace('/', '').replace('-', '').toUpperCase() ===
            p.symbol.replace('/', '').replace('-', '').toUpperCase()
      );

      if (matchAsset?.candles && matchAsset.candles.length >= 5) {
        const corr = calculatePriceCorrelation(activeAsset.candles, matchAsset.candles, 60);
        if (corr >= 0.7) {
          results.push({
            pos: p,
            symbol: p.symbol,
            corr,
            capitalAllocated: p.capitalAllocated,
          });
        }
      }
    }

    return results;
  }, [positions, activeAsset, assets, isClosed]);

  const correlationWarningData = useMemo(() => {
    if (correlatedPositions.length === 0) return null;

    const symbolsList = correlatedPositions.map((c) => `${c.symbol} (${c.corr.toFixed(2)})`).join(', ');
    const sumCorrelatedCap = correlatedPositions.reduce((acc, c) => acc + c.capitalAllocated, 0);
    const currentCap = parseFloat(capitalAllocated) || 0;
    const totalCorrelatedCap = sumCorrelatedCap + currentCap;
    const concentrationPct = totalCapital > 0 ? (totalCorrelatedCap / totalCapital) * 100 : 0;

    return {
      symbolsList,
      concentrationPct: Number(concentrationPct.toFixed(1)),
    };
  }, [correlatedPositions, capitalAllocated, totalCapital]);

  // Helper to apply suggested values for a specific asset
  const applySuggestedValuesForAsset = (targetAsset: Asset) => {
    const suggestedEntry =
      targetAsset.analysis?.orderSetup.suggestedEntryPrice ?? targetAsset.price;
    const suggestedSL =
      targetAsset.analysis?.orderSetup.suggestedStopLoss ?? suggestedEntry * 0.95;
    const suggestedTP =
      targetAsset.analysis?.orderSetup.suggestedTakeProfit ?? suggestedEntry * 1.10;

    setEntryPrice(suggestedEntry.toString());
    setUseStopLoss(true);
    setStopLoss(suggestedSL.toFixed(4));
    setUseTakeProfit(true);
    setTakeProfit(suggestedTP.toFixed(4));
  };

  // Handle switching asset in dropdown
  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    const newAsset = assets.find((a) => a.id === assetId);
    if (newAsset) {
      applySuggestedValuesForAsset(newAsset);
    }
  };

  // Initialize or reset form values when opening or when asset/position props change
  useEffect(() => {
    if (!isOpen) return;

    if (existingPosition) {
      setSelectedPortfolioId(existingPosition.portfolioId || wallets[0]?.id || 'wallet_main');
      setEntryPrice(existingPosition.entryPrice.toString());
      setCapitalAllocated(existingPosition.capitalAllocated.toString());
      setUseStopLoss(existingPosition.stopLoss !== null);
      setStopLoss(existingPosition.stopLoss !== null ? existingPosition.stopLoss.toString() : '');
      setUseTakeProfit(existingPosition.takeProfit !== null);
      setTakeProfit(existingPosition.takeProfit !== null ? existingPosition.takeProfit.toString() : '');
      setEntryDate(existingPosition.entryDate);

      if (existingPosition.status === 'CLOSED') {
        setExitPrice(existingPosition.exitPrice !== undefined ? existingPosition.exitPrice.toString() : '');
        setExitDate(existingPosition.exitDate || '');
        setCloseReason(existingPosition.closeReason || 'MANUAL');
      }
    } else {
      setSelectedPortfolioId(wallets[0]?.id || 'wallet_main');
      const initialAsset = asset || assets.find((a) => a.id === selectedAssetId) || assets[0];
      if (initialAsset) {
        setSelectedAssetId(initialAsset.id);
        applySuggestedValuesForAsset(initialAsset);
      }
      const initialPortAvailable = wallets[0] ? getWalletAvailableCapital(wallets[0].id) : availableCapital;
      const defaultCap = initialPortAvailable > 0 ? (initialPortAvailable >= 1000 ? 1000 : initialPortAvailable) : 0;
      setCapitalAllocated(defaultCap.toString());
      setEntryDate(new Date().toISOString().split('T')[0]);
      setExitPrice('');
      setExitDate('');
      setCloseReason('MANUAL');
    }
    setSavedSuccess(false);
  }, [existingPosition, asset, isOpen, wallets, availableCapital, getWalletAvailableCapital]);

  if (!isOpen) return null;

  const symbol = existingPosition?.symbol ?? activeAsset?.symbol ?? 'ACTIVO';
  const assetName = activeAsset?.name ?? (existingPosition ? `Posición ${existingPosition.symbol}` : '');
  const assetType = activeAsset?.type ?? 'crypto';
  const order = activeAsset?.analysis?.orderSetup;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ep = parseFloat(entryPrice);
    const cap = parseFloat(capitalAllocated);
    const sl = useStopLoss && stopLoss ? parseFloat(stopLoss) : null;
    const tp = useTakeProfit && takeProfit ? parseFloat(takeProfit) : null;

    if (isNaN(ep) || ep <= 0 || isNaN(cap) || cap <= 0) return;
    if (cap > effectiveAvailableCapital || effectiveAvailableCapital <= 0) return;

    if (isAccumulateMode && matchingOpenPosition) {
      addPurchaseToPosition(
        matchingOpenPosition.id,
        {
          price: ep,
          capitalAllocated: cap,
          date: entryDate,
          note: purchaseNote || 'Compra ponderada DCA',
        },
        sl,
        tp
      );
    } else if (isEditing && existingPosition) {
      const changes: Partial<RealPosition> = {
        portfolioId: selectedPortfolioId,
        entryPrice: ep,
        capitalAllocated: cap,
        stopLoss: sl,
        takeProfit: tp,
        entryDate,
      };

      if (isClosed && exitPrice) {
        changes.exitPrice = parseFloat(exitPrice);
        changes.exitDate = exitDate;
        changes.closeReason = closeReason;
      }

      updatePosition(existingPosition.id, changes);
    } else if (activeAsset) {
      openPosition(
        { id: activeAsset.id, symbol: activeAsset.symbol },
        ep,
        cap,
        sl,
        tp,
        order
          ? {
              suggestedEntryPrice: order.suggestedEntryPrice,
              suggestedStopLoss: order.suggestedStopLoss,
              suggestedTakeProfit: order.suggestedTakeProfit,
            }
          : undefined,
        entryDate,
        selectedPortfolioId,
        purchaseNote || 'Compra inicial'
      );
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-slate-800 bg-[#1c1c1e] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* 1. Modal Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
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
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight">{symbol}</h3>
                <span
                  className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getAssetTypeBadgeStyle(
                    assetType,
                    isDark
                  )}`}
                >
                  {assetType}
                </span>
                {isClosed && (
                  <span className="rounded-md bg-slate-500/20 border border-slate-500/30 px-1.5 py-0.2 text-[9px] font-bold text-slate-400 uppercase">
                    Cerrada
                  </span>
                )}
                {isAccumulateMode && (
                  <span className="rounded-md bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-bold text-blue-400 uppercase">
                    Ponderación DCA
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEditing
                  ? isClosed
                    ? 'Editar Operación Cerrada'
                    : 'Editar Posición Abierta'
                  : isAccumulateMode
                  ? 'Ponderar Compra en Posición Existente'
                  : 'Aplicar Operación en Mi Cartera'}
              </p>
            </div>
          </div>

          <button
            type="button"
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

        {/* 2. Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {isAccumulateMode
                  ? '¡Compra ponderada agregada a la posición con éxito!'
                  : isEditing
                  ? '¡Cambios guardados con éxito!'
                  : '¡Posición registrada en Mi Cartera!'}
              </span>
            </div>
          )}

          {/* Existing Open Position Detected Banner (Toggle between DCA Accumulate & Standalone) */}
          {matchingOpenPosition && !isEditing && (
            <div
              className={`rounded-2xl border p-4 space-y-3 transition-all ${
                isDark
                  ? 'border-blue-500/30 bg-blue-950/20 text-blue-200'
                  : 'border-blue-200 bg-blue-50/80 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold">
                    Posición Abierta Existente en {matchingOpenPosition.symbol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openHistoryModal(matchingOpenPosition)}
                  className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <History className="h-3.5 w-3.5" />
                  Ver Historial ({matchingOpenPosition.purchases?.length || 1})
                </button>
              </div>

              <p className={`text-[11px] leading-relaxed opacity-90 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Ya tienes una posición abierta de <strong>{formatCurrency(matchingOpenPosition.capitalAllocated)}</strong> a un precio promedio de <strong>{formatCurrency(matchingOpenPosition.entryPrice)}</strong> en esta cartera.
              </p>

              {/* Mode Selection Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAccumulateMode(true)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isAccumulateMode
                      ? isDark
                        ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-xs'
                        : 'bg-blue-100/90 border-blue-500 text-blue-900 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#1c1c1e] border-slate-800 text-slate-400 hover:bg-[#2c2c2e]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                    Ponderar Posición (DCA)
                  </span>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    Suma el capital y recalcula el precio promedio
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAccumulateMode(false)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    !isAccumulateMode
                      ? isDark
                        ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-xs'
                        : 'bg-purple-100/90 border-purple-500 text-purple-900 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#1c1c1e] border-slate-800 text-slate-400 hover:bg-[#2c2c2e]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    Operación Separada
                  </span>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    Crea una posición independiente en paralelo
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Live DCA Weighted Average Preview Card */}
          {isAccumulateMode && preview && (
            <div
              className={`rounded-2xl border p-4 space-y-3 transition-all animate-fade-in ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-950/30 to-[#242428] border-indigo-500/30'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50/80 border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Previsualización del Ponderado
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    preview.priceDeltaPct <= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {preview.priceDeltaPct <= 0 ? 'Mejora Promedio: ' : 'Nuevo Promedio: '}
                  {preview.priceDeltaPct > 0 ? `+${preview.priceDeltaPct}%` : `${preview.priceDeltaPct}%`}
                </span>
              </div>

              {/* 3 Columns Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Posición Actual</span>
                  <span className="font-mono font-bold text-slate-200">${preview.currentPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    ${preview.currentCapital.toFixed(0)} • {preview.currentShares.toFixed(2)} uds
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Nueva Compra</span>
                  <span className="font-mono font-bold text-blue-400">
                    ${parseFloat(entryPrice) > 0 ? parseFloat(entryPrice).toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    ${parseFloat(capitalAllocated) > 0 ? parseFloat(capitalAllocated).toFixed(0) : '0'} • {parseFloat(entryPrice) > 0 ? (parseFloat(capitalAllocated) / parseFloat(entryPrice)).toFixed(2) : '0'} uds
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-blue-900/30 border-blue-500/40' : 'bg-blue-100 border-blue-300'}`}>
                  <span className="text-[10px] text-blue-400 block mb-0.5 font-bold">Nuevo Promedio</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    ${preview.newWeightedPrice.toFixed(4)}
                  </span>
                  <span className="text-[10px] opacity-80 block font-mono mt-0.5">
                    Total: ${preview.newTotalCapital.toFixed(0)} • {preview.newTotalShares.toFixed(2)} uds
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Available Capital Alert (Blocking new operations) */}
          {isNoAvailableCapital && (
            <div
              className={`rounded-2xl border p-3.5 flex items-start gap-2.5 text-xs transition-colors ${
                isDark
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Saldo Insuficiente en Cartera</p>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  Tu saldo disponible para operar es de <strong>{formatCurrency(effectiveAvailableCapital)}</strong>. No es posible abrir nuevas operaciones sin capital libre. Registra un depósito o cierra posiciones abiertas para liberar liquidez.
                </p>
              </div>
            </div>
          )}

          {/* Capital Exceeds Available Balance Alert */}
          {!isNoAvailableCapital && isExceedingAvailableCapital && (
            <div
              className={`rounded-2xl border p-3.5 flex items-start gap-2.5 text-xs transition-colors ${
                isDark
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Capital a Invertir Excede Saldo Disponible</p>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  El monto ingresado (<strong>{formatCurrency(capNum)}</strong>) supera tu saldo disponible (<strong>{formatCurrency(effectiveAvailableCapital)}</strong>). Ajusta el monto para continuar.
                </p>
              </div>
            </div>
          )}

          {/* Cartera / Subcuenta Selector */}
          <div
            className={`rounded-2xl border p-3.5 space-y-2 transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Cartera / Broker Destino:
              </label>
              <button
                type="button"
                onClick={openWalletModal}
                className="text-[11px] font-semibold text-blue-500 hover:underline flex items-center gap-1"
              >
                + Gestionar carteras
              </button>
            </div>
            <select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all ${
                isDark
                  ? 'border-slate-700/80 bg-[#1c1c1e] text-white focus:border-blue-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
              }`}
            >
              {wallets.map((w) => {
                const wAvail = getWalletAvailableCapital(w.id);
                return (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.brokerOrExchange ? `(${w.brokerOrExchange})` : ''} • Disp: {formatCurrency(wAvail)}
                  </option>
                );
              })}
            </select>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
              <span>Saldo disponible en esta cartera:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(effectiveAvailableCapital)}
              </span>
            </div>
          </div>

          {/* Asset Dropdown Selector (Only for new operations) */}
          {!isEditing && assets.length > 0 && activeAsset && (
            <div
              className={`rounded-2xl border p-3.5 space-y-1.5 transition-colors ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Seleccionar Activo para la Operación:
              </label>
              <AssetDropdownSelect
                assets={assets}
                selectedAsset={activeAsset}
                onSelectAsset={handleSelectAsset}
                className="w-full"
              />
            </div>
          )}

          {/* Quick Suggested Reference Pills (Auto-calculated for activeAsset) */}
          {!isEditing && order && (
            <div
              className={`rounded-2xl border p-3.5 space-y-2 transition-colors ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Parámetros sugeridos para {activeAsset?.symbol}:</span>
                <span className="text-blue-500 font-bold">Auto-completados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 text-blue-400 font-bold">
                  <span>Entrada:</span>
                  <span>${order.suggestedEntryPrice}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-emerald-400 font-bold">
                  <span>TP:</span>
                  <span>${order.suggestedTakeProfit} (+{order.suggestedTakeProfitPct}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-rose-400 font-bold">
                  <span>SL:</span>
                  <span>${order.suggestedStopLoss} (-{order.suggestedStopLossPct}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Correlation Risk Warning Banner (if high correlation with open positions) */}
          {correlationWarningData && (
            <div
              className={`rounded-2xl border p-3.5 flex items-start gap-2.5 text-xs transition-colors ${
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Aviso de Correlación de Cartera</p>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  Ya tienes una posición abierta en <strong>{correlationWarningData.symbolsList}</strong> con
                  correlación histórica alta con este activo. Estarías concentrando riesgo similar en
                  aproximadamente <strong>{correlationWarningData.concentrationPct}%</strong> de tu capital total.
                </p>
              </div>
            </div>
          )}

          {/* Row 1: Entry Price & Capital Allocated (Symmetrical 2-Column Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            {/* Col 1: Precio de Entrada */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2 flex flex-col justify-between transition-colors ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Precio Entrada ($)
                </label>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mercado: {formatCurrency(activeAsset?.price || 0)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="ej. 75000"
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>

            {/* Col 2: Capital Invertido */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2 flex flex-col justify-between transition-colors ${
                isExceedingAvailableCapital || isNoAvailableCapital
                  ? isDark ? 'border-rose-500/40 bg-rose-500/10' : 'border-rose-300 bg-rose-50/70'
                  : isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Capital a Invertir ($)
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    isExceedingAvailableCapital || isNoAvailableCapital
                      ? 'text-rose-400 font-bold'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  Disp: {formatCurrency(effectiveAvailableCapital)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                required
                value={capitalAllocated}
                onChange={(e) => setCapitalAllocated(e.target.value)}
                placeholder="ej. 1000"
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-colors ${
                  isExceedingAvailableCapital || isNoAvailableCapital
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400 focus:border-rose-500 focus:outline-none'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          {/* Row 2: Stop Loss & Take Profit (Symmetrical 2-Column Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            {/* Col 1: Stop Loss */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2 flex flex-col justify-between transition-colors ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Stop Loss ($)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useStopLoss}
                    onChange={(e) => setUseStopLoss(!e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sin SL</span>
                </label>
              </div>
              <input
                type="number"
                step="any"
                disabled={!useStopLoss}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={useStopLoss ? 'ej. 71500' : 'Sin Stop Loss'}
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-colors ${
                  !useStopLoss
                    ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-transparent'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-rose-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-rose-500 focus:outline-none'
                }`}
              />
            </div>

            {/* Col 2: Take Profit */}
            <div
              className={`rounded-2xl border p-3.5 space-y-2 flex flex-col justify-between transition-colors ${
                isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Take Profit ($)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useTakeProfit}
                    onChange={(e) => setUseTakeProfit(!e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sin TP</span>
                </label>
              </div>
              <input
                type="number"
                step="any"
                disabled={!useTakeProfit}
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder={useTakeProfit ? 'ej. 82000' : 'Sin Take Profit'}
                className={`w-full rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-colors ${
                  !useTakeProfit
                    ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-transparent'
                    : isDark
                    ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-emerald-500 focus:outline-none'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          {/* Section: Tamaño de Posición Sugerido por Riesgo */}
          <div
            className={`rounded-2xl border p-3.5 space-y-2.5 transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Calculator className="h-3.5 w-3.5 text-blue-400" />
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  Tamaño de Posición Sugerido
                </span>
              </div>

              {/* Risk % per trade input */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Riesgo:</span>
                <div className="flex items-center gap-0.5 bg-[#1c1c1e] border border-slate-700/80 rounded-lg px-2 py-0.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={riskPct}
                    onChange={(e) => handleRiskChange(e.target.value)}
                    className="w-9 bg-transparent text-right font-mono font-bold text-xs text-blue-400 focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono text-xs">%</span>
                </div>
              </div>
            </div>

            {suggestedCapital !== null ? (
              <div className="space-y-2 pt-1 border-t border-slate-700/30">
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  Con tu capital disponible ({formatCurrency(effectiveAvailableCapital)}) y un riesgo del {currentRiskNum}%, el tamaño sugerido es{' '}
                  <strong className="text-emerald-400 font-mono font-bold">{formatCurrency(suggestedCapital)}</strong>
                  {suggestedCapital > effectiveAvailableCapital && (
                    <span className="text-amber-400 block text-[10px] mt-0.5 font-semibold">
                      (Nota: el monto sugerido por riesgo supera tu saldo disponible actual de {formatCurrency(effectiveAvailableCapital)})
                    </span>
                  )}
                  .
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setCapitalAllocated(
                      Math.min(suggestedCapital, effectiveAvailableCapital).toString()
                    )
                  }
                  className={`flex items-center justify-center gap-1.5 w-full rounded-xl py-2 px-3 text-xs font-bold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                    isDark
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    {suggestedCapital > effectiveAvailableCapital
                      ? `Usar saldo máximo disponible (${formatCurrency(effectiveAvailableCapital)})`
                      : 'Usar este monto'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-700/30">
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {effectiveAvailableCapital <= 0
                    ? 'No dispones de saldo disponible para calcular tamaño de posición.'
                    : 'Define un Stop Loss para calcular el tamaño de posición sugerido por riesgo.'}
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Entry Date */}
          <div
            className={`rounded-2xl border p-3.5 space-y-2 transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between min-h-[20px]">
              <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Calendar className="h-3.5 w-3.5 text-blue-400" /> Fecha de Entrada
              </label>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Registro histórico
              </span>
            </div>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* If editing a CLOSED position, show editable exit fields */}
          {isClosed && (
            <div
              className={`rounded-2xl border p-4 space-y-3 ${
                isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span>Corrección de Datos de Cierre Real</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Precio de Salida ($):
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha de Salida:
                  </label>
                  <input
                    type="date"
                    required
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Motivo de Cierre:
                  </label>
                  <select
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value as any)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                      isDark
                        ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-amber-500 focus:outline-none'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none'
                    }`}
                  >
                    <option value="TAKE_PROFIT">Take Profit</option>
                    <option value="STOP_LOSS">Stop Loss</option>
                    <option value="MANUAL">Cierre Manual</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Purchase Note / Objective */}
          <div
            className={`rounded-2xl border p-3.5 space-y-1.5 transition-colors ${
              isDark ? 'border-slate-800 bg-[#2c2c2e]/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isAccumulateMode ? 'Nota del Aporte / Compra (Opcional):' : 'Nota u Objetivo de la Operación (Opcional):'}
            </label>
            <input
              type="text"
              placeholder={
                isAccumulateMode
                  ? 'ej. Aporte mensual DCA, Compra en soporte, Rebalanceo...'
                  : 'ej. Swing trade, Inversión largo plazo...'
              }
              value={purchaseNote}
              onChange={(e) => setPurchaseNote(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Submit Button with Dynamic Disabled State */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all shadow-md cursor-pointer ${
              isSubmitDisabled
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 border border-slate-600/50'
                : `${accent.bgClass} text-white hover:opacity-90 active:scale-[0.99]`
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>
              {isNoAvailableCapital
                ? 'Saldo Disponible Insuficiente ($0)'
                : isExceedingAvailableCapital
                ? 'Capital Supera Saldo Disponible'
                : isEpInvalid || isCapInvalidNumber
                ? 'Completar Datos Válidos'
                : isAccumulateMode
                ? `Ponderar y Acumular en Posición (${matchingOpenPosition?.symbol})`
                : isEditing
                ? 'Guardar Cambios'
                : 'Registrar Operación en Mi Cartera'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
