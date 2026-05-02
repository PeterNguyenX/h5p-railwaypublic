import { useNavigate } from "react-router";
import { Moon, Globe, RefreshCw, Home } from "lucide-react";
import { useSettingsStore } from "../../lib/settingsStore";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked ? "true" : "false"}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 ${
        checked ? "bg-[#f5832a]" : "bg-slate-300 dark:bg-[#2e2e2e] dark:border dark:border-white/10"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, language, setLanguage } = useSettingsStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-[#242424] border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-800 dark:text-gray-200">Settings</span>
          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">

        {/* Appearance */}
        <section className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Appearance</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#2e2e2e] flex items-center justify-center">
                  <Moon className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">Dark Mode</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Switch to a dark colour theme</p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={setDarkMode} label="Toggle dark mode" />
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Language & Region</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#2e2e2e] flex items-center justify-center">
                <Globe className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">Interface Language</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Choose your preferred display language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Interface language"
              title="Interface language"
              className="px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#2e2e2e] text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Reset */}
        <section className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Reset</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff0e6] dark:bg-[#f5832a]/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[#f5832a]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">Reset to Defaults</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Restore all settings to their default values</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDarkMode(false);
                setLanguage("en");
              }}
              className="px-4 py-2 text-sm font-semibold bg-[#f5832a] hover:bg-[#e86e15] dark:bg-transparent dark:border dark:border-[#f5832a] dark:hover:border-[#ffa05c] text-white rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
