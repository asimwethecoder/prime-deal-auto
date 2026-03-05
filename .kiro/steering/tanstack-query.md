# TanStack Query v5 with Next.js 15 Conventions

## Overview
TanStack Query (formerly React Query) v5 is used for server state management in Prime Deal Auto's Next.js 15 frontend. It handles data fetching, caching, synchronization, and mutations for client-side interactions.

## Core Principles
- Server Components fetch data directly — no TanStack Query needed
- TanStack Query is for Client Components that need interactive data fetching
- Use for: user-specific data, mutations, optimistic updates, real-time features
- Don't duplicate server state in Zustand — TanStack Query owns all server data
- **With SSR, always set staleTime > 0** to avoid immediate refetching on the client

## When to Use TanStack Query vs Server Components

### Use Server Components (NO TanStack Query):
- Initial page data (car listings, car details, featured cars)
- SEO-critical content
- Data that doesn't change based on user interaction
- Public pages without authentication

### Use TanStack Query (Client Components):
- User-specific data (favorites, chat history, user profile)
- Data that updates frequently (chat messages, notifications)
- Mutations (add favorite, send message, submit form)
- Optimistic UI updates
- Infinite scroll / load more patterns
- Real-time data that needs polling/refetching

## Setup

**IMPORTANT**: The setup pattern below follows the official TanStack Query v5 + Next.js 15 App Router recommendations. It uses `isServer` helper and avoids `useState` to prevent issues with React Suspense boundaries.

### Provider Setup (App Router)
```typescript
// lib/get-query-client.ts
import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
```

```typescript
// app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/get-query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Query Patterns

### Basic Query Hook
```typescript
// hooks/use-favorites.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/lib/api/favorites';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Query with Parameters
```typescript
// hooks/use-car-recommendations.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCarRecommendations } from '@/lib/api/cars';

export function useCarRecommendations(carId: string) {
  return useQuery({
    queryKey: ['car-recommendations', carId],
    queryFn: () => getCarRecommendations(carId),
    enabled: !!carId, // Only run if carId exists
    staleTime: 5 * 60 * 1000,
  });
}
```

### Dependent Queries
```typescript
// hooks/use-chat-session.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getChatSession, getChatMessages } from '@/lib/api/chat';

export function useChatSession(sessionId: string | null) {
  // First query: get session details
  const sessionQuery = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => getChatSession(sessionId!),
    enabled: !!sessionId,
  });

  // Second query: get messages (depends on session)
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => getChatMessages(sessionId!),
    enabled: !!sessionId && sessionQuery.isSuccess,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  return { sessionQuery, messagesQuery };
}
```

### Infinite Query (Load More Pattern)
```typescript
// hooks/use-infinite-cars.ts
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getCars } from '@/lib/api/cars';

export function useInfiniteCars(filters: CarFilters) {
  return useInfiniteQuery({
    queryKey: ['cars', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => getCars({ ...filters, offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page * lastPage.limit; // Calculate next offset
      }
      return undefined; // No more pages
    },
    initialPageParam: 0,
  });
}
```

## Mutation Patterns

### Basic Mutation
```typescript
// hooks/use-add-favorite.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite } from '@/lib/api/favorites';

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (carId: string) => addFavorite(carId),
    onSuccess: () => {
      // Invalidate favorites query to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      console.error('Failed to add favorite:', error);
      // Show toast notification
    },
  });
}
```

### Optimistic Update
```typescript
// hooks/use-toggle-favorite.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '@/lib/api/favorites';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carId, isFavorite }: { carId: string; isFavorite: boolean }) => {
      return isFavorite ? removeFavorite(carId) : addFavorite(carId);
    },
    onMutate: async ({ carId, isFavorite }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData(['favorites']);

      // Optimistically update
      queryClient.setQueryData(['favorites'], (old: any) => {
        if (isFavorite) {
          return old.filter((id: string) => id !== carId);
        } else {
          return [...old, carId];
        }
      });

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
```

### Mutation with Multiple Invalidations
```typescript
// hooks/use-send-chat-message.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage } from '@/lib/api/chat';

export function useSendChatMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendChatMessage(sessionId, message),
    onSuccess: () => {
      // Invalidate both messages and session (updates last_message_at)
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-session', sessionId] });
    },
  });
}
```

## Query Key Conventions

### Structure
Use array format with hierarchical structure:
```typescript
// Good
['cars']                           // All cars
['cars', 'infinite', filters]      // Infinite scroll with filters
['cars', carId]                    // Single car
['cars', carId, 'recommendations'] // Car recommendations
['favorites']                      // User favorites
['chat-sessions']                  // All chat sessions
['chat-session', sessionId]        // Single session
['chat-messages', sessionId]       // Messages for session
```

### Invalidation Patterns
```typescript
// Invalidate all car queries
queryClient.invalidateQueries({ queryKey: ['cars'] });

// Invalidate specific car
queryClient.invalidateQueries({ queryKey: ['cars', carId] });

// Invalidate all chat-related queries
queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
```

## Error Handling

