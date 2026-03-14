# Design Document: AI Chat Widget Frontend

## Overview

The AI Chat Widget Frontend provides a floating conversational interface for users to interact with Prime Deal Auto's AI-powered car sales assistant. The widget integrates with the existing backend chat API to enable natural language car discovery, displaying inline car cards when the AI mentions specific vehicles.

### Key Design Decisions

1. **Client Component Architecture**: The entire chat widget is a client component since it requires interactivity, state management, and browser APIs (localStorage, sessionStorage).

2. **Route-Based Visibility**: The widget uses `usePathname()` to conditionally render only on public pages, excluding `/admin/*` and `/dashboard/*` routes.

3. **TanStack Query for Server State**: All API interactions (send message, fetch history, fetch sessions) use TanStack Query for caching, optimistic updates, and error handling.

4. **Zustand for UI State**: A lightweight Zustand store manages the open/closed state with sessionStorage persistence.

5. **Lazy Loading**: The chat window component is dynamically imported to reduce initial bundle size since most users won't open the chat immediately.

## Architecture

### Component Hierarchy

```
ChatWidget (root - renders in layout.tsx)
├── ChatButton (floating button, always visible on public pages)
└── ChatWindow (conditionally rendered when open)
    ├── ChatHeader (title, new conversation button, close button)
    ├── MessageList (scrollable message container)
    │   ├── MessageBubble (user or assistant message)
    │   │   └── ChatCarCard (inline car card when URL detected)
    │   ├── TypingIndicator (shown while waiting for response)
    │   └── MessageSkeleton (loading state)
    └── MessageInput (text input + send button)
```


### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ChatWidget                                   │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │   Zustand Store │    │           TanStack Query                │ │
│  │   (UI State)    │    │         (Server State)                  │ │
│  │                 │    │                                         │ │
│  │ - isOpen        │    │ - useSendMessage (mutation)             │ │
│  │ - toggle()      │    │ - useChatHistory (query)                │ │
│  │ - open()        │    │ - useChatSessions (query)               │ │
│  │ - close()       │    │ - useCarDetails (query, for car cards)  │ │
│  └────────┬────────┘    └────────────────┬────────────────────────┘ │
│           │                              │                          │
│           ▼                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    localStorage / sessionStorage                 ││
│  │  - chat_session_token (anonymous session ID)                    ││
│  │  - chat_widget_open (open/closed state)                         ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### ChatWidget (Root Component)

The root component that conditionally renders based on the current route.

```typescript
// frontend/components/chat/ChatWidget.tsx
'use client';

interface ChatWidgetProps {
  // No props - uses hooks for all state
}

// Renders ChatButton always, ChatWindow when open
// Uses usePathname() to check route visibility
// Excluded routes: /admin/*, /dashboard/*
```

### ChatButton

The floating action button that toggles the chat window.

```typescript
// frontend/components/chat/ChatButton.tsx
'use client';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

// 60px circular button, fixed bottom-right (24px margin)
// z-index: 50
// Background: #405FF2, Icon: white
// Icon: MessageCircle when closed, X when open
// Hover: scale(1.05) transition
// aria-label: "Open chat" | "Close chat"
```

### ChatWindow

The main chat interface panel.

```typescript
// frontend/components/chat/ChatWindow.tsx
'use client';

interface ChatWindowProps {
  onClose: () => void;
  sessionId: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
}

// Desktop: 400px × 600px max-height, 16px border-radius
// Mobile: full screen, 0 border-radius
// Shadow: 0px 6px 24px rgba(0, 0, 0, 0.1)
// role="dialog", aria-labelledby="chat-header-title"
// Animation: slide-up + fade-in (200ms)
```

### ChatHeader

The header section with title and controls.

```typescript
// frontend/components/chat/ChatHeader.tsx
'use client';

interface ChatHeaderProps {
  onClose: () => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

// Title: "Chat with us" (id="chat-header-title")
// New conversation button (RefreshCw icon)
// Close button (X icon)
```

### MessageList

The scrollable container for messages.

```typescript
// frontend/components/chat/MessageList.tsx
'use client';

interface MessageListProps {
  messages: ChatMessageDisplay[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
  onRetry: () => void;
}

// role="log", aria-live="polite"
// Auto-scroll to bottom on new messages
// Shows MessageSkeleton when loading
// Shows TypingIndicator when isTyping
```

### MessageBubble

Individual message display component.

