'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchAuthSession();
        if (cancelled) return;
        if (!session?.tokens?.idToken) {
          router.replace('/login');
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050B20]">
        <div className="text-white/80 font-medium">Loading...</div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
