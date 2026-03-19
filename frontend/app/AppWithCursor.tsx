'use client';

import { useEffect } from 'react';
import { ConditionalSiteLayout } from '@/components/layout/ConditionalSiteLayout';

export function AppWithCursor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const toggle = () => document.documentElement.classList.toggle('custom-cursor-active', mq.matches);
    toggle();
    mq.addEventListener('change', toggle);
    return () => mq.removeEventListener('change', toggle);
  }, []);

  return <ConditionalSiteLayout>{children}</ConditionalSiteLayout>;
}
