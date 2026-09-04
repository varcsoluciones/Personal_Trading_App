'use client';

import React, { createContext, useContext, useState } from 'react';
import { usePortfolio } from '../hooks/use-portfolio';
import { CapitalMovement, RealPosition } from '../types/portfolio';
import { Asset } from '../types/market';

interface PortfolioContextType {
  capitalMovements: CapitalMovement[];
  positions: RealPosition[];
  isHydrated: boolean;
  addCapitalMovement: (type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT', amount: number, note?: string, date?: string) => CapitalMovement;
  removeCapitalMovement: (id: string) => void;
  openPosition: (
    asset: { id: string; symbol: string },
    entryPrice: number,
    capitalAllocated: number,
    stopLoss: number | null,
    takeProfit: number | null,
    sourceSuggestion?: {
      suggestedEntryPrice: number;
      suggestedStopLoss: number;
      suggestedTakeProfit: number;
    },
    entryDate?: string
  ) => RealPosition;
  updatePosition: (id: string, changes: Partial<RealPosition>) => void;
  closePosition: (id: string, exitPrice: number, closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL', exitDate?: string) => void;
  deletePosition: (id: string) => void;
  netContributions: number;
  realizedPnl: number;
  totalCapital: number;
  availableCapital: number;
  getLivePositionMetrics: (pos: RealPosition, currentPrices: Record<string, number>) => {
    currentPrice: number;
    unrealizedPnlUSD: number;
    unrealizedPnlPct: number;
    distToSlPct: number | null;
    distToTpPct: number | null;
  };
  checkAutoClose: (currentPrices: Record<string, number>) => RealPosition[];
  // Modal states
  applyModalAsset: Asset | null;
  applyModalPosition: RealPosition | null;
  openApplyModal: (asset?: Asset | null, existingPosition?: RealPosition | null) => void;
  closeApplyModal: () => void;
  isMovementModalOpen: boolean;
  openMovementModal: () => void;
  closeMovementModal: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const portfolioHook = usePortfolio();
  const [applyModalAsset, setApplyModalAsset] = useState<Asset | null>(null);
  const [applyModalPosition, setApplyModalPosition] = useState<RealPosition | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const openApplyModal = (asset?: Asset | null, existingPosition?: RealPosition | null) => {
    setApplyModalAsset(asset || null);
    setApplyModalPosition(existingPosition || null);
  };

  const closeApplyModal = () => {
    setApplyModalAsset(null);
    setApplyModalPosition(null);
  };

  const openMovementModal = () => setIsMovementModalOpen(true);
  const closeMovementModal = () => setIsMovementModalOpen(false);

  return (
    <PortfolioContext.Provider
      value={{
        ...portfolioHook,
        applyModalAsset,
        applyModalPosition,
        openApplyModal,
        closeApplyModal,
        isMovementModalOpen,
        openMovementModal,
        closeMovementModal,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
}
