'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY_DISMISSED = 'pwa-install-dismissed';
const STORAGE_KEY_INSTALLED = 'pwa-installed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isDismissedThisSession(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY_DISMISSED) === '1'; } catch { return false; }
}

function wasInstalled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY_INSTALLED) === '1'; } catch { return false; }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasInstalled() || isDismissedThisSession()) return;

    // iOS Safari — no beforeinstallprompt, show manual guide after 4s
    if (isIOS()) {
      const t = setTimeout(() => setShowIOSGuide(true), 4000);
      return () => clearTimeout(t);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      try { localStorage.setItem(STORAGE_KEY_INSTALLED, '1'); } catch {}
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        try { localStorage.setItem(STORAGE_KEY_INSTALLED, '1'); } catch {}
      }
      setVisible(false);
    } catch {} finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY_DISMISSED, '1'); } catch {}
    setVisible(false);
    setShowIOSGuide(false);
  };

  const show = (visible && !!deferredPrompt) || showIOSGuide;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Install Prime Deal Auto app"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-1/2 z-[9998] flex -translate-y-1/2 flex-col gap-3 rounded-l-2xl border border-r-0 border-[#E1E1E1] bg-white p-4 shadow-lg sm:max-w-[280px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#405FF2]">
              <img src="/icons/car-front-svgrepo-com.svg" alt="" width={24} height={24} className="invert" />
            </div>
            <div>
              <p className="font-semibold text-[#050B20]">Never Miss a Deal</p>
              <p className="text-sm text-[#818181]">
                {showIOSGuide
                  ? 'Tap the share button, then "Add to Home Screen"'
                  : 'Browse deals, save cars & book test drives — right from your home screen.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!showIOSGuide && (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 rounded-xl bg-[#405FF2] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {installing ? 'Installing…' : 'Install Now'}
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 rounded-xl border border-[#E1E1E1] bg-[#F9FBFC] px-3 py-2 text-sm font-medium text-[#050B20] transition-opacity hover:opacity-80"
            >
              {showIOSGuide ? 'Got it' : 'Maybe Later'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
