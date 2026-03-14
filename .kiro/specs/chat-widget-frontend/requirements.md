# Requirements Document

## Introduction

The AI Chat Widget Frontend provides a conversational interface for users to interact with Prime Deal Auto's AI-powered car sales assistant. The widget integrates with the existing backend chat API (POST /chat, GET /chat/sessions, etc.) to enable natural language car discovery. Users can ask questions about inventory, get recommendations, and receive deep links to specific vehicles—all through a floating chat interface that works seamlessly on both desktop and mobile devices.

The backend is already complete (see `.kiro/specs/ai-chat-assistant/`). This spec covers the frontend React components, state management, and user experience.

## Glossary

- **Chat_Widget**: The complete chat interface including the floating button, chat window, message list, and input area
- **Chat_Button**: The floating circular button in the bottom-right corner that opens the chat window
- **Chat_Window**: The expanded panel containing the conversation interface
- **Message_Bubble**: A single message display component showing either user or assistant content
- **Message_Input**: The text input field and send button for composing messages
- **Session_Token**: A UUID stored in localStorage that identifies anonymous chat sessions
- **Car_Card**: An inline card component displaying car details when the AI mentions specific vehicles
- **Typing_Indicator**: An animated indicator showing the AI is processing a response
- **Message_List**: The scrollable container displaying all messages in the conversation

## Requirements

### Requirement 1: Floating Chat Button

**User Story:** As a user, I want to see a floating chat button on public pages, so that I can easily access the AI assistant while browsing the site.

#### Acceptance Criteria

