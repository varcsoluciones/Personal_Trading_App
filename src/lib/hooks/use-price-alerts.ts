'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceAlert } from '../types/alerts';
import {
  requestNotificationPermission,
  triggerPriceAlertNotification,
} from '../utils/browser-notifications';

const ALERTS_STORAGE_KEY = 'quantpulse_price_alerts_v1';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate alerts from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAlerts(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load price alerts from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // 2. Persist alerts helper
  const persistAlerts = useCallback((updatedAlerts: PriceAlert[]) => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
    } catch (e) {
      console.warn('Failed to save price alerts to localStorage', e);
    }
  }, []);

  // 3. Add new price alert (Multiple alerts allowed per asset)
  const addAlert = useCallback(
    (
      assetId: string,
      symbol: string,
      targetPrice: number,
      direction: 'ABOVE' | 'BELOW',
      note?: string
    ): PriceAlert => {
      // Prompt user for notification permission on first alert creation
      requestNotificationPermission();

      const newAlert: PriceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        assetId,
        symbol,
        targetPrice: Number(targetPrice),
        direction,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
        active: true,
      };

      setAlerts((prev) => {
        const next = [newAlert, ...prev];
        persistAlerts(next);
        return next;
      });

      return newAlert;
    },
    [persistAlerts]
  );

  // 4. Remove a price alert by ID
  const removeAlert = useCallback(
    (alertId: string) => {
      setAlerts((prev) => {
        const next = prev.filter((a) => a.id !== alertId);
        persistAlerts(next);
        return next;
      });
    },
    [persistAlerts]
  );

  // 5. Query alerts for a specific asset
  const getAlertsForAsset = useCallback(
    (assetId: string): PriceAlert[] => {
      const cleanId = assetId.replace('/', '').replace('-', '').toUpperCase();
      return alerts.filter(
        (a) =>
          a.assetId === assetId ||
          a.assetId.replace('/', '').replace('-', '').toUpperCase() === cleanId ||
          a.symbol.replace('/', '').replace('-', '').toUpperCase() === cleanId
      );
    },
    [alerts]
  );

  // 6. Get active alerts count for an asset or overall
  const getActiveAlertsCount = useCallback(
    (assetId?: string): number => {
      if (assetId) {
        return getAlertsForAsset(assetId).filter((a) => a.active && !a.triggeredAt).length;
      }
      return alerts.filter((a) => a.active && !a.triggeredAt).length;
    },
    [alerts, getAlertsForAsset]
  );

  // 7. Check price alerts against a dictionary of current prices
  const checkAlerts = useCallback(
    (currentPrices: Record<string, number>): PriceAlert[] => {
      if (!currentPrices || Object.keys(currentPrices).length === 0) {
        return [];
      }

      let hasTriggered = false;
      const triggeredAlerts: PriceAlert[] = [];

      const updated = alerts.map((alert) => {
        // Skip already triggered or inactive alerts
        if (!alert.active || alert.triggeredAt) {
          return alert;
        }

        const cleanSymbol = alert.symbol.replace('/', '').replace('-', '').toUpperCase();
        const price =
          currentPrices[alert.assetId] ??
          currentPrices[alert.symbol] ??
          currentPrices[cleanSymbol];

        if (price === undefined || isNaN(price)) {
          return alert;
        }

        const isTriggered =
          (alert.direction === 'ABOVE' && price >= alert.targetPrice) ||
          (alert.direction === 'BELOW' && price <= alert.targetPrice);

        if (isTriggered) {
          hasTriggered = true;
          const triggeredAlert: PriceAlert = {
            ...alert,
            active: false,
            triggeredAt: new Date().toISOString(),
          };

          triggeredAlerts.push(triggeredAlert);
          triggerPriceAlertNotification(triggeredAlert, price);
          return triggeredAlert;
        }

        return alert;
      });

      if (hasTriggered) {
        setAlerts(updated);
        persistAlerts(updated);
      }

      return triggeredAlerts;
    },
    [alerts, persistAlerts]
  );

  return {
    alerts,
    isHydrated,
    addAlert,
    removeAlert,
    getAlertsForAsset,
    getActiveAlertsCount,
    checkAlerts,
  };
}
