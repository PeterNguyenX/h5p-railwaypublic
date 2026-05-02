import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveUserPreferences } from './api';

interface SettingsState {
  darkMode: boolean;
  language: string;
  setDarkMode: (val: boolean) => void;
  setLanguage: (val: string) => void;
  applyThemeFromAccount: (theme: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      language: 'en',

      setDarkMode: (val) => {
        set({ darkMode: val });
        // Persist to server account (fire-and-forget, token read from localStorage)
        saveUserPreferences(val ? 'dark' : 'light').catch(() => {});
      },

      setLanguage: (val) => set({ language: val }),

      // Called after login to apply the theme stored in the user's account
      applyThemeFromAccount: (theme) => {
        set({ darkMode: theme === 'dark' });
      },
    }),
    { name: 'app-settings' }
  )
);
