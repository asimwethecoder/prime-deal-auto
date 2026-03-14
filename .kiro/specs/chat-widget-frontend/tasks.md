# Implementation Plan: AI Chat Widget Frontend

## Overview

This plan implements the AI Chat Widget Frontend for Prime Deal Auto. The widget provides a floating conversational interface that integrates with the existing backend chat API. Implementation follows a dependency-ordered approach: types/utilities first, then state management, then components from leaf to root.

## Tasks

- [x] 1. Set up foundation types and utilities
  - [x] 1.1 Create chat TypeScript types
    - Create `frontend/lib/types/chat.ts` with MessageRole, MessageStatus, ChatMessageDisplay, SendMessageRequest, SendMessageResponse, ChatSessionSummary, ChatSessionDetail, CarReference interfaces
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 9.1_

  - [x] 1.2 Create session token management utility
    - Create `frontend/lib/utils/chat-session.ts` with getStoredSessionToken, getStoredSessionId, storeSessionCredentials, clearSessionCredentials, hasStoredSession functions
    - Use localStorage for anonymous session persistence
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.3 Create route visibility utility
    - Create `frontend/lib/utils/chat-visibility.ts` with isChatVisibleOnRoute function
    - Exclude routes starting with /admin or /dashboard
    - _Requirements: 1.2, 1.3_

  - [x] 1.4 Create car reference parsing utility
    - Create `frontend/lib/utils/parse-car-references.ts` with parseCarReferences and splitMessageContent functions
    - Parse URLs matching https://primedealauto.co.za/cars/{uuid}
    - _Requirements: 9.1, 9.2_

  - [ ]* 1.5 Write unit tests for utilities
    - Test session token storage/retrieval
    - Test route visibility logic for all route patterns
    - Test car URL parsing with various inputs
    - _Requirements: 1.2, 1.3, 5.1, 9.1_

  - [ ]* 1.6 Write property test for route exclusion
    - **Property 1: Route Exclusion**
    - **Validates: Requirements 1.2**

- [x] 2. Implement API client and state management
  - [x] 2.1 Update chat API client
    - Update `frontend/lib/api/chat.ts` to match design interfaces
    - Add sessionToken query param support for anonymous users in getChatSession
    - Ensure types align with backend API responses
    - _Requirements: 5.2, 5.3, 6.1_

  - [x] 2.2 Create Zustand chat store
    - Create `frontend/lib/stores/chat-store.ts` with isOpen, sessionId, draftMessage state
    - Implement toggle, open, close, setSessionId, setDraftMessage, clearDraft actions
    - Use sessionStorage persistence for isOpen and sessionId (not draftMessage)
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 2.3 Create TanStack Query hooks
    - Create `frontend/hooks/use-chat.ts` with useSendMessage, useChatHistory, useChatSessions hooks
    - Implement optimistic updates for message sending
    - Configure 5-minute staleTime for history queries
    - _Requirements: 5.3, 6.1, 6.2, 7.1, 8.1, 13.4_

  - [ ]* 2.4 Write property test for TanStack Query stale time
    - **Property 30: TanStack Query Stale Time**
    - **Validates: Requirements 13.4**

