import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister } from './api';

export type EducationRole = 'Teacher';

export interface AccountProfile {
  displayName: string;
}

const defaultProfile = (username: string): AccountProfile => ({
  displayName: username,
});

interface AuthState {
  token: string | null;
  user: { id: string; username: string; email: string; role: string } | null;
  profilesByUserId: Record<string, AccountProfile>;
  isLoading: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  getCurrentProfile: () => AccountProfile | null;
  updateCurrentProfile: (patch: Partial<AccountProfile>) => void;
  updateAuthenticatedUser: (patch: Partial<{ username: string; email: string }>) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profilesByUserId: {},
      isLoading: false,
      error: null,

      login: async (usernameOrEmail, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiLogin(usernameOrEmail, password);
          localStorage.setItem('token', data.token);
          set((state) => ({
            token: data.token,
            user: data.user,
            isLoading: false,
            profilesByUserId: {
              ...state.profilesByUserId,
              [data.user.id]: state.profilesByUserId[data.user.id] || defaultProfile(data.user.username),
            },
          }));
          return true;
        } catch (err: unknown) {
          set({
            error: err instanceof Error ? err.message : 'Login failed',
            isLoading: false,
          });
          return false;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRegister(username, email, password);
          localStorage.setItem('token', data.token);
          set((state) => ({
            token: data.token,
            user: data.user,
            isLoading: false,
            profilesByUserId: {
              ...state.profilesByUserId,
              [data.user.id]: state.profilesByUserId[data.user.id] || defaultProfile(data.user.username),
            },
          }));
          return true;
        } catch (err: unknown) {
          set({
            error: err instanceof Error ? err.message : 'Registration failed',
            isLoading: false,
          });
          return false;
        }
      },

      getCurrentProfile: () => {
        const state = useAuthStore.getState();
        if (!state.user) return null;
        return state.profilesByUserId[state.user.id] || defaultProfile(state.user.username);
      },

      updateCurrentProfile: (patch) => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        const userId = state.user.id;
        const existing = state.profilesByUserId[userId] || defaultProfile(state.user.username);
        const next = {
          ...existing,
          ...patch,
        };

        set((prev) => ({
          profilesByUserId: {
            ...prev.profilesByUserId,
            [userId]: next,
          },
        }));
      },

      updateAuthenticatedUser: (patch) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              ...patch,
            },
          };
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ai-activedu-auth',
      partialState: (state) => ({
        token: state.token,
        user: state.user,
        profilesByUserId: state.profilesByUserId,
      }),
    } as Parameters<typeof persist>[1],
  ),
);