1. THE Chat_Button SHALL render as a circular button (60px diameter) fixed to the bottom-right corner of the viewport with 24px margin from edges
2. THE Chat_Widget SHALL NOT render on admin or dashboard pages (routes starting with /admin or /dashboard)
3. THE Chat_Widget SHALL render on all public pages: home, cars, car detail, about, contact, search, signin, signup
4. THE Chat_Button SHALL display a chat/message icon when the chat is closed
5. THE Chat_Button SHALL display a close/X icon when the chat is open
6. WHEN the user clicks the Chat_Button, THE Chat_Widget SHALL toggle between open and closed states
7. THE Chat_Button SHALL have a z-index of 50 to appear above page content but below modals
8. THE Chat_Button SHALL use the secondary color (#405FF2) as background with white icon
9. WHEN the user hovers over the Chat_Button, THE Chat_Button SHALL scale to 1.05 with a smooth transition

### Requirement 2: Chat Window Layout

**User Story:** As a user, I want a well-organized chat window, so that I can easily read and send messages.

#### Acceptance Criteria

1. THE Chat_Window SHALL render as a fixed panel positioned above the Chat_Button
2. ON desktop viewports (width >= 640px), THE Chat_Window SHALL have dimensions of 400px width and 600px max-height
3. ON mobile viewports (width < 640px), THE Chat_Window SHALL expand to full screen with safe area insets
4. THE Chat_Window SHALL contain a header with title "Chat with us" and a close button
5. THE Chat_Window SHALL contain a Message_List area that fills available space and scrolls vertically
6. THE Chat_Window SHALL contain a Message_Input area fixed at the bottom
7. THE Chat_Window SHALL have border-radius of 16px on desktop and 0 on mobile
8. THE Chat_Window SHALL have a box-shadow of 0px 6px 24px rgba(0, 0, 0, 0.1) on desktop
9. WHEN the Chat_Window opens, THE Chat_Window SHALL animate in with a slide-up and fade-in effect

### Requirement 3: Message Display

**User Story:** As a user, I want to see messages clearly distinguished by sender, so that I can follow the conversation easily.

#### Acceptance Criteria

1. THE Message_List SHALL display messages in chronological order (oldest at top)
2. FOR user messages, THE Message_Bubble SHALL align to the right with secondary color (#405FF2) background and white text
3. FOR assistant messages, THE Message_Bubble SHALL align to the left with light gray (#F9FBFC) background and primary color (#050B20) text
4. THE Message_Bubble SHALL have border-radius of 16px with the sender's corner squared (bottom-right for user, bottom-left for assistant)
5. THE Message_Bubble SHALL display the message timestamp below the content in a smaller font (12px)
6. THE Message_Bubble SHALL have max-width of 85% of the Message_List width
7. WHEN a new message is added, THE Message_List SHALL auto-scroll to show the latest message
8. THE Message_Bubble SHALL support markdown-style formatting for bold, italic, and links in assistant messages

### Requirement 4: Message Input

**User Story:** As a user, I want to easily compose and send messages, so that I can communicate with the AI assistant.

#### Acceptance Criteria

1. THE Message_Input SHALL contain a text input field with placeholder "Type your message..."
2. THE Message_Input SHALL contain a send button with an arrow icon
3. WHEN the input is empty, THE send button SHALL be disabled with reduced opacity
4. WHEN the user presses Enter (without Shift), THE Message_Input SHALL submit the message
5. WHEN the user presses Shift+Enter, THE Message_Input SHALL insert a newline
6. WHEN a message is being sent, THE send button SHALL show a loading spinner and be disabled
7. AFTER a message is sent successfully, THE Message_Input SHALL clear the text field
8. THE Message_Input SHALL have a max character limit of 2000 characters
9. WHEN the character limit is approached (>1800), THE Message_Input SHALL display a character count

### Requirement 5: Session Management for Anonymous Users

**User Story:** As an anonymous user, I want my chat history to persist across page refreshes, so that I don't lose my conversation.

#### Acceptance Criteria

1. WHEN an anonymous user sends their first message, THE Chat_Widget SHALL store the returned sessionToken in localStorage under key "chat_session_token"
2. FOR subsequent messages, THE Chat_Widget SHALL include the stored sessionToken in the request
3. WHEN the Chat_Window opens with an existing sessionToken, THE Chat_Widget SHALL load the conversation history from the API
4. IF the sessionToken is invalid or expired, THE Chat_Widget SHALL clear localStorage and start a new session
5. THE Chat_Widget SHALL display a "New conversation" button in the header to allow starting fresh

### Requirement 6: Session Management for Authenticated Users

**User Story:** As an authenticated user, I want my chat sessions linked to my account, so that I can access them from any device.

#### Acceptance Criteria

1. WHEN an authenticated user opens the Chat_Widget, THE Chat_Widget SHALL fetch their session list from GET /chat/sessions
2. IF the user has existing sessions, THE Chat_Widget SHALL load the most recent session's messages
3. WHEN an authenticated user with an anonymous sessionToken signs in, THE Chat_Widget SHALL continue using that session (backend links it to their account)
4. THE Chat_Widget SHALL not store sessionToken in localStorage for authenticated users (session is linked to JWT)
5. WHEN an authenticated user clicks "New conversation", THE Chat_Widget SHALL create a new session

### Requirement 7: Loading and Typing States

**User Story:** As a user, I want visual feedback while waiting for responses, so that I know the system is working.

#### Acceptance Criteria

1. WHEN waiting for an AI response, THE Chat_Widget SHALL display a Typing_Indicator in the Message_List
2. THE Typing_Indicator SHALL show three animated dots with a pulsing animation
3. THE Typing_Indicator SHALL appear as an assistant message bubble aligned to the left
4. WHEN the Chat_Window first opens with an existing session, THE Chat_Widget SHALL show a loading skeleton while fetching history
5. THE loading skeleton SHALL display 3-5 placeholder message bubbles with shimmer animation

### Requirement 8: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know what happened and what to do.

#### Acceptance Criteria

1. IF a message fails to send due to network error, THE Chat_Widget SHALL display an error message with a "Retry" button
2. IF the API returns a rate limit error (429), THE Chat_Widget SHALL display "You're sending messages too quickly. Please wait a moment."
3. IF the API returns a server error (5xx), THE Chat_Widget SHALL display "Something went wrong. Please try again."
4. THE error message SHALL appear inline in the Message_List as a system message with warning styling
5. WHEN the user clicks "Retry", THE Chat_Widget SHALL resend the failed message
6. IF loading conversation history fails, THE Chat_Widget SHALL display an error state with a "Retry" button

### Requirement 9: Car Card Display

**User Story:** As a user, I want to see car details inline when the AI mentions specific vehicles, so that I can quickly view and navigate to them.

#### Acceptance Criteria

1. WHEN the assistant message contains a car deep link (https://primedealauto.co.za/cars/{carId}), THE Chat_Widget SHALL render a Car_Card inline
2. THE Car_Card SHALL display the car's primary image, make, model, year, price, and mileage
3. THE Car_Card SHALL fetch car details from GET /cars/{carId} if not already cached
4. WHEN the user clicks a Car_Card, THE Chat_Widget SHALL navigate to the car detail page
5. THE Car_Card SHALL have a compact design (max-width 280px) that fits within the message flow
6. IF the car data fails to load, THE Car_Card SHALL display a fallback link with the car URL
7. THE Car_Card SHALL show a loading skeleton while fetching car details

### Requirement 10: Accessibility

**User Story:** As a user with accessibility needs, I want the chat widget to be fully accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. THE Chat_Button SHALL have aria-label "Open chat" when closed and "Close chat" when open
2. THE Chat_Window SHALL have role="dialog" and aria-labelledby pointing to the header title
3. WHEN the Chat_Window opens, THE focus SHALL move to the Message_Input field
4. WHEN the Chat_Window closes, THE focus SHALL return to the Chat_Button
5. THE Message_List SHALL have role="log" and aria-live="polite" for screen reader announcements
6. ALL interactive elements SHALL be keyboard navigable with visible focus indicators
7. THE Chat_Widget SHALL support Escape key to close the window

### Requirement 11: Responsive Design

**User Story:** As a mobile user, I want the chat widget to work well on my device, so that I can chat comfortably on any screen size.

#### Acceptance Criteria

1. ON mobile viewports, THE Chat_Window SHALL occupy the full screen when open
2. ON mobile viewports, THE Chat_Button SHALL be positioned with safe area insets for devices with notches
3. THE Message_Input SHALL remain visible above the mobile keyboard when focused
4. THE Chat_Widget SHALL handle orientation changes gracefully without losing state
5. ON tablet viewports (640px-1024px), THE Chat_Window SHALL use desktop dimensions but remain responsive

### Requirement 12: Animation and Transitions

**User Story:** As a user, I want smooth animations, so that the chat experience feels polished and responsive.

#### Acceptance Criteria

1. THE Chat_Window open/close animation SHALL complete within 200ms
2. THE Message_Bubble SHALL animate in with a subtle fade and slide effect when added
3. THE Chat_Button icon transition SHALL animate smoothly when toggling states
4. ALL animations SHALL respect the user's prefers-reduced-motion setting
5. THE Typing_Indicator dots SHALL animate with a staggered bounce effect

### Requirement 13: State Persistence

**User Story:** As a user, I want the chat state to persist appropriately, so that I don't lose context when navigating.

#### Acceptance Criteria

1. THE Chat_Widget open/closed state SHALL persist in sessionStorage during the browser session
2. WHEN navigating between pages, THE Chat_Widget SHALL maintain its open/closed state
3. THE Message_Input draft text SHALL persist in component state during navigation (not across page refresh)
4. THE Chat_Widget SHALL use TanStack Query for caching conversation history with 5-minute stale time
