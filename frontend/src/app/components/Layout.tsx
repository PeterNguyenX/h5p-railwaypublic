import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Shield, Video, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { useT } from "../../lib/useT";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout, getCurrentProfile } = useAuthStore();
  const profile = getCurrentProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.displayName || user?.username || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] flex flex-col font-sans text-slate-800 dark:text-gray-200 transition-colors duration-200">
      <header className="bg-white dark:bg-[#242424] border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left — logo */}
            <div className="flex items-center gap-3">
              <Link
                to="/app/dashboard"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                onClick={(e) => { e.preventDefault(); window.location.href = '/app/dashboard'; }}
              >
                <div className="bg-[#2563a8] p-2 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col leading-none">
                  <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">AI-ActivEdu</h1>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500">A VNU-AI project</p>
                </div>
              </Link>
            </div>

            {/* Right — admin console + profile dropdown */}
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Link
                  to="/app/admin"
                  className="flex items-center gap-1.5 h-9 px-3 border border-[#2563a8]/30 dark:border-[#2563a8] rounded-xl text-sm font-semibold text-[#2563a8] dark:text-gray-300 hover:bg-[#2563a8] hover:text-white dark:hover:bg-transparent dark:hover:border-[#3d6ba6] transition-colors"
                  title={t("nav.adminConsole", "Admin Console")}
                >
                  <Shield className="w-4 h-4" />
                  {t("nav.adminConsole", "Admin Console")}
                </Link>
              )}

              {/* Profile dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="hidden sm:flex items-center gap-2 h-9 px-3 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm font-semibold text-slate-700 dark:text-gray-300"
                  title="Account"
                >
                  <div className="w-5 h-5 rounded-full bg-[#2563a8] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {initials}
                  </div>
                  {displayName}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg py-1 z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate("/app/account"); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                      {t("nav.profile", "Profile")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                      {t("settings.title", "Settings")}
                    </button>
                    <div className="border-t border-slate-100 dark:border-white/10 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-[#f5832a] hover:bg-[#f5832a]/10 dark:hover:bg-[#f5832a]/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("nav.logout", "Log out")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
