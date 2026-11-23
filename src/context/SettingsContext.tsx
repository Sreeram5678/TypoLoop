'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppSettings } from '@/types/typing';

export const DEFAULT_SETTINGS: AppSettings = {
  modelProvider: 'ollama_gemma4_e2b',
  ollamaBaseUrl: 'http://localhost:11434',
  testDuration: 30,
  soundEnabled: true,
  showLiveWpm: true,
  smoothCaret: true,
  typingMode: 'words',
  aiTheme: 'scifi',
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  saveSettings: (newSettings: AppSettings) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSound: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typoloop_settings');
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          // fallback to defaults
        }
      }
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('typoloop_settings', JSON.stringify(newSettings));
    }
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          localStorage.setItem('typoloop_settings', JSON.stringify(updated));
        }, 250);
      }
      return updated;
    });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettings,
        isSettingsOpen,
        openSettings,
        closeSettings,
        toggleSound,
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

export function useOptionalSettings() {
  return useContext(SettingsContext);
}
