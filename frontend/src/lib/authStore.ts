import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister } from './api';

export type EducationRole = 'Teacher';

export interface AccountProfile {
  displayName: string;
  educationRole: EducationRole;
  subject: string;
}

const defaultProfile = (username: string, isAdmin = false): AccountProfile =>
  isAdmin
    ? { displayName: 'ADMIN', educationRole: 'Teacher', subject: '' }
    : { displayName: username, educationRole: 'Teacher', subject: '' };

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
  persist<AuthState>(
    (set, get) => ({
      token: null,
      user: null,
      profilesByUserId: {},
      isLoading: false,
      error: null,

      login: async (usernameOrEmail, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiLogin(usernameOrEmail, password);
          const isAdmin = data.user.role === 'admin';
          localStorage.setItem('token', data.token);
          set((state) => ({
            token: data.token,
            user: data.user,
            isLoading: false,
            profilesByUserId: {
              ...state.profilesByUserId,
              [data.user.id]: state.profilesByUserId[data.user.id] || defaultProfile(data.user.username, isAdmin),
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
          const isAdmin = data.user.role === 'admin';
          localStorage.setItem('token', data.token);
          set((state) => ({
            token: data.token,
            user: data.user,
            isLoading: false,
            profilesByUserId: {
              ...state.profilesByUserId,
              [data.user.id]: state.profilesByUserId[data.user.id] || defaultProfile(data.user.username, isAdmin),
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
        const state = get();
        if (!state.user) return null;
        return state.profilesByUserId[state.user.id] || defaultProfile(state.user.username, state.user.role === 'admin');
      },

      updateCurrentProfile: (patch) => {
        const state = get();
        if (!state.user) return;

        const userId = state.user.id;
        const existing = state.profilesByUserId[userId] || defaultProfile(state.user.username, state.user.role === 'admin');
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
    },
  ),
);
