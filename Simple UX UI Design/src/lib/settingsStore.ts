import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  darkMode: boolean;
  language: string;
  setDarkMode: (val: boolean) => void;
  setLanguage: (val: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      language: 'en',
      setDarkMode: (val) => set({ darkMode: val }),
      setLanguage: (val) => set({ language: val }),
    }),
    { name: 'app-settings' }
  )
);