```typescript
// frontend/components/chat/MessageBubble.tsx
'use client';

interface MessageBubbleProps {
  message: ChatMessageDisplay;
  onRetry?: () => void;
}

// User: right-aligned, #405FF2 bg, white text, bottom-right corner squared
// Assistant: left-aligned, #F9FBFC bg, #050B20 text, bottom-left corner squared
// Max-width: 85%
// Timestamp: 12px font below content
// Supports markdown (bold, italic, links) for assistant messages
// Renders ChatCarCard for detected car URLs
```

### ChatCarCard

Inline car card displayed when AI mentions a vehicle.

```typescript
// frontend/components/chat/ChatCarCard.tsx
'use client';

interface ChatCarCardProps {
  carId: string;
}

// Max-width: 280px
// Shows: primary image, make, model, year, price (ZAR), mileage
// Loading: skeleton state
// Error: fallback link to car page
// Click: navigate to /cars/{carId}
```

### MessageInput

The input area for composing messages.

```typescript
// frontend/components/chat/MessageInput.tsx
'use client';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

// Textarea with placeholder "Type your message..."
// Max 2000 characters
// Character count shown when > 1800 chars
// Enter: submit, Shift+Enter: newline
// Send button: arrow icon, disabled when empty or loading
// Loading: spinner on send button
```

### TypingIndicator

Animated indicator shown while waiting for AI response.

```typescript
// frontend/components/chat/TypingIndicator.tsx
'use client';

// Three dots with staggered bounce animation
// Styled as assistant message bubble (left-aligned, gray bg)
// Respects prefers-reduced-motion
```

### MessageSkeleton

Loading skeleton for message history.

```typescript
// frontend/components/chat/MessageSkeleton.tsx
'use client';

// 3-5 placeholder bubbles with shimmer animation
// Alternating left/right alignment
// Respects prefers-reduced-motion
```

## Data Models

### TypeScript Types

```typescript
// frontend/lib/types/chat.ts

/**
 * Message role enum
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message status for optimistic updates and error handling
 */
export type MessageStatus = 'sending' | 'sent' | 'error';

/**
 * Display message type (extends API type with UI state)
 */
export interface ChatMessageDisplay {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  error?: string;
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  sessionToken?: string;
}

/**
 * Send message response (from POST /chat)
 */
export interface SendMessageResponse {
  sessionId: string;
  sessionToken?: string;
  message: string;
  createdAt: string;
}

/**
 * Session summary (from GET /chat/sessions)
 */
export interface ChatSessionSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

/**
 * Session detail with messages (from GET /chat/sessions/:id)
 */
export interface ChatSessionDetail {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    role: MessageRole;
    content: string;
    createdAt: string;
  }>;
}

/**
 * Parsed car reference from message content
 */
export interface CarReference {
  carId: string;
  url: string;
  startIndex: number;
  endIndex: number;
}
```


## API Client Functions

```typescript
// frontend/lib/api/chat.ts

import { get, post, del } from './client';
import type {
  SendMessageRequest,
  SendMessageResponse,
  ChatSessionSummary,
  ChatSessionDetail,
} from '@/lib/types/chat';

/**
 * Send a chat message
 * POST /chat (no auth required)
 */
export async function sendChatMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  return post<SendMessageResponse>('/chat', request);
}

/**
 * Get user's chat sessions (authenticated only)
 * GET /chat/sessions
 */
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  return get<ChatSessionSummary[]>('/chat/sessions');
}

/**
 * Get session detail with message history
 * GET /chat/sessions/:id
 * For anonymous users, sessionToken query param is required
 */
export async function getChatSession(
  sessionId: string,
  sessionToken?: string
): Promise<ChatSessionDetail> {
  const params = sessionToken ? { sessionToken } : undefined;
  return get<ChatSessionDetail>(`/chat/sessions/${sessionId}`, params);
}

/**
 * Delete a chat session (authenticated only)
 * DELETE /chat/sessions/:id
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  return del<void>(`/chat/sessions/${sessionId}`);
}
```

## TanStack Query Hooks

