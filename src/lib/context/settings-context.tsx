'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  AppleAccentColor,
  APPLE_ACCENT_PALETTE,
} from '../types/settings';

interface SettingsContextType {
  settings: AppSettings;
  accent: typeof APPLE_ACCENT_PALETTE[0];
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  formatCurrency: (amount: number, minimumFractionDigits?: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'quantpulse_user_settings_v2';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // Apply theme class and CSS variable to <html> and <body>
  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#f2f2f7';
      document.body.style.color = '#0f172a';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#f1f5f9';
    }

    const currentAccent =
      APPLE_ACCENT_PALETTE.find((a) => a.id === settings.accentColor) ||
      APPLE_ACCENT_PALETTE[0];
    root.style.setProperty('--color-accent', currentAccent.hex);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings, isHydrated]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const currentAccent =
    APPLE_ACCENT_PALETTE.find((a) => a.id === settings.accentColor) ||
    APPLE_ACCENT_PALETTE[0];

  const formatCurrency = (amount: number, minimumFractionDigits = 2) => {
    const symbolMap = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      USDT: '₮',
    };
    const prefix = symbolMap[settings.currency] || '$';

    if (Math.abs(amount) < 1 && amount !== 0) {
      return `${prefix}${amount.toFixed(4)}`;
    }

    return `${prefix}${amount.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    })}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        accent: currentAccent,
        updateSettings,
        toggleTheme,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
