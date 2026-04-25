import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Video, Mail, Lock, LogIn, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await login(username, password);
    if (ok) navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] flex overflow-hidden bg-white shadow-xl rounded-2xl border border-slate-200">
        
        {/* Left column */}
        <div className="hidden lg:flex w-5/12 bg-blue-900 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
                <Video className="w-6 h-6 text-sky-600" />
              </div>
              <span className="text-2xl font-bold tracking-tight">ReactivEdu</span>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">Interactive learning, simplified.</h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-10 opacity-90">
              Create and share engaging video lessons with your students. Built specially for educators.
            </p>

            <ul className="space-y-6">
              {[
                { icon: Sparkles, text: "AI-powered interaction suggestions" },
                { icon: BookOpen, text: "Seamless classroom integration" },
                { icon: Video, text: "Upload or use YouTube videos" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-blue-50">
                  <div className="bg-blue-800 p-2 rounded-lg shrink-0 border border-blue-700">
                    <item.icon className="w-5 h-5 text-blue-200" />
                  </div>
                  <span className="font-medium text-[15px]">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="z-10 mt-12 text-sm text-blue-300 font-medium tracking-wide flex justify-between">
            <span>For Teachers</span>
            <span>ReactivEdu</span>
          </div>
        </div>

        {/* Right column - Login Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-14 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="bg-sky-600 p-2.5 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">ReactivEdu</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
              <p className="text-slate-500 text-[15px]">Sign in to your teacher account to continue.</p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[14px] font-semibold text-slate-700 ml-1">Username or Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all text-[15px]"
                    placeholder="e.g. admin or teacher@school.edu"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[14px] font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all text-[15px]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-[13px] font-semibold text-blue-700 hover:text-blue-900">
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-[15px] font-bold text-white bg-orange-500 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {isLoading ? "Signing in..." : "Sign In to Dashboard"}
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-sm text-slate-600">
              Need an account?{" "}
              <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-900">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
