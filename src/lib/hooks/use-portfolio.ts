'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CapitalMovement, RealPosition } from '../types/portfolio';

const PORTFOLIO_STORAGE_KEY = 'quantpulse_portfolio_v1';

interface StoredPortfolio {
  capitalMovements: CapitalMovement[];
  positions: RealPosition[];
}

export function usePortfolio() {
  const [capitalMovements, setCapitalMovements] = useState<CapitalMovement[]>([]);
  const [positions, setPositions] = useState<RealPosition[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate portfolio from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (saved) {
        const parsed: StoredPortfolio = JSON.parse(saved);
        if (parsed) {
          if (Array.isArray(parsed.capitalMovements)) {
            setCapitalMovements(parsed.capitalMovements);
          }
          if (Array.isArray(parsed.positions)) {
            setPositions(parsed.positions);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load portfolio from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // 2. Persist state helper
  const persistState = useCallback(
    (newMovements: CapitalMovement[], newPositions: RealPosition[]) => {
      try {
        const payload: StoredPortfolio = {
          capitalMovements: newMovements,
          positions: newPositions,
        };
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save portfolio to localStorage', e);
      }
    },
    []
  );

  // 3. Add Capital Movement
  const addCapitalMovement = useCallback(
    (
      type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT',
      rawAmount: number,
      note?: string,
      customDate?: string
    ): CapitalMovement => {
      let finalAmount = Math.abs(rawAmount);
      if (type === 'WITHDRAWAL') {
        finalAmount = -finalAmount;
      } else if (type === 'ADJUSTMENT') {
        finalAmount = rawAmount; // Can be positive or negative
      }

      const movement: CapitalMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        amount: finalAmount,
        note: note?.trim() || undefined,
        date: customDate || new Date().toISOString().split('T')[0],
      };

      setCapitalMovements((prev) => {
        const next = [movement, ...prev];
        persistState(next, positions);
        return next;
      });

      return movement;
    },
    [persistState, positions]
  );

  // 4. Remove Capital Movement
  const removeCapitalMovement = useCallback(
    (id: string) => {
      setCapitalMovements((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persistState(next, positions);
        return next;
      });
    },
    [persistState, positions]
  );

  // 5. Open Position
  const openPosition = useCallback(
    (
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
    ): RealPosition => {
      const newPos: RealPosition = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        assetId: asset.id,
        symbol: asset.symbol,
        entryPrice: Number(entryPrice),
        entryDate: entryDate || new Date().toISOString().split('T')[0],
        capitalAllocated: Number(capitalAllocated),
        stopLoss: stopLoss !== null && !isNaN(Number(stopLoss)) ? Number(stopLoss) : null,
        takeProfit: takeProfit !== null && !isNaN(Number(takeProfit)) ? Number(takeProfit) : null,
        status: 'OPEN',
        sourceSuggestion,
      };

      setPositions((prev) => {
        const next = [newPos, ...prev];
        persistState(capitalMovements, next);
        return next;
      });

      return newPos;
    },
    [persistState, capitalMovements]
  );

  // 6. Update Position (allows editing SL/TP/capital for open, or correcting exitPrice for closed)
  const updatePosition = useCallback(
    (id: string, changes: Partial<RealPosition>) => {
      setPositions((prev) => {
        const next = prev.map((pos) => {
          if (pos.id !== id) return pos;

          const updated: RealPosition = { ...pos, ...changes };

          // If position is closed or becoming closed, recalculate realized PnL
          if (updated.status === 'CLOSED' && updated.exitPrice !== undefined && updated.entryPrice > 0) {
            const pnlPct = ((updated.exitPrice - updated.entryPrice) / updated.entryPrice) * 100;
            const pnlUSD = (pnlPct / 100) * updated.capitalAllocated;
            updated.realizedPnlPct = Number(pnlPct.toFixed(2));
            updated.realizedPnl = Number(pnlUSD.toFixed(2));
          }

          return updated;
        });

        persistState(capitalMovements, next);
        return next;
      });
    },
    [persistState, capitalMovements]
  );

  // 7. Close Position
  const closePosition = useCallback(
    (
      id: string,
      exitPrice: number,
      closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL',
      exitDate?: string
    ) => {
      setPositions((prev) => {
        const next = prev.map((pos) => {
          if (pos.id !== id) return pos;

          const ep = Number(exitPrice);
          const pnlPct = ((ep - pos.entryPrice) / pos.entryPrice) * 100;
          const pnlUSD = (pnlPct / 100) * pos.capitalAllocated;

          const closed: RealPosition = {
            ...pos,
            status: 'CLOSED',
            exitPrice: ep,
            exitDate: exitDate || new Date().toISOString().split('T')[0],
            closeReason,
            realizedPnlPct: Number(pnlPct.toFixed(2)),
            realizedPnl: Number(pnlUSD.toFixed(2)),
          };

          return closed;
        });

        persistState(capitalMovements, next);
        return next;
      });
    },
    [persistState, capitalMovements]
  );

  // 8. Delete Position (removes completely from history & capital)
  const deletePosition = useCallback(
    (id: string) => {
      setPositions((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistState(capitalMovements, next);
        return next;
      });
    },
    [persistState, capitalMovements]
  );

  // 9. Calculated Metrics
  // Net Contributions (Sum of deposits and adjustments minus withdrawals)
  const netContributions = useMemo(() => {
    return capitalMovements.reduce((acc, mov) => acc + (mov.amount || 0), 0);
  }, [capitalMovements]);

  // Realized PnL (Sum of closed positions realizedPnl)
  const realizedPnl = useMemo(() => {
    return positions
      .filter((p) => p.status === 'CLOSED')
      .reduce((acc, p) => acc + (p.realizedPnl || 0), 0);
  }, [positions]);

  // Total Capital (Net Contributions + Realized PnL)
  const totalCapital = useMemo(() => {
    return netContributions + realizedPnl;
  }, [netContributions, realizedPnl]);

  // Available Capital = totalCapital - Sum of capitalAllocated of all positions with status === 'OPEN'
  const availableCapital = useMemo(() => {
    const openCapitalAllocated = positions
      .filter((p) => p.status === 'OPEN')
      .reduce((acc, p) => acc + (p.capitalAllocated || 0), 0);
    return Math.max(0, totalCapital - openCapitalAllocated);
  }, [totalCapital, positions]);

  // Helper to compute live unrealized PnL from current price dictionary
  const getLivePositionMetrics = useCallback(
    (pos: RealPosition, currentPrices: Record<string, number>) => {
      const cleanSymbol = pos.symbol.replace('/', '').replace('-', '').toUpperCase();
      const currentPrice =
        currentPrices[pos.assetId] ??
        currentPrices[pos.symbol] ??
        currentPrices[cleanSymbol] ??
        pos.entryPrice;

      if (pos.status === 'CLOSED') {
        return {
          currentPrice: pos.exitPrice ?? pos.entryPrice,
          unrealizedPnlUSD: 0,
          unrealizedPnlPct: 0,
          distToSlPct: null,
          distToTpPct: null,
        };
      }

      const pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      const pnlUSD = (pnlPct / 100) * pos.capitalAllocated;

      const distToSlPct =
        pos.stopLoss !== null ? ((currentPrice - pos.stopLoss) / pos.stopLoss) * 100 : null;
      const distToTpPct =
        pos.takeProfit !== null ? ((pos.takeProfit - currentPrice) / currentPrice) * 100 : null;

      return {
        currentPrice,
        unrealizedPnlUSD: Number(pnlUSD.toFixed(2)),
        unrealizedPnlPct: Number(pnlPct.toFixed(2)),
        distToSlPct: distToSlPct !== null ? Number(distToSlPct.toFixed(2)) : null,
        distToTpPct: distToTpPct !== null ? Number(distToTpPct.toFixed(2)) : null,
      };
    },
    []
  );

  // 10. Check and trigger Auto-Close on SL or TP hits
  const checkAutoClose = useCallback(
    (currentPrices: Record<string, number>): RealPosition[] => {
      if (!currentPrices || Object.keys(currentPrices).length === 0) return [];

      let hasClosed = false;
      const autoClosedList: RealPosition[] = [];

      const updated = positions.map((pos) => {
        if (pos.status !== 'OPEN') return pos;

        const cleanSymbol = pos.symbol.replace('/', '').replace('-', '').toUpperCase();
        const price =
          currentPrices[pos.assetId] ??
          currentPrices[pos.symbol] ??
          currentPrices[cleanSymbol];

        if (price === undefined || isNaN(price) || price <= 0) return pos;

        // Check Stop Loss hit (Price <= SL)
        if (pos.stopLoss !== null && price <= pos.stopLoss) {
          hasClosed = true;
          const exitPrice = pos.stopLoss;
          const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;
          const pnlUSD = (pnlPct / 100) * pos.capitalAllocated;

          const closedPos: RealPosition = {
            ...pos,
            status: 'CLOSED',
            exitPrice,
            exitDate: new Date().toISOString().split('T')[0],
            closeReason: 'STOP_LOSS',
            realizedPnlPct: Number(pnlPct.toFixed(2)),
            realizedPnl: Number(pnlUSD.toFixed(2)),
          };
          autoClosedList.push(closedPos);
          return closedPos;
        }

        // Check Take Profit hit (Price >= TP)
        if (pos.takeProfit !== null && price >= pos.takeProfit) {
          hasClosed = true;
          const exitPrice = pos.takeProfit;
          const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;
          const pnlUSD = (pnlPct / 100) * pos.capitalAllocated;

          const closedPos: RealPosition = {
            ...pos,
            status: 'CLOSED',
            exitPrice,
            exitDate: new Date().toISOString().split('T')[0],
            closeReason: 'TAKE_PROFIT',
            realizedPnlPct: Number(pnlPct.toFixed(2)),
            realizedPnl: Number(pnlUSD.toFixed(2)),
          };
          autoClosedList.push(closedPos);
          return closedPos;
        }

        return pos;
      });

      if (hasClosed) {
        setPositions(updated);
        persistState(capitalMovements, updated);
      }

      return autoClosedList;
    },
    [positions, capitalMovements, persistState]
  );

  return {
    capitalMovements,
    positions,
    isHydrated,
    addCapitalMovement,
    removeCapitalMovement,
    openPosition,
    updatePosition,
    closePosition,
    deletePosition,
    netContributions,
    realizedPnl,
    totalCapital,
    availableCapital,
    getLivePositionMetrics,
    checkAutoClose,
  };
}
