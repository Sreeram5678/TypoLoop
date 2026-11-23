'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/types/typing';
import { useOptionalSettings, DEFAULT_SETTINGS } from '@/context/SettingsContext';
import {
  Settings,
  X,
  Check,
  Cpu,
  Cloud,
  Volume2,
  VolumeX,
  Eye,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen?: boolean;
  settings?: AppSettings;
  onClose?: () => void;
  onSave?: (settings: AppSettings) => void;
}

export function SettingsModal(props: SettingsModalProps) {
  const context = useOptionalSettings();

  // Support both standalone props or context
  const isOpen = props.isOpen !== undefined ? props.isOpen : (context?.isSettingsOpen ?? false);
  const currentSettings = props.settings || context?.settings || DEFAULT_SETTINGS;
  const handleClose = props.onClose || context?.closeSettings || (() => {});
  const handleSaveParent = props.onSave || context?.saveSettings || (() => {});

  const [formData, setFormData] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    setFormData(currentSettings);
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveParent(formData);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2a1e17]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#ffffff] border border-[#ddd0c2] rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ddd0c2] bg-[#fbf8f3]">
          <div className="flex items-center space-x-2.5 text-[#2a1e17]">
            <div className="p-1.5 rounded-lg bg-[#faede0] text-[#c87d32]">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2a1e17]">
                TypoLoop Preferences
              </h3>
              <p className="text-[11px] font-mono text-[#786558]">
                Coffee theme & Gemma 4 AI engine settings
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#786558] hover:text-[#2a1e17] rounded-lg hover:bg-[#efe6dd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. Gemma Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-[#786558] block font-semibold">
              Gemma AI Biomechanical Engine
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option A: Gemma 4 E2B */}
              <label
                className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.modelProvider === 'ollama_gemma4_e2b'
                    ? 'bg-[#faede0] border-[#c87d32] text-[#2a1e17]'
                    : 'bg-[#fbf8f3] border-[#ddd0c2] text-[#786558] hover:border-[#c87d32]/50'
                }`}
              >
                <input
                  type="radio"
                  name="modelProvider"
                  value="ollama_gemma4_e2b"
                  checked={formData.modelProvider === 'ollama_gemma4_e2b'}
                  onChange={() =>
                    setFormData({ ...formData, modelProvider: 'ollama_gemma4_e2b' })
                  }
                  className="mt-1 accent-[#c87d32]"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[#2a1e17]">
                      Google Gemma 4 E2B (Local via Ollama)
                    </span>
                    <span className="text-[10px] bg-[#c87d32] text-white px-1.5 py-0.2 rounded font-mono font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#786558] mt-0.5">
                    Private edge inference with Deep Thinking Mode on Apple Silicon.
                  </p>
                </div>
              </label>

              {/* Option B: Gemma 2 2B */}
              <label
                className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.modelProvider === 'ollama_gemma2_2b'
                    ? 'bg-[#faede0] border-[#c87d32] text-[#2a1e17]'
                    : 'bg-[#fbf8f3] border-[#ddd0c2] text-[#786558] hover:border-[#c87d32]/50'
                }`}
              >
                <input
                  type="radio"
                  name="modelProvider"
                  value="ollama_gemma2_2b"
                  checked={formData.modelProvider === 'ollama_gemma2_2b'}
                  onChange={() =>
                    setFormData({ ...formData, modelProvider: 'ollama_gemma2_2b' })
                  }
                  className="mt-1 accent-[#c87d32]"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[#2a1e17]">
                      Google Gemma 2 2B (Lightweight Local)
                    </span>
                    <span className="text-[10px] bg-[#efe6dd] text-[#786558] border border-[#ddd0c2] px-1.5 py-0.2 rounded font-mono">
                      Fastest
                    </span>
                  </div>
                  <p className="text-[11px] text-[#786558] mt-0.5">
                    Ultralight footprint (~1.6GB VRAM), instantaneous diagnostic extraction.
                  </p>
                </div>
              </label>

              {/* Option C: Google AI Studio */}
              <label
                className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.modelProvider === 'google_ai_studio'
                    ? 'bg-[#faede0] border-[#c87d32] text-[#2a1e17]'
                    : 'bg-[#fbf8f3] border-[#ddd0c2] text-[#786558] hover:border-[#c87d32]/50'
                }`}
              >
                <input
                  type="radio"
                  name="modelProvider"
                  value="google_ai_studio"
                  checked={formData.modelProvider === 'google_ai_studio'}
                  onChange={() =>
                    setFormData({ ...formData, modelProvider: 'google_ai_studio' })
                  }
                  className="mt-1 accent-[#c87d32]"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[#2a1e17]">
                      Google AI Studio (Cloud API)
                    </span>
                    <span className="text-[10px] bg-[#efe6dd] text-[#786558] border border-[#ddd0c2] px-1.5 py-0.2 rounded font-mono">
                      Cloud
                    </span>
                  </div>
                  <p className="text-[11px] text-[#786558] mt-0.5">
                    Runs via Google Gemini / Gemma API with personal API key.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Inputs */}
          {formData.modelProvider.startsWith('ollama_') ? (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#786558] block">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={formData.ollamaBaseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, ollamaBaseUrl: e.target.value })
                }
                placeholder="http://localhost:11434"
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#fbf8f3] border border-[#ddd0c2] rounded-xl text-[#2a1e17] focus:outline-none focus:border-[#c87d32]"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#786558] block">
                Google AI Studio API Key
              </label>
              <input
                type="password"
                value={formData.googleApiKey || ''}
                onChange={(e) =>
                  setFormData({ ...formData, googleApiKey: e.target.value })
                }
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#fbf8f3] border border-[#ddd0c2] rounded-xl text-[#2a1e17] focus:outline-none focus:border-[#c87d32]"
              />
            </div>
          )}

          {/* 2. Audio & Visual Toggles */}
          <div className="pt-2 border-t border-[#ddd0c2] space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-[#786558] block font-semibold">
              Sensory Feedback & Acoustics
            </label>

            <div className="space-y-2.5">
              {/* Mechanical Switch Audio */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fbf8f3] border border-[#ddd0c2] cursor-pointer hover:bg-[#efe6dd]/60 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-[#efe6dd] text-[#c87d32]">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2a1e17] block">
                      Acoustic Key Clicks
                    </span>
                    <span className="text-[11px] text-[#786558]">
                      Tactile Web Audio mechanical clicks on keystroke
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.soundEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, soundEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#c87d32]"
                />
              </label>

              {/* Live WPM Indicator */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fbf8f3] border border-[#ddd0c2] cursor-pointer hover:bg-[#efe6dd]/60 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-[#efe6dd] text-[#c87d32]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2a1e17] block">
                      Live Speed & Accuracy HUD
                    </span>
                    <span className="text-[11px] text-[#786558]">
                      Display real-time WPM floating above the text arena
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showLiveWpm}
                  onChange={(e) =>
                    setFormData({ ...formData, showLiveWpm: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#c87d32]"
                />
              </label>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-[#ddd0c2] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-mono text-[#786558] hover:text-[#2a1e17] hover:bg-[#efe6dd] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-mono font-semibold bg-[#c87d32] text-white hover:bg-[#b46b25] rounded-xl shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
