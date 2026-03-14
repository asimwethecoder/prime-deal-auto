'use client';

// Global Providers for Prime Deal Auto Frontend
// Wraps the app with QueryClientProvider and other providers

import { Amplify } from 'aws-amplify';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/get-query-client';
import { amplifyConfig, isAmplifyConfigured } from '@/lib/amplify-config';

// Configure Amplify immediately (not in useEffect) so it's ready before any auth calls
if (isAmplifyConfigured()) {
  Amplify.configure(amplifyConfig);
}

export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
