import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useSettingsStore } from "../lib/settingsStore";

export default function App() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return <RouterProvider router={router} />;
}
