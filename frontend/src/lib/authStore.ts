import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister, verifyEmail as apiVerifyEmail, getCurrentUser } from './api';

export type EducationRole = 'Teacher';

export interface AccountProfile {
  displayName: string;
}

const defaultProfile = (username: string): AccountProfile => ({
  displayName: username,
});

interface AuthState {
  token: string | null;
  user: { id: string; username: string; email: string; role: string; theme?: string } | null;
  profilesByUserId: Record<string, AccountProfile>;
  isLoading: boolean;
  sessionChecked: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<{ pending: true; email: string } | false>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  validateSession: () => Promise<void>;
  getCurrentProfile: () => AccountProfile | null;
  updateCurrentProfile: (patch: Partial<AccountProfile>) => void;
  updateAuthenticatedUser: (patch: Partial<{ username: string; email: string; theme: string }>) => void;
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
      sessionChecked: false,
      error: null,

      login: async (usernameOrEmail, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiLogin(usernameOrEmail, password, rememberMe);
          localStorage.setItem('token', data.token);
          set((state) => ({
            token: data.token,
            user: data.user,
            isLoading: false,
            sessionChecked: true,
            profilesByUserId: {
              ...state.profilesByUserId,
              [data.user.id]: state.profilesByUserId[data.user.id] || defaultProfile(data.user.username),
            },
          }));
          return true;
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
          return false;
        }
      },

      // Returns { pending, email } on success (user must verify then log in), false on error
      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRegister(username, email, password);
          set({ isLoading: false });
          return { pending: data.pending, email: data.email };
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Registration failed', isLoading: false });
          return false;
        }
      },

      verifyEmail: async (email, code) => {
        set({ isLoading: true, error: null });
        try {
          await apiVerifyEmail(email, code);
          set({ isLoading: false });
          return true;
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Verification failed', isLoading: false });
          return false;
        }
      },

      validateSession: async () => {
        const state = useAuthStore.getState();
        if (!state.token) {
          set({ sessionChecked: true });
          return;
        }
        try {
          await getCurrentUser();
          set({ sessionChecked: true });
        } catch {
          localStorage.removeItem('token');
          set({ token: null, user: null, sessionChecked: true });
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
        set((prev) => ({
          profilesByUserId: { ...prev.profilesByUserId, [userId]: { ...existing, ...patch } },
        }));
      },

      updateAuthenticatedUser: (patch) => {
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, ...patch } };
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, sessionChecked: true });
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
