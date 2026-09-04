'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CapitalMovement, RealPosition, PortfolioWallet, WalletMetrics, PositionPurchaseLot } from '../types/portfolio';
import { calculateWeightedAveragePosition } from '../utils/weighted-average';

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

  // 2. Persist state whenever state changes after initial hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const payload: StoredPortfolio = {
        wallets,
        capitalMovements,
        positions,
      };
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save portfolio to localStorage', e);
    }
  }, [wallets, capitalMovements, positions, isHydrated]);

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

      setWallets((prev) => [...prev, newWallet]);
      return newWallet;
    },
    []
  );

  const updateWallet = useCallback((id: string, changes: Partial<PortfolioWallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...changes } : w)));
  }, []);

  const deleteWallet = useCallback((id: string, reassignToWalletId?: string) => {
    setWallets((prev) => {
      if (prev.length <= 1) {
        alert('No es posible eliminar la única cartera activa.');
        return prev;
      }

      const remaining = prev.filter((w) => w.id !== id);
      const fallbackTargetId = reassignToWalletId || remaining[0]?.id || 'wallet_main';

      // Reassign any positions and movements belonging to the deleted wallet
      setPositions((prevPos) =>
        prevPos.map((p) => (p.portfolioId === id ? { ...p, portfolioId: fallbackTargetId } : p))
      );

      setCapitalMovements((prevMov) =>
        prevMov.map((m) => {
          const updatedM = { ...m };
          if (updatedM.portfolioId === id) {
            updatedM.portfolioId = fallbackTargetId;
          }
          if (updatedM.targetPortfolioId === id) {
            updatedM.targetPortfolioId = fallbackTargetId;
          }
          return updatedM;
        })
      );

      setSelectedWalletId((current) => (current === id ? 'ALL' : current));

      return remaining;
    });
  }, []);

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
      const activePortId = portfolioId || 'wallet_main';
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

      setCapitalMovements((prev) => [movement, ...prev]);
      return movement;
    },
    []
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
  const updateCapitalMovement = useCallback((id: string, changes: Partial<CapitalMovement>) => {
    setCapitalMovements((prev) =>
      prev.map((m) => {
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
      })
    );
  }, []);

  const removeCapitalMovement = useCallback((id: string) => {
    setCapitalMovements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // 6. Open Position with Portfolio and Purchase Lots support
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
      portfolioId?: string,
      initialNote?: string
    ): RealPosition => {
      const activePortId = portfolioId || 'wallet_main';
      const ep = Number(entryPrice);
      const cap = Number(capitalAllocated);
      const eDate = entryDate || new Date().toISOString().split('T')[0];
      const shares = ep > 0 ? cap / ep : 0;

      const initialLot: PositionPurchaseLot = {
        id: `lot_${Date.now()}_init`,
        date: eDate,
        price: ep,
        capitalAllocated: cap,
        shares,
        note: initialNote?.trim() || 'Compra inicial',
      };

      const newPos: RealPosition = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        portfolioId: activePortId,
        assetId: asset.id,
        symbol: asset.symbol,
        entryPrice: ep,
        entryDate: eDate,
        capitalAllocated: cap,
        totalShares: shares,
        purchases: [initialLot],
        stopLoss: stopLoss !== null && !isNaN(Number(stopLoss)) ? Number(stopLoss) : null,
        takeProfit: takeProfit !== null && !isNaN(Number(takeProfit)) ? Number(takeProfit) : null,
        status: 'OPEN',
        sourceSuggestion,
      };

      setPositions((prev) => [newPos, ...prev]);
      return newPos;
    },
    []
  );

  // 6b. Add a new purchase lot to an existing position (Dollar Cost Averaging / Ponderación)
  const addPurchaseToPosition = useCallback(
    (
      positionId: string,
      purchase: { price: number; capitalAllocated: number; date?: string; note?: string },
      newStopLoss?: number | null,
      newTakeProfit?: number | null
    ): RealPosition | null => {
      let resultPos: RealPosition | null = null;

      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== positionId) return pos;

          // Build existing lots array with backward-compatibility
          let existingLots: PositionPurchaseLot[] = [];
          if (pos.purchases && pos.purchases.length > 0) {
            existingLots = [...pos.purchases];
          } else {
            const initialEp = Number(pos.entryPrice);
            const initialCap = Number(pos.capitalAllocated);
            existingLots = [
              {
                id: `lot_${pos.id}_init`,
                date: pos.entryDate,
                price: initialEp,
                capitalAllocated: initialCap,
                shares: initialEp > 0 ? initialCap / initialEp : 0,
                note: 'Compra inicial',
              },
            ];
          }

          const newLotPrice = Number(purchase.price);
          const newLotCap = Number(purchase.capitalAllocated);
          const newLotShares = newLotPrice > 0 ? newLotCap / newLotPrice : 0;

          const newLot: PositionPurchaseLot = {
            id: `lot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            date: purchase.date || new Date().toISOString().split('T')[0],
            price: newLotPrice,
            capitalAllocated: newLotCap,
            shares: newLotShares,
            note: purchase.note?.trim() || 'Aporte / Compra ponderada',
          };

          const allLots = [...existingLots, newLot];
          const { totalCapital, totalShares, weightedAveragePrice } = calculateWeightedAveragePosition(allLots);

          const updated: RealPosition = {
            ...pos,
            capitalAllocated: totalCapital,
            totalShares,
            entryPrice: weightedAveragePrice,
            purchases: allLots,
            stopLoss:
              newStopLoss !== undefined
                ? newStopLoss !== null && !isNaN(Number(newStopLoss))
                  ? Number(newStopLoss)
                  : null
                : pos.stopLoss,
            takeProfit:
              newTakeProfit !== undefined
                ? newTakeProfit !== null && !isNaN(Number(newTakeProfit))
                  ? Number(newTakeProfit)
                  : null
                : pos.takeProfit,
          };

          resultPos = updated;
          return updated;
        })
      );

      return resultPos;
    },
    []
  );

  // 6c. Remove a purchase lot from a position and recalculate weighted average
  const removePurchaseFromPosition = useCallback(
    (positionId: string, lotId: string): RealPosition | null => {
      let resultPos: RealPosition | null = null;

      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== positionId) return pos;

          const existingLots = pos.purchases && pos.purchases.length > 0 ? pos.purchases : [];
          if (existingLots.length <= 1) {
            alert('Una posición debe conservar al menos un registro de compra.');
            return pos;
          }

          const remainingLots = existingLots.filter((l) => l.id !== lotId);
          if (remainingLots.length === 0) return pos;

          const { totalCapital, totalShares, weightedAveragePrice } =
            calculateWeightedAveragePosition(remainingLots);

          const updated: RealPosition = {
            ...pos,
            capitalAllocated: totalCapital,
            totalShares,
            entryPrice: weightedAveragePrice,
            purchases: remainingLots,
          };

          resultPos = updated;
          return updated;
        })
      );

      return resultPos;
    },
    []
  );

  // 6d. Update an individual purchase lot and recalculate weighted average
  const updatePurchaseLot = useCallback(
    (
      positionId: string,
      lotId: string,
      changes: { price?: number; capitalAllocated?: number; date?: string; note?: string }
    ): RealPosition | null => {
      let resultPos: RealPosition | null = null;

      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== positionId) return pos;

          const existingLots = pos.purchases && pos.purchases.length > 0 ? [...pos.purchases] : [];
          if (existingLots.length === 0) return pos;

          const updatedLots = existingLots.map((l) => {
            if (l.id !== lotId) return l;
            const newPrice = changes.price !== undefined ? Number(changes.price) : l.price;
            const newCap =
              changes.capitalAllocated !== undefined
                ? Number(changes.capitalAllocated)
                : l.capitalAllocated;
            const newShares = newPrice > 0 ? newCap / newPrice : 0;
            return {
              ...l,
              price: newPrice,
              capitalAllocated: newCap,
              shares: newShares,
              date: changes.date !== undefined ? changes.date : l.date,
              note: changes.note !== undefined ? changes.note : l.note,
            };
          });

          const { totalCapital, totalShares, weightedAveragePrice } =
            calculateWeightedAveragePosition(updatedLots);

          const updated: RealPosition = {
            ...pos,
            capitalAllocated: totalCapital,
            totalShares,
            entryPrice: weightedAveragePrice,
            purchases: updatedLots,
          };

          resultPos = updated;
          return updated;
        })
      );

      return resultPos;
    },
    []
  );

  // 7. Update Position
  const updatePosition = useCallback((id: string, changes: Partial<RealPosition>) => {
    setPositions((prev) =>
      prev.map((pos) => {
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
      })
    );
  }, []);

  // 8. Close Position
  const closePosition = useCallback(
    (
      id: string,
      exitPrice: number,
      closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL',
      exitDate?: string
    ) => {
      setPositions((prev) =>
        prev.map((pos) => {
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
        })
      );
    },
    []
  );

  // 9. Delete Position
  const deletePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

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

      setPositions((prev) => {
        const updated = prev.map((pos) => {
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

        return hasClosed ? updated : prev;
      });

      return autoClosedList;
    },
    []
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
    addPurchaseToPosition,
    removePurchaseFromPosition,
    updatePurchaseLot,
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