```typescript
// frontend/hooks/use-chat.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sendChatMessage,
  getChatSessions,
  getChatSession,
} from '@/lib/api/chat';
import type {
  SendMessageRequest,
  SendMessageResponse,
  ChatMessageDisplay,
} from '@/lib/types/chat';

/**
 * Query keys for chat-related queries
 */
export const chatKeys = {
  all: ['chat'] as const,
  sessions: () => [...chatKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
  history: (id: string, token?: string) =>
    [...chatKeys.all, 'history', id, token] as const,
};

/**
 * Hook for sending chat messages with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) => sendChatMessage(request),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const queryKey = chatKeys.history(
        variables.sessionId || 'new',
        variables.sessionToken
      );
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<ChatMessageDisplay[]>(queryKey);

      // Optimistically add user message
      const optimisticMessage: ChatMessageDisplay = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: variables.message,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData<ChatMessageDisplay[]>(queryKey, (old) => [
        ...(old || []),
        optimisticMessage,
      ]);

      return { previousMessages, queryKey, optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      if (!context) return;

      // Update with real message and add assistant response
      queryClient.setQueryData<ChatMessageDisplay[]>(
        context.queryKey,
        (old) => {
          if (!old) return old;

          // Replace optimistic message with confirmed user message
          const updated = old.map((msg) =>
            msg.id === context.optimisticMessage.id
              ? { ...msg, status: 'sent' as const }
              : msg
          );

          // Add assistant response
          updated.push({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            createdAt: data.createdAt,
            status: 'sent',
          });

          return updated;
        }
      );
    },
    onError: (error, variables, context) => {
      if (!context) return;

      // Mark message as failed
      queryClient.setQueryData<ChatMessageDisplay[]>(
        context.queryKey,
        (old) => {
          if (!old) return old;
          return old.map((msg) =>
            msg.id === context.optimisticMessage.id
              ? { ...msg, status: 'error' as const, error: error.message }
              : msg
          );
        }
      );
    },
  });
}

/**
 * Hook for fetching chat history
 */
export function useChatHistory(
  sessionId: string | null,
  sessionToken: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: chatKeys.history(sessionId || '', sessionToken || undefined),
    queryFn: async () => {
      if (!sessionId) return [];
      const session = await getChatSession(sessionId, sessionToken || undefined);
      return session.messages.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        status: 'sent' as const,
      }));
    },
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching user's chat sessions (authenticated only)
 */
export function useChatSessions(enabled: boolean = true) {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: getChatSessions,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

## Zustand Store

```typescript
// frontend/lib/stores/chat-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatUIState {
  isOpen: boolean;
  sessionId: string | null;
  draftMessage: string;
}

interface ChatUIActions {
  toggle: () => void;
  open: () => void;
  close: () => void;
  setSessionId: (id: string | null) => void;
  setDraftMessage: (message: string) => void;
  clearDraft: () => void;
}

type ChatStore = ChatUIState & ChatUIActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      // State
      isOpen: false,
      sessionId: null,
      draftMessage: '',

      // Actions
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setSessionId: (id) => set({ sessionId: id }),
      setDraftMessage: (message) => set({ draftMessage: message }),
      clearDraft: () => set({ draftMessage: '' }),
    }),
    {
      name: 'chat-widget-state',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isOpen: state.isOpen,
        sessionId: state.sessionId,
        // Note: draftMessage is NOT persisted (per requirements)
      }),
    }
  )
);
```

## Session Token Management

```typescript
// frontend/lib/utils/chat-session.ts

const SESSION_TOKEN_KEY = 'chat_session_token';
const SESSION_ID_KEY = 'chat_session_id';

/**
 * Get stored session token for anonymous users
 */
export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Get stored session ID for anonymous users
 */
export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

/**
 * Store session credentials for anonymous users
 */
export function storeSessionCredentials(
  sessionId: string,
  sessionToken: string
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ID_KEY, sessionId);
  localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
}

/**
 * Clear stored session credentials
 */
export function clearSessionCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Check if user has stored session
 */
export function hasStoredSession(): boolean {
  return !!getStoredSessionToken() && !!getStoredSessionId();
}
```


## Route Visibility Logic

```typescript
// frontend/lib/utils/chat-visibility.ts

/**
 * Routes where the chat widget should NOT be displayed
 */
const EXCLUDED_ROUTE_PREFIXES = ['/admin', '/dashboard'];

/**
 * Check if chat widget should be visible on the given pathname
 */
export function isChatVisibleOnRoute(pathname: string): boolean {
  return !EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}
```

Usage in ChatWidget:

```typescript
// frontend/components/chat/ChatWidget.tsx
'use client';

import { usePathname } from 'next/navigation';
import { isChatVisibleOnRoute } from '@/lib/utils/chat-visibility';