### Query Error Boundary
```typescript
// components/query-error-boundary.tsx
'use client';

import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 text-center">
          <p className="text-red-600">Something went wrong:</p>
          <pre className="text-sm">{error.message}</pre>
          <button onClick={resetErrorBoundary} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Try again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Component-Level Error Handling
```typescript
// components/favorites-list.tsx
'use client';

import { useFavorites } from '@/hooks/use-favorites';

export function FavoritesList() {
  const { data, isLoading, isError, error, refetch } = useFavorites();

  if (isLoading) {
    return <div>Loading favorites...</div>;
  }

  if (isError) {
    return (
      <div>
        <p>Failed to load favorites: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {data.map((carId) => (
        <CarCard key={carId} carId={carId} />
      ))}
    </div>
  );
}
```

## Loading States

### Skeleton Pattern
```typescript
// components/favorites-list.tsx
'use client';

import { useFavorites } from '@/hooks/use-favorites';
import { CarCardSkeleton } from '@/components/cars/car-card-skeleton';

export function FavoritesList() {
  const { data, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((carId) => (
        <CarCard key={carId} carId={carId} />
      ))}
    </div>
  );
}
```

## Prefetching

### Server Component Prefetching (Recommended for Next.js 15)
```typescript
// app/posts/page.tsx (Server Component)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { getCars } from '@/lib/api/cars';
import { CarsList } from './cars-list';

export default async function CarsPage() {
  const queryClient = getQueryClient();

  // Prefetch data on the server
  await queryClient.prefetchQuery({
    queryKey: ['cars'],
    queryFn: getCars,
  });

  return (
    // Dehydrate and pass to client
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CarsList />
    </HydrationBoundary>
  );
}
```

```typescript
// app/posts/cars-list.tsx (Client Component)
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCars } from '@/lib/api/cars';

export function CarsList() {
  // This data is already prefetched and hydrated from the server
  const { data } = useQuery({
    queryKey: ['cars'],
    queryFn: getCars,
  });

  return (
    <div>
      {data?.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}
```

### Prefetch on Hover
```typescript
// components/car-card.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getCar } from '@/lib/api/cars';

export function CarCard({ carId }: { carId: string }) {
  const queryClient = useQueryClient();

  const prefetchCarDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['cars', carId],
      queryFn: () => getCar(carId),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <div onMouseEnter={prefetchCarDetails}>
      {/* Card content */}
    </div>
  );
}
```

## DevTools

### Enable in Development Only
```typescript
// app/providers.tsx
'use client';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

## Testing

### Mock Query Client
```typescript
// test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors in tests
    },
  });
}

export function renderWithQueryClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

## Prime Deal Auto Specific Patterns

### Chat Widget Pattern
```typescript
// components/chat/chat-widget.tsx
'use client';

import { useChatSession } from '@/hooks/use-chat-session';
import { useSendChatMessage } from '@/hooks/use-send-chat-message';

export function ChatWidget() {
  const sessionId = useSessionId(); // Get from localStorage/cookie
  const { messagesQuery } = useChatSession(sessionId);
  const sendMessage = useSendChatMessage(sessionId);

  const handleSend = (message: string) => {
    sendMessage.mutate(message, {
      onSuccess: () => {
        // Scroll to bottom, clear input
      },
    });
  };

  return (
    <div>
      {messagesQuery.data?.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <ChatInput onSend={handleSend} isLoading={sendMessage.isPending} />
    </div>
  );
}
```

### Favorites Pattern
```typescript
// components/cars/favorite-button.tsx
'use client';

import { useToggleFavorite } from '@/hooks/use-toggle-favorite';
import { useFavorites } from '@/hooks/use-favorites';

export function FavoriteButton({ carId }: { carId: string }) {
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const isFavorite = favorites.includes(carId);

  const handleClick = () => {
    toggleFavorite.mutate({ carId, isFavorite });
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      className={isFavorite ? 'text-red-500' : 'text-gray-400'}
    >
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );
}
```

## Performance Tips

1. **Set appropriate staleTime**: Prevents unnecessary refetches
2. **Use gcTime (formerly cacheTime)**: Keep data in cache longer for better UX
3. **Disable refetchOnWindowFocus**: For data that doesn't change often
4. **Use select option**: Transform data in the query to prevent re-renders
5. **Prefetch on hover**: Improve perceived performance
6. **Use optimistic updates**: Make UI feel instant
7. **Batch invalidations**: Invalidate multiple queries at once after mutations

## Common Pitfalls

1. **Don't use TanStack Query in Server Components** — fetch directly instead
2. **Don't store server state in Zustand** — let TanStack Query manage it
3. **Don't forget to invalidate after mutations** — data will be stale
4. **Don't use the same query key for different data** — causes cache collisions
5. **Don't forget enabled option** — prevents queries from running when they shouldn't
6. **Don't ignore error states** — always handle errors gracefully

## File References
- Frontend pages: #[[file:04-FRONTEND-PAGES.md]]
- Next.js conventions: #[[file:.kiro/steering/nextjs-frontend.md]]
- API patterns: #[[file:.kiro/steering/api-patterns.md]]
