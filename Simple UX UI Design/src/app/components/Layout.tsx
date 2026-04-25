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
            <div className="flex items-center">
              <Link to="/app/dashboard" className="flex items-center gap-2">
                <div className="bg-sky-600 p-2 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <span className="text-xl font-bold text-slate-800 tracking-tight block">ReactivEdu</span>
                  <span className="text-[11px] text-slate-400 block">A VNU AI project</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/app/account")}
                className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 cursor-pointer hover:bg-slate-50 rounded-md px-3 py-2 -ml-2 transition-colors"
                title="Account settings"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-700 leading-none">{displayName}</span>
                </div>
              </button>
              {user?.role === "admin" && (
                <Link
                  to="/app/admin"
                  className="text-slate-500 hover:text-blue-700 transition-colors p-2 rounded-md hover:bg-slate-100"
                  title="Admin console"
                >
                  <Shield className="w-5 h-5" />
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-slate-100"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
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
