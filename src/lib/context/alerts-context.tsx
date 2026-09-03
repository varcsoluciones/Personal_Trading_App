'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PriceAlert } from '../types/alerts';
import { usePriceAlerts } from '../hooks/use-price-alerts';
import { Asset } from '../types/market';
import { IN_APP_ALERT_EVENT, InAppAlertPayload, ALERT_NAVIGATE_EVENT } from '../utils/browser-notifications';

interface AlertsContextType {
  alerts: PriceAlert[];
  isHydrated: boolean;
  addAlert: (assetId: string, symbol: string, targetPrice: number, direction: 'ABOVE' | 'BELOW', note?: string) => PriceAlert;
  removeAlert: (alertId: string) => void;
  getAlertsForAsset: (assetId: string) => PriceAlert[];
  getActiveAlertsCount: (assetId?: string) => number;
  checkAlerts: (currentPrices: Record<string, number>) => PriceAlert[];
  modalAsset: Asset | null;
  openAlertsModal: (asset: Asset) => void;
  closeAlertsModal: () => void;
  activeToast: InAppAlertPayload | null;
  dismissToast: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const alertHook = usePriceAlerts();
  const [modalAsset, setModalAsset] = useState<Asset | null>(null);
  const [activeToast, setActiveToast] = useState<InAppAlertPayload | null>(null);

  const openAlertsModal = (asset: Asset) => {
    setModalAsset(asset);
  };

  const closeAlertsModal = () => {
    setModalAsset(null);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Listen for in-app alert broadcasts to show toast banner
  useEffect(() => {
    const handleInAppAlert = (e: Event) => {
      const customEvent = e as CustomEvent<InAppAlertPayload>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);

        // Auto-dismiss toast after 8 seconds
        const timer = setTimeout(() => {
          setActiveToast((prev) => (prev === customEvent.detail ? null : prev));
        }, 8000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(IN_APP_ALERT_EVENT, handleInAppAlert);
    return () => {
      window.removeEventListener(IN_APP_ALERT_EVENT, handleInAppAlert);
    };
  }, []);

  return (
    <AlertsContext.Provider
      value={{
        ...alertHook,
        modalAsset,
        openAlertsModal,
        closeAlertsModal,
        activeToast,
        dismissToast,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
