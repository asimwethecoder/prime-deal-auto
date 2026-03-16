'use client';

import { ConditionalSiteLayout } from '@/components/layout/ConditionalSiteLayout';
import { CustomCursor } from '@/components/cursor/CustomCursor';

export function AppWithCursor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      <ConditionalSiteLayout>{children}</ConditionalSiteLayout>
    </>
  );
}
