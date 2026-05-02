import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useSettingsStore } from "../lib/settingsStore";
import { useAuthStore } from "../lib/authStore";

export default function App() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const applyThemeFromAccount = useSettingsStore((s) => s.applyThemeFromAccount);
  const user = useAuthStore((s) => s.user);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Sync theme from server account whenever user changes (login/logout)
  useEffect(() => {
    if (user?.theme) applyThemeFromAccount(user.theme);
  }, [user?.id, user?.theme, applyThemeFromAccount]);

  return <RouterProvider router={router} />;
}