export function ChatWidget() {
  const pathname = usePathname();

  // Don't render on admin/dashboard routes
  if (!isChatVisibleOnRoute(pathname)) {
    return null;
  }

  // ... rest of component
}
```

## Car Card Parsing Logic

```typescript
// frontend/lib/utils/parse-car-references.ts

import type { CarReference } from '@/lib/types/chat';

/**
 * Regex to match car URLs in message content
 * Matches: https://primedealauto.co.za/cars/{uuid}
 */
const CAR_URL_REGEX =
  /https?:\/\/(?:www\.)?primedealauto\.co\.za\/cars\/([a-f0-9-]{36})/gi;

/**
 * Parse car references from message content
 */
export function parseCarReferences(content: string): CarReference[] {
  const references: CarReference[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  CAR_URL_REGEX.lastIndex = 0;

  while ((match = CAR_URL_REGEX.exec(content)) !== null) {
    references.push({
      carId: match[1],
      url: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return references;
}

/**
 * Split message content into text and car reference segments
 */
export interface MessageSegment {
  type: 'text' | 'car';
  content: string;
  carId?: string;
}

export function splitMessageContent(content: string): MessageSegment[] {
  const references = parseCarReferences(content);

  if (references.length === 0) {
    return [{ type: 'text', content }];
  }

  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const ref of references) {
    // Add text before this reference
    if (ref.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, ref.startIndex),
      });
    }

    // Add car reference
    segments.push({
      type: 'car',
      content: ref.url,
      carId: ref.carId,
    });

    lastIndex = ref.endIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return segments;
}
```

## Animation Specifications

### CSS Animations (Tailwind)

```css
/* frontend/app/globals.css - add to existing file */

/* Chat window slide-up animation */
@keyframes chat-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes chat-slide-down {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

/* Message bubble fade-in */
@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing indicator bounce */
@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Animation classes */
.animate-chat-open {
  animation: chat-slide-up 200ms ease-out forwards;
}

.animate-chat-close {
  animation: chat-slide-down 200ms ease-in forwards;
}

.animate-message-in {
  animation: message-fade-in 200ms ease-out forwards;
}

.animate-typing-dot {
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.animate-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.animate-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-chat-open,
  .animate-chat-close,
  .animate-message-in,
  .animate-typing-dot,
  .animate-shimmer {
    animation: none;
  }

  .animate-chat-open {
    opacity: 1;
    transform: none;
  }
}
```

### Animation Timing

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Chat window open | 200ms | ease-out | Button click |
| Chat window close | 200ms | ease-in | Close/button click |
| Message bubble appear | 200ms | ease-out | New message added |
| Button hover scale | 150ms | ease-out | Mouse enter |
| Typing dot bounce | 1.4s | ease-in-out | Loop while typing |
| Skeleton shimmer | 1.5s | linear | Loop while loading |

## Error Handling

### Error Types and Messages

| Error Code | HTTP Status | User Message |
|------------|-------------|--------------|
| RATE_LIMITED | 429 | "You're sending messages too quickly. Please wait a moment." |
| INTERNAL_ERROR | 5xx | "Something went wrong. Please try again." |
| Network Error | 0 | "Unable to connect. Please check your internet connection." |
| VALIDATION_ERROR | 400 | "Your message couldn't be sent. Please try again." |
| NOT_FOUND | 404 | "This conversation could not be found." |

### Error Recovery

```typescript
// Error message component with retry
interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

// Inline error display in MessageList
// Shows warning icon, error text, and Retry button
// Styled with amber/yellow warning colors
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Exclusion

*For any* route path starting with `/admin` or `/dashboard`, the ChatWidget component should return null and not render any DOM elements.

**Validates: Requirements 1.2**

### Property 2: Toggle State Consistency

*For any* initial open/closed state of the chat widget, clicking the ChatButton should result in the opposite state (open → closed, closed → open).

**Validates: Requirements 1.6**

### Property 3: Message Chronological Order

*For any* list of messages with timestamps, the MessageList should render them in ascending chronological order (oldest first, newest last).

**Validates: Requirements 3.1**

### Property 4: User Message Styling

*For any* message with `role='user'`, the MessageBubble should have right alignment, secondary color (#405FF2) background, and white text color.

**Validates: Requirements 3.2**

### Property 5: Assistant Message Styling

*For any* message with `role='assistant'`, the MessageBubble should have left alignment, light gray (#F9FBFC) background, and primary color (#050B20) text.

**Validates: Requirements 3.3**

### Property 6: Auto-Scroll on New Message

*For any* MessageList with messages, when a new message is added, the scroll position should be at the bottom showing the latest message.

**Validates: Requirements 3.7**

### Property 7: Markdown Rendering

*For any* assistant message containing markdown syntax (`**bold**`, `*italic*`, `[link](url)`), the rendered output should contain the corresponding HTML elements (`<strong>`, `<em>`, `<a>`).

**Validates: Requirements 3.8**

### Property 8: Empty Input Disables Send

*For any* MessageInput with empty or whitespace-only content, the send button should be disabled.

**Validates: Requirements 4.3**

### Property 9: Input Cleared After Send

*For any* successful message send operation, the MessageInput text field should be empty after completion.

**Validates: Requirements 4.7**

### Property 10: Character Limit Enforcement

*For any* input text exceeding 2000 characters, the MessageInput should prevent submission or truncate the input.

**Validates: Requirements 4.8**

### Property 11: Character Count Visibility

*For any* input text with length greater than 1800 characters, the character count indicator should be visible.

**Validates: Requirements 4.9**

### Property 12: Session Token Storage (Anonymous)

*For any* anonymous user's first message that receives a successful response with sessionToken, the token should be stored in localStorage under key "chat_session_token".

**Validates: Requirements 5.1**

### Property 13: Session Token Inclusion

*For any* message sent after the first (with existing sessionToken in localStorage), the request should include the stored sessionToken.

**Validates: Requirements 5.2**

### Property 14: History Load on Open

*For any* ChatWindow opened with an existing sessionId and sessionToken, the component should fetch conversation history from the API.

**Validates: Requirements 5.3**

### Property 15: Authenticated Session Fetch

*For any* authenticated user opening the ChatWidget, the component should call GET /chat/sessions to fetch their session list.

**Validates: Requirements 6.1**

### Property 16: Most Recent Session Load

*For any* authenticated user with existing sessions, the ChatWidget should load messages from the most recent session (by updatedAt).

**Validates: Requirements 6.2**

### Property 17: No LocalStorage for Authenticated

*For any* authenticated user, the localStorage should not contain "chat_session_token" key.

**Validates: Requirements 6.4**

### Property 18: Typing Indicator During Request

*For any* pending message send request, the TypingIndicator should be visible in the MessageList.

**Validates: Requirements 7.1**

### Property 19: Loading Skeleton on History Fetch

*For any* ChatWindow opened with existing session while history is loading, the MessageSkeleton should be displayed.

**Validates: Requirements 7.4**

### Property 20: Network Error Retry

*For any* message that fails due to network error, an error message with "Retry" button should be displayed, and clicking Retry should resend the message.

**Validates: Requirements 8.1, 8.5**

### Property 21: Server Error Message

*For any* API response with 5xx status code, the error message "Something went wrong. Please try again." should be displayed.

**Validates: Requirements 8.3**

### Property 22: Car URL Detection

*For any* assistant message containing a URL matching `https://primedealauto.co.za/cars/{uuid}`, a ChatCarCard component should be rendered inline.

**Validates: Requirements 9.1**

### Property 23: Car Card Caching

*For any* car ID that has been fetched previously, subsequent ChatCarCard renders should use cached data without making a new API request.

**Validates: Requirements 9.3**

### Property 24: Car Card Fallback

*For any* car ID where the GET /cars/{id} request fails, the ChatCarCard should display a fallback link to the car URL.

**Validates: Requirements 9.6**

### Property 25: ARIA Label Toggle

*For any* ChatButton, the aria-label should be "Open chat" when isOpen is false and "Close chat" when isOpen is true.

**Validates: Requirements 10.1**

### Property 26: Focus Management Open

*For any* ChatWindow open action, focus should move to the MessageInput field.

**Validates: Requirements 10.3**

### Property 27: Focus Management Close

*For any* ChatWindow close action, focus should return to the ChatButton.

**Validates: Requirements 10.4**

### Property 28: Reduced Motion Respect

*For any* user with `prefers-reduced-motion: reduce` media query, all animations should be disabled or instant.

**Validates: Requirements 12.4**

### Property 29: State Persistence Across Navigation

*For any* page navigation within the app, the ChatWidget open/closed state should be preserved via sessionStorage.

**Validates: Requirements 13.1, 13.2**

### Property 30: TanStack Query Stale Time

*For any* chat history query, the staleTime should be configured to 5 minutes (300000ms).

**Validates: Requirements 13.4**

## Testing Strategy

### Unit Testing (Vitest + Testing Library)

Unit tests focus on specific examples, edge cases, and component isolation:

1. **Component Rendering**
   - ChatButton renders with correct icon based on isOpen state
   - ChatWindow renders header, message list, and input
   - MessageBubble renders with correct styling for user/assistant
   - ChatCarCard renders car details correctly

2. **Edge Cases**
   - Empty message list displays welcome message
   - Very long messages are handled gracefully
   - Invalid session token triggers new session flow
   - Network timeout handling

3. **Accessibility**
   - ARIA attributes are correctly set
   - Keyboard navigation works (Tab, Enter, Escape)
   - Focus management on open/close

### Property-Based Testing (fast-check)

Property tests verify universal properties across many generated inputs:

```typescript
// Example property test structure
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Chat Widget Properties', () => {
  // Feature: chat-widget-frontend, Property 1: Route Exclusion
  it('should not render on admin/dashboard routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/admin'),
          fc.constant('/admin/cars'),
          fc.constant('/admin/leads'),
          fc.constant('/dashboard'),
          fc.constant('/dashboard/settings')
        ),
        (route) => {
          expect(isChatVisibleOnRoute(route)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: chat-widget-frontend, Property 3: Message Chronological Order
  it('messages should be in chronological order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            role: fc.oneof(fc.constant('user'), fc.constant('assistant')),
            content: fc.string({ minLength: 1, maxLength: 500 }),
            createdAt: fc.date().map((d) => d.toISOString()),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (messages) => {
          const sorted = [...messages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          // Verify render order matches sorted order
          return true; // Implementation would check actual render
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

1. **API Integration**
   - Send message flow (optimistic update → API call → response)
   - Session history loading
   - Error handling and retry

2. **State Management**
   - Zustand store persistence
   - TanStack Query cache behavior
   - localStorage/sessionStorage interactions

### E2E Testing (Playwright)

1. **User Flows**
   - Anonymous user: open chat → send message → receive response → refresh → history loads
   - Authenticated user: sign in → open chat → see sessions → send message
   - Car card: AI mentions car → card renders → click navigates to detail page

2. **Responsive Behavior**
   - Desktop: 400×600 window
   - Mobile: full screen
   - Orientation change

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    // Property tests need more time
    testTimeout: 30000,
    // Coverage thresholds
    coverage: {
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

## File Structure

```
frontend/
├── components/
│   └── chat/
│       ├── ChatWidget.tsx        # Root component with route visibility
│       ├── ChatButton.tsx        # Floating action button
│       ├── ChatWindow.tsx        # Main chat panel
│       ├── ChatHeader.tsx        # Header with controls
│       ├── MessageList.tsx       # Scrollable message container
│       ├── MessageBubble.tsx     # Individual message display
│       ├── MessageInput.tsx      # Text input and send button
│       ├── ChatCarCard.tsx       # Inline car card
│       ├── TypingIndicator.tsx   # Loading dots animation
│       └── MessageSkeleton.tsx   # Loading skeleton
├── hooks/
│   └── use-chat.ts               # TanStack Query hooks
├── lib/
│   ├── api/
│   │   └── chat.ts               # Chat API client functions
│   ├── stores/
│   │   └── chat-store.ts         # Zustand UI state store
│   ├── types/
│   │   └── chat.ts               # TypeScript types
│   └── utils/
│       ├── chat-session.ts       # Session token management
│       ├── chat-visibility.ts    # Route visibility logic
│       └── parse-car-references.ts # Car URL parsing
└── app/
    └── globals.css               # Animation keyframes (additions)
```

## Integration Points

### Layout Integration

The ChatWidget should be added to the root layout, inside the Providers but outside the main content:

```typescript
// frontend/app/layout.tsx
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <ChatWidget /> {/* Add here */}
        </Providers>
      </body>
    </html>
  );
}
```

### Auth Integration

The ChatWidget uses the existing auth pattern:

```typescript
// Check auth state for session management
import { useAuthStore } from '@/lib/stores/auth-store';

const { isAuthenticated, user } = useAuthStore();
```

### Car Data Integration

ChatCarCard uses the existing cars API:

```typescript
import { getCar } from '@/lib/api/cars';
import { useQuery } from '@tanstack/react-query';

// Reuse existing car query pattern
const { data: car, isLoading, error } = useQuery({
  queryKey: ['cars', carId],
  queryFn: () => getCar(carId),
  staleTime: 5 * 60 * 1000,
});
```
