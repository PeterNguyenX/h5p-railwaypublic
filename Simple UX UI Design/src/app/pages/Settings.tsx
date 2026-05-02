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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-blue-600" : "bg-slate-300"
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-800">Settings</span>
          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">

        {/* Appearance */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Appearance</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Dark Mode</p>
                  <p className="text-xs text-slate-500">Switch to a dark colour theme</p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={setDarkMode} label="Toggle dark mode" />
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Language & Region</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Interface Language</p>
                <p className="text-xs text-slate-500">Choose your preferred display language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Interface language"
              title="Interface language"
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Reset */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Reset</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Reset to Defaults</p>
                <p className="text-xs text-slate-500">Restore all settings to their default values</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDarkMode(false);
                setLanguage("en");
              }}
              className="px-4 py-2 text-sm font-semibold border border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
