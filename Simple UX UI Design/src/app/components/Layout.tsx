import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Shield, Video, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout, getCurrentProfile } = useAuthStore();
  const profile = getCurrentProfile();
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close menu when clicking outside
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left — logo */}
            <div className="flex items-center gap-3">
              <Link
                to="/app/dashboard"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={(e) => { e.preventDefault(); window.location.href = '/app/dashboard'; }}
              >
                <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-tight">AI-ActivEdu</h1>
              </Link>
            </div>

            {/* Right — admin console + profile dropdown */}
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Link
                  to="/app/admin"
                  className="flex items-center gap-1.5 h-9 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:text-blue-700 hover:bg-slate-50 transition-colors"
                  title="Admin console"
                >
                  <Shield className="w-4 h-4" />
                  Admin Console
                </Link>
              )}

              {/* Profile dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="hidden sm:flex items-center gap-2 h-9 px-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
                  title="Account"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                    {initials}
                  </div>
                  {displayName}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate("/app/account"); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
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
