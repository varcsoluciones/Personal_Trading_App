'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CapitalMovement, RealPosition, PortfolioWallet, WalletMetrics } from '../types/portfolio';

const PORTFOLIO_STORAGE_KEY = 'quantpulse_portfolio_v1';

export const DEFAULT_WALLET: PortfolioWallet = {
  id: 'wallet_main',
  name: 'Cartera 1',
  brokerOrExchange: 'General',
  createdAt: '2026-01-01',
};

interface StoredPortfolio {
  wallets?: PortfolioWallet[];
  capitalMovements: CapitalMovement[];
  positions: RealPosition[];
}

export function usePortfolio() {
  const [wallets, setWallets] = useState<PortfolioWallet[]>([DEFAULT_WALLET]);
  const [capitalMovements, setCapitalMovements] = useState<CapitalMovement[]>([]);
  const [positions, setPositions] = useState<RealPosition[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'ALL'>('ALL');
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate portfolio from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (saved) {
        const parsed: StoredPortfolio = JSON.parse(saved);
        if (parsed) {
          if (Array.isArray(parsed.wallets) && parsed.wallets.length > 0) {
            setWallets(parsed.wallets);
          } else {
            setWallets([DEFAULT_WALLET]);
          }

          if (Array.isArray(parsed.capitalMovements)) {
            // Backward compatibility: ensure movements have portfolioId
            const sanitizedMovements = parsed.capitalMovements.map((m) => ({
              ...m,
              portfolioId: m.portfolioId || 'wallet_main',
            }));
            setCapitalMovements(sanitizedMovements);
          }

          if (Array.isArray(parsed.positions)) {
            // Backward compatibility: ensure positions have portfolioId
            const sanitizedPositions = parsed.positions.map((p) => ({
              ...p,
              portfolioId: p.portfolioId || 'wallet_main',
            }));
            setPositions(sanitizedPositions);
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
    (newWallets: PortfolioWallet[], newMovements: CapitalMovement[], newPositions: RealPosition[]) => {
      try {
        const payload: StoredPortfolio = {
          wallets: newWallets,
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

  // 3. Wallet CRUD
  const createWallet = useCallback(
    (name: string, brokerOrExchange?: string, description?: string): PortfolioWallet => {
      const cleanName = name.trim() || 'Nueva Cartera';
      const newWallet: PortfolioWallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        brokerOrExchange: brokerOrExchange || 'Otro',
        description: description?.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setWallets((prev) => {
        const next = [...prev, newWallet];
        persistState(next, capitalMovements, positions);
        return next;
      });

      return newWallet;
    },
    [persistState, capitalMovements, positions]
  );

  const updateWallet = useCallback(
    (id: string, changes: Partial<PortfolioWallet>) => {
      setWallets((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, ...changes } : w));
        persistState(next, capitalMovements, positions);
        return next;
      });
    },
    [persistState, capitalMovements, positions]
  );

  const deleteWallet = useCallback(
    (id: string, reassignToWalletId?: string) => {
      setWallets((prev) => {
        if (prev.length <= 1) {
          alert('No es posible eliminar la única cartera activa.');
          return prev;
        }

        const remaining = prev.filter((w) => w.id !== id);
        const fallbackTargetId = reassignToWalletId || remaining[0]?.id || 'wallet_main';

        // Reassign any positions and movements belonging to the deleted wallet
        const updatedPositions = positions.map((p) =>
          p.portfolioId === id ? { ...p, portfolioId: fallbackTargetId } : p
        );

        const updatedMovements = capitalMovements.map((m) => {
          let updatedM = { ...m };
          if (updatedM.portfolioId === id) {
            updatedM.portfolioId = fallbackTargetId;
          }
          if (updatedM.targetPortfolioId === id) {
            updatedM.targetPortfolioId = fallbackTargetId;
          }
          return updatedM;
        });

        setPositions(updatedPositions);
        setCapitalMovements(updatedMovements);
        persistState(remaining, updatedMovements, updatedPositions);

        if (selectedWalletId === id) {
          setSelectedWalletId('ALL');
        }

        return remaining;
      });
    },
    [positions, capitalMovements, selectedWalletId, persistState]
  );

  // 4. Add Capital Movement (supports DEPOSIT, WITHDRAWAL, ADJUSTMENT, TRANSFER)
  const addCapitalMovement = useCallback(
    (
      type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'TRANSFER',
      rawAmount: number,
      note?: string,
      customDate?: string,
      portfolioId?: string,
      targetPortfolioId?: string
    ): CapitalMovement => {
      const activePortId = portfolioId || wallets[0]?.id || 'wallet_main';
      let finalAmount = Math.abs(rawAmount);

      if (type === 'WITHDRAWAL') {
        finalAmount = -finalAmount;
      } else if (type === 'ADJUSTMENT') {
        finalAmount = rawAmount; // Can be positive or negative
      }

      const movement: CapitalMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        portfolioId: activePortId,
        targetPortfolioId: type === 'TRANSFER' ? targetPortfolioId : undefined,
        type,
        amount: finalAmount,
        note: note?.trim() || undefined,
        date: customDate || new Date().toISOString().split('T')[0],
      };

      setCapitalMovements((prev) => {
        const next = [movement, ...prev];
        persistState(wallets, next, positions);
        return next;
      });

      return movement;
    },
    [persistState, wallets, positions]
  );

  // Transfer helper
  const transferBetweenWallets = useCallback(
    (
      fromWalletId: string,
      toWalletId: string,
      amount: number,
      note?: string,
      customDate?: string
    ) => {
      return addCapitalMovement(
        'TRANSFER',
        amount,
        note,
        customDate,
        fromWalletId,
        toWalletId
      );
    },
    [addCapitalMovement]
  );

  // 5. Update & Remove Capital Movement
  const updateCapitalMovement = useCallback(
    (id: string, changes: Partial<CapitalMovement>) => {
      setCapitalMovements((prev) => {
        const next = prev.map((m) => {
          if (m.id !== id) return m;
          const updated = { ...m, ...changes };
          if (changes.amount !== undefined || changes.type !== undefined) {
            const raw = Math.abs(changes.amount !== undefined ? changes.amount : m.amount);
            const currentType = changes.type || m.type;
            if (currentType === 'WITHDRAWAL') {
              updated.amount = -raw;
            } else if (currentType === 'DEPOSIT' || currentType === 'TRANSFER') {
              updated.amount = raw;
            } else if (currentType === 'ADJUSTMENT' && changes.amount !== undefined) {
              updated.amount = changes.amount;
            }
          }
          return updated;
        });
        persistState(wallets, next, positions);
        return next;
      });
    },
    [persistState, wallets, positions]
  );

  const removeCapitalMovement = useCallback(
    (id: string) => {
      setCapitalMovements((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persistState(wallets, next, positions);
        return next;
      });
    },
    [persistState, wallets, positions]
  );

  // 6. Open Position with Portfolio support
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
      entryDate?: string,
      portfolioId?: string
    ): RealPosition => {
      const activePortId = portfolioId || wallets[0]?.id || 'wallet_main';

      const newPos: RealPosition = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        portfolioId: activePortId,
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
        persistState(wallets, capitalMovements, next);
        return next;
      });

      return newPos;
    },
    [persistState, wallets, capitalMovements]
  );

  // 7. Update Position
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

        persistState(wallets, capitalMovements, next);
        return next;
      });
    },
    [persistState, wallets, capitalMovements]
  );

  // 8. Close Position
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

        persistState(wallets, capitalMovements, next);
        return next;
      });
    },
    [persistState, wallets, capitalMovements]
  );

  // 9. Delete Position
  const deletePosition = useCallback(
    (id: string) => {
      setPositions((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistState(wallets, capitalMovements, next);
        return next;
      });
    },
    [persistState, wallets, capitalMovements]
  );

  // 10. Helper to compute live unrealized PnL for a single position
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

  // 11. Individual Wallet Metrics Calculator
  const getWalletMetrics = useCallback(
    (walletId: string, currentPrices: Record<string, number>): WalletMetrics => {
      // Net contributions for this specific wallet
      const walletContributions = capitalMovements.reduce((acc, mov) => {
        const isSelf = mov.portfolioId === walletId || (!mov.portfolioId && walletId === 'wallet_main');
        const isTarget = mov.targetPortfolioId === walletId;

        if (mov.type === 'TRANSFER') {
          if (isSelf) return acc - Math.abs(mov.amount); // Outflow from this wallet
          if (isTarget) return acc + Math.abs(mov.amount); // Inflow to this wallet
          return acc;
        }

        if (isSelf) {
          return acc + (mov.amount || 0);
        }
        return acc;
      }, 0);

      // Positions belonging to this wallet
      const walletPositions = positions.filter(
        (p) => p.portfolioId === walletId || (!p.portfolioId && walletId === 'wallet_main')
      );

      const openPos = walletPositions.filter((p) => p.status === 'OPEN');
      const closedPos = walletPositions.filter((p) => p.status === 'CLOSED');

      const realizedPnl = closedPos.reduce((acc, p) => acc + (p.realizedPnl || 0), 0);

      const unrealizedPnl = openPos.reduce((acc, pos) => {
        const metrics = getLivePositionMetrics(pos, currentPrices);
        return acc + metrics.unrealizedPnlUSD;
      }, 0);

      const totalTradingPnl = realizedPnl + unrealizedPnl;
      const settledCapital = walletContributions + realizedPnl;
      const usedCapital = openPos.reduce((acc, p) => acc + (p.capitalAllocated || 0), 0);
      const availableCash = Math.max(0, settledCapital - usedCapital);
      const totalPortfolioValue = settledCapital + unrealizedPnl;

      return {
        walletId,
        netContributions: walletContributions,
        realizedPnl,
        unrealizedPnl,
        totalTradingPnl,
        settledCapital,
        usedCapital,
        availableCash,
        totalPortfolioValue,
        openPositionsCount: openPos.length,
        closedPositionsCount: closedPos.length,
      };
    },
    [capitalMovements, positions, getLivePositionMetrics]
  );

  // 12. Helper to get available capital for a specific wallet (synchronous, without needing live prices)
  const getWalletAvailableCapital = useCallback(
    (walletId: string): number => {
      const walletContributions = capitalMovements.reduce((acc, mov) => {
        const isSelf = mov.portfolioId === walletId || (!mov.portfolioId && walletId === 'wallet_main');
        const isTarget = mov.targetPortfolioId === walletId;

        if (mov.type === 'TRANSFER') {
          if (isSelf) return acc - Math.abs(mov.amount);
          if (isTarget) return acc + Math.abs(mov.amount);
          return acc;
        }

        if (isSelf) {
          return acc + (mov.amount || 0);
        }
        return acc;
      }, 0);

      const walletPositions = positions.filter(
        (p) => p.portfolioId === walletId || (!p.portfolioId && walletId === 'wallet_main')
      );

      const realizedPnl = walletPositions
        .filter((p) => p.status === 'CLOSED')
        .reduce((acc, p) => acc + (p.realizedPnl || 0), 0);

      const usedCapital = walletPositions
        .filter((p) => p.status === 'OPEN')
        .reduce((acc, p) => acc + (p.capitalAllocated || 0), 0);

      return Math.max(0, walletContributions + realizedPnl - usedCapital);
    },
    [capitalMovements, positions]
  );

  // 13. Consolidated Global Metrics (Across All Wallets)
  // Transfers between internal wallets do not affect global net contributions
  const netContributions = useMemo(() => {
    return capitalMovements.reduce((acc, mov) => {
      if (mov.type === 'TRANSFER') return acc; // Internal transfer has net zero effect globally
      return acc + (mov.amount || 0);
    }, 0);
  }, [capitalMovements]);

  const realizedPnl = useMemo(() => {
    return positions
      .filter((p) => p.status === 'CLOSED')
      .reduce((acc, p) => acc + (p.realizedPnl || 0), 0);
  }, [positions]);

  const totalCapital = useMemo(() => {
    return netContributions + realizedPnl;
  }, [netContributions, realizedPnl]);

  const availableCapital = useMemo(() => {
    const openCapitalAllocated = positions
      .filter((p) => p.status === 'OPEN')
      .reduce((acc, p) => acc + (p.capitalAllocated || 0), 0);
    return Math.max(0, totalCapital - openCapitalAllocated);
  }, [totalCapital, positions]);

  // 14. Check and trigger Auto-Close on SL or TP hits
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
        persistState(wallets, capitalMovements, updated);
      }

      return autoClosedList;
    },
    [positions, wallets, capitalMovements, persistState]
  );

  return {
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    createWallet,
    updateWallet,
    deleteWallet,
    capitalMovements,
    positions,
    isHydrated,
    addCapitalMovement,
    updateCapitalMovement,
    transferBetweenWallets,
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
    getWalletMetrics,
    getWalletAvailableCapital,
    checkAutoClose,
  };
}
