import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useSettingsStore } from "../lib/settingsStore";
import { useAuthStore } from "../lib/authStore";
import i18n from "../../../context/i18n";

function hasLocalThemePreference(): boolean {
  try {
    const raw = localStorage.getItem("app-settings");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { darkMode?: unknown } };
    return typeof parsed?.state?.darkMode === "boolean";
  } catch {
    return false;
  }
}

export default function App() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const language = useSettingsStore((s) => s.language);
  const applyThemeFromAccount = useSettingsStore((s) => s.applyThemeFromAccount);
  const user = useAuthStore((s) => s.user);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    i18n.changeLanguage(language).catch(() => undefined);
  }, [language]);

  // Sync theme from server account whenever user changes (login/logout)
  useEffect(() => {
    if (!user?.theme) return;
    if (hasLocalThemePreference()) return;
    applyThemeFromAccount(user.theme);
  }, [user?.id, user?.theme, applyThemeFromAccount]);

  return <RouterProvider router={router} />;
}
