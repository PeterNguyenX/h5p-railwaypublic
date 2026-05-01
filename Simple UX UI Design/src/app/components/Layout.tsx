import { Link, Outlet, useNavigate } from "react-router";
import { Shield, LogOut, Video } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout, getCurrentProfile } = useAuthStore();
  const profile = getCurrentProfile();

  const displayName = profile?.displayName || user?.username || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left — logo + home */}
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

            {/* Right — profile, admin, logout */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/app/account")}
                className="hidden sm:flex items-center gap-2 h-9 px-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
                title="Account settings"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                  {initials}
                </div>
                {displayName}
              </button>

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

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 h-9 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
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