- [ ] 3. Checkpoint - Foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement leaf components (no dependencies)
  - [x] 4.1 Create TypingIndicator component
    - Create `frontend/components/chat/TypingIndicator.tsx` with three animated dots
    - Style as assistant message bubble (left-aligned, gray background)
    - Implement staggered bounce animation
    - Respect prefers-reduced-motion
    - _Requirements: 7.1, 7.2, 7.3, 12.4, 12.5_

  - [x] 4.2 Create MessageSkeleton component
    - Create `frontend/components/chat/MessageSkeleton.tsx` with 3-5 placeholder bubbles
    - Implement shimmer animation with alternating alignment
    - Respect prefers-reduced-motion
    - _Requirements: 7.4, 7.5, 12.4_

  - [x] 4.3 Create MessageInput component
    - Create `frontend/components/chat/MessageInput.tsx` with textarea and send button
    - Implement Enter to submit, Shift+Enter for newline
    - Add 2000 character limit with count display when >1800 chars
    - Disable send button when empty or loading
    - Show loading spinner on send button during submission
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 4.4 Write property tests for MessageInput
    - **Property 8: Empty Input Disables Send**
    - **Property 10: Character Limit Enforcement**
    - **Property 11: Character Count Visibility**
    - **Validates: Requirements 4.3, 4.8, 4.9**

  - [x] 4.5 Create ChatHeader component
    - Create `frontend/components/chat/ChatHeader.tsx` with title, new conversation button, close button
    - Title "Chat with us" with id="chat-header-title" for aria-labelledby
    - _Requirements: 2.4, 5.5, 6.5_

  - [x] 4.6 Create ChatButton component
    - Create `frontend/components/chat/ChatButton.tsx` as 60px circular button
    - Position fixed bottom-right with 24px margin, z-index 50
    - Use secondary color (#405FF2) background with white icon
    - Toggle between MessageCircle and X icons based on isOpen
    - Implement hover scale(1.05) transition
    - Add aria-label "Open chat" / "Close chat"
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 10.1_

  - [ ]* 4.7 Write property test for ChatButton ARIA labels
    - **Property 25: ARIA Label Toggle**
    - **Validates: Requirements 10.1**

  - [ ]* 4.8 Write property test for toggle state consistency
    - **Property 2: Toggle State Consistency**
    - **Validates: Requirements 1.6**

- [x] 5. Implement message display components
  - [x] 5.1 Create ChatCarCard component
    - Create `frontend/components/chat/ChatCarCard.tsx` with max-width 280px
    - Display primary image, make, model, year, price (ZAR), mileage
    - Use existing getCar API with TanStack Query caching
    - Show loading skeleton while fetching
    - Show fallback link on error
    - Navigate to /cars/{carId} on click
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 5.2 Write property tests for ChatCarCard
    - **Property 23: Car Card Caching**
    - **Property 24: Car Card Fallback**
    - **Validates: Requirements 9.3, 9.6**

  - [x] 5.3 Create MessageBubble component
    - Create `frontend/components/chat/MessageBubble.tsx` with role-based styling
    - User messages: right-aligned, #405FF2 bg, white text, bottom-right corner squared
    - Assistant messages: left-aligned, #F9FBFC bg, #050B20 text, bottom-left corner squared
    - Max-width 85%, 16px border-radius
    - Display timestamp in 12px font below content
    - Support markdown (bold, italic, links) for assistant messages
    - Render ChatCarCard for detected car URLs using splitMessageContent
    - Show error state with Retry button for failed messages
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 8.1, 8.5, 9.1_

  - [ ]* 5.4 Write property tests for MessageBubble styling
    - **Property 4: User Message Styling**
    - **Property 5: Assistant Message Styling**
    - **Property 7: Markdown Rendering**
    - **Property 22: Car URL Detection**
    - **Validates: Requirements 3.2, 3.3, 3.8, 9.1**

- [ ] 6. Checkpoint - Components ready for composition
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement container components
  - [x] 7.1 Create MessageList component
    - Create `frontend/components/chat/MessageList.tsx` as scrollable container
    - Display messages in chronological order (oldest first)
    - Auto-scroll to bottom on new messages
    - Show MessageSkeleton when loading history
    - Show TypingIndicator when waiting for response
    - Show error state with Retry button when history load fails
    - Add role="log" and aria-live="polite" for accessibility
    - _Requirements: 3.1, 3.7, 7.1, 7.4, 8.4, 8.6, 10.5_

  - [ ]* 7.2 Write property tests for MessageList
    - **Property 3: Message Chronological Order**
    - **Property 6: Auto-Scroll on New Message**
    - **Property 18: Typing Indicator During Request**
    - **Property 19: Loading Skeleton on History Fetch**
    - **Validates: Requirements 3.1, 3.7, 7.1, 7.4**

  - [x] 7.3 Create ChatWindow component
    - Create `frontend/components/chat/ChatWindow.tsx` as main chat panel
    - Desktop: 400px width, 600px max-height, 16px border-radius, box-shadow
    - Mobile (<640px): full screen, 0 border-radius
    - Compose ChatHeader, MessageList, MessageInput
    - Add role="dialog" and aria-labelledby="chat-header-title"
    - Implement slide-up + fade-in animation (200ms)
    - Handle session management (anonymous vs authenticated)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 10.2, 12.1_

  - [ ]* 7.4 Write property tests for ChatWindow
    - **Property 26: Focus Management Open**
    - **Validates: Requirements 10.3**

- [x] 8. Implement root ChatWidget and animations
  - [x] 8.1 Add CSS animations to globals.css
    - Add chat-slide-up, chat-slide-down keyframes
    - Add message-fade-in keyframe
    - Add typing-bounce keyframe with staggered delays
    - Add shimmer keyframe
    - Add animation utility classes
    - Add prefers-reduced-motion media query overrides
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 8.2 Write property test for reduced motion
    - **Property 28: Reduced Motion Respect**
    - **Validates: Requirements 12.4**

  - [x] 8.3 Create ChatWidget root component
    - Create `frontend/components/chat/ChatWidget.tsx` as root component
    - Use usePathname() to check route visibility
    - Render ChatButton always (on visible routes)
    - Conditionally render ChatWindow when open
    - Use dynamic import for ChatWindow to reduce bundle size
    - Manage session state (load from localStorage for anonymous, fetch for authenticated)
    - Handle new conversation creation
    - _Requirements: 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.4 Write property tests for ChatWidget
    - **Property 12: Session Token Storage (Anonymous)**
    - **Property 13: Session Token Inclusion**
    - **Property 14: History Load on Open**
    - **Property 15: Authenticated Session Fetch**
    - **Property 16: Most Recent Session Load**
    - **Property 17: No LocalStorage for Authenticated**
    - **Property 29: State Persistence Across Navigation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 6.4, 13.1, 13.2**

- [x] 9. Implement error handling and accessibility
  - [x] 9.1 Implement error handling in components
    - Add network error handling with Retry button in MessageBubble
    - Add rate limit error message (429) display
    - Add server error message (5xx) display
    - Style error messages with warning colors inline in MessageList
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 9.2 Write property tests for error handling
    - **Property 20: Network Error Retry**
    - **Property 21: Server Error Message**
    - **Validates: Requirements 8.1, 8.3, 8.5**

  - [x] 9.3 Implement focus management
    - Move focus to MessageInput when ChatWindow opens
    - Return focus to ChatButton when ChatWindow closes
    - Add Escape key handler to close window
    - Ensure all interactive elements have visible focus indicators
    - _Requirements: 10.3, 10.4, 10.6, 10.7_

  - [ ]* 9.4 Write property test for focus management close
    - **Property 27: Focus Management Close**
    - **Validates: Requirements 10.4**

- [ ] 10. Checkpoint - Widget feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration and responsive design
  - [x] 11.1 Add ChatWidget to root layout
    - Update `frontend/app/layout.tsx` to include ChatWidget
    - Place inside Providers, after Footer
    - _Requirements: 1.2, 1.3_

  - [x] 11.2 Implement responsive behavior
    - Ensure mobile full-screen layout works correctly
    - Handle safe area insets for devices with notches
    - Ensure MessageInput stays visible above mobile keyboard
    - Test orientation changes preserve state
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 11.3 Write property test for input cleared after send
    - **Property 9: Input Cleared After Send**
    - **Validates: Requirements 4.7**

- [ ] 12. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `frontend/lib/api/chat.ts` will be updated rather than replaced
- Components use Lucide React icons (MessageCircle, X, Send, RefreshCw)
- All components are client components ('use client') due to interactivity requirements
