import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, LogIn, Sparkles, BookOpen, Video, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await login(username, password, rememberMe);
    if (ok) navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#1a1a1a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[980px] flex overflow-hidden bg-white dark:bg-[#242424] shadow-2xl rounded-3xl border border-[#2563a8]/10 dark:border-white/10 animate-fade-in">

        {/* Left panel — Navy brand */}
        <div className="hidden lg:flex w-5/12 bg-[#2563a8] p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#f5832a]/10 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

          <div className="z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#f5832a] p-2.5 rounded-xl shadow-lg shadow-[#f5832a]/30">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">AI-ActivEdu</span>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight text-white">
              Interactive learning,<br />simplified.
            </h1>
            <p className="text-white/80 text-base leading-relaxed mb-10">
              Create and share engaging video lessons. Built specially for educators.
            </p>

            <ul className="space-y-5">
              {(
                [
                  { icon: Sparkles, text: "AI-powered interaction suggestions", cls: "animation-delay-0" },
                  { icon: BookOpen, text: "Seamless classroom integration", cls: "animation-delay-80" },
                  { icon: Video, text: "Upload or use YouTube videos", cls: "animation-delay-160" },
                ] as const
              ).map((item) => (
                <li key={item.text} className={`flex items-center gap-4 text-white/90 animate-slide-in ${item.cls}`}>
                  <div className="bg-white/10 border border-white/20 p-2 rounded-lg shrink-0">
                    <item.icon className="w-4 h-4 text-[#f5832a]" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="z-10 text-xs text-white/50 flex justify-between font-medium tracking-wide">
            <span>For Teachers</span>
            <span>AI-ActivEdu © 2025</span>
          </div>
        </div>

        {/* Right panel — Login form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-14 flex flex-col justify-center bg-white dark:bg-[#242424]">
          <div className="max-w-md w-full mx-auto">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="bg-[#f5832a] p-2.5 rounded-xl shadow-lg shadow-[#f5832a]/30">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#2563a8] dark:text-white tracking-tight">AI-ActivEdu</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#2563a8] dark:text-white tracking-tight mb-1">Welcome back</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm">Sign in to your teacher account to continue.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username/Email */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#2563a8] dark:text-gray-300 ml-1">Username or Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                    placeholder="username or email@school.edu"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#2563a8] dark:text-gray-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#f5832a] transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password row */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${rememberMe ? 'bg-[#f5832a] border-[#f5832a]' : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#2e2e2e]'}`}>
                      {rememberMe && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] text-slate-600 dark:text-gray-400 group-hover:text-[#2563a8] dark:group-hover:text-gray-200 transition-colors duration-200">
                    Remember me for 30 days
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-semibold text-[#f5832a] hover:text-[#e86e15] transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#f5832a]/20"
                >
                  {isLoading ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4.5 h-4.5" />
                  )}
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-gray-300/50">
              Need an account?{" "}
              <Link to="/register" className="font-semibold text-[#2563a8] dark:text-[#f5832a] hover:text-[#f5832a] dark:hover:text-[#ffa05c] transition-colors duration-200">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
