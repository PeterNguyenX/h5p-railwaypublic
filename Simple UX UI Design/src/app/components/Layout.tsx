import { Link, Outlet, useLocation } from "react-router";
import { BookOpen, Home, Settings, LogOut, Video } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: "My Videos", path: "/app/dashboard", icon: Home },
    { name: "Library", path: "/app/dashboard", icon: BookOpen },
    { name: "Settings", path: "/app/dashboard", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo area */}
            <div className="flex items-center">
              <Link to="/app/dashboard" className="flex items-center gap-2">
                <div className="bg-blue-800 p-2 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800 tracking-tight">TeachPlay</span>
              </Link>
              
              {/* Desktop Nav */}
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-blue-700 text-blue-800"
                          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      } h-16`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side area */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                  JD
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 leading-none">Jane Doe</span>
                  <span className="text-xs text-slate-500">Science Teacher</span>
                </div>
              </div>
              <Link 
                to="/" 
                className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-slate-100"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
