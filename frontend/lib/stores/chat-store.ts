'use client';

// Chat Widget UI State Store
// Manages open/closed state and session tracking with sessionStorage persistence

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
