'use client';

// Auth State Store
// Manages authentication state with Cognito integration

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'admin' | 'dealer' | 'user' | null;

export interface AuthUser {
  userId: string;
  email: string;
  groups: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: UserRole;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

/**
 * Determine user role from Cognito groups
 */
function determineRole(groups: string[]): UserRole {
  if (groups.includes('admin')) return 'admin';
  if (groups.includes('dealer')) return 'dealer';
  return 'user';
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      isLoading: true,
      user: null,
      role: null,

      // Actions
      setUser: (user) => {
        if (user) {
          set({
            isAuthenticated: true,
            user,
            role: determineRole(user.groups),
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            role: null,
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      initialize: async () => {
        // Skip on server
        if (typeof window === 'undefined') {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          
          const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
          
          // Check if user is signed in
          const currentUser = await getCurrentUser();
          
          // Get session to extract groups from JWT
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken;
          
          // Extract groups from token payload
          const groups: string[] = [];
          if (idToken) {
            const payload = idToken.payload;
            const cognitoGroups = payload['cognito:groups'];
            if (Array.isArray(cognitoGroups)) {
              groups.push(...cognitoGroups.map(String));
            }
          }

          const user: AuthUser = {
            userId: currentUser.userId,
            email: currentUser.signInDetails?.loginId || '',
            groups,
          };

          set({
            isAuthenticated: true,
            user,
            role: determineRole(groups),
            isLoading: false,
          });
        } catch (error) {
          // User not signed in or error - clear state
          set({
            isAuthenticated: false,
            user: null,
            role: null,
            isLoading: false,
          });
        }
      },

      signOut: async () => {
        try {
          const { signOut } = await import('aws-amplify/auth');
          await signOut();
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          // Always clear state, even if signOut fails
          set({
            isAuthenticated: false,
            user: null,
            role: null,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist minimal state for hydration
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        role: state.role,
      }),
    }
  )
);
