'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY_DISMISSED = 'pwa-install-dismissed';
const STORAGE_KEY_INSTALLED = 'pwa-installed';

/** BeforeInstallPromptEvent is not in TypeScript DOM lib; browsers that support PWA install provide it. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (nav.standalone === true) ||
    document.referrer.includes('android-app://') === true
  );
}

function wasDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === '1';
  } catch {
    return false;
  }
}

function wasInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_INSTALLED) === '1';
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, '1');
  } catch {}
}

function setInstalled(): void {
  try {
    localStorage.setItem(STORAGE_KEY_INSTALLED, '1');
  } catch {}
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const shouldShow = useCallback(() => {
    if (isStandalone() || wasInstalled() || wasDismissed()) return false;
    return !!deferredPrompt;
  }, [deferredPrompt]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!wasDismissed() && !wasInstalled() && !isStandalone()) {
        setVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled();
      setDeferredPrompt(null);
      setVisible(false);
      setInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (isStandalone() || wasInstalled() || wasDismissed()) {
      setVisible(false);
    }
  }, [visible]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled();
      setVisible(false);
    } catch {
      // User cancelled or prompt failed
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed();
    setVisible(false);
  };

  const show = visible && shouldShow();

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
            <img
              src="/logo/primedealautologo.jpeg"
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
              width={40}
              height={40}
            />
            <div>
              <p className="font-semibold text-[#050B20]">Install Prime Deal Auto</p>
              <p className="text-sm text-[#818181]">Add to home screen for quick access</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 rounded-xl bg-[#405FF2] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {installing ? 'Installing…' : 'Install'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl border border-[#E1E1E1] bg-[#F9FBFC] px-3 py-2 text-sm font-medium text-[#050B20] transition-opacity hover:opacity-80"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
