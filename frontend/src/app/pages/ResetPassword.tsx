import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Video, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Request a new link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#1a1a1a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#242424] shadow-2xl rounded-3xl border border-[#1e3a5f]/10 dark:border-white/10 overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-[#1e3a5f] px-8 py-6 flex items-center gap-3">
          <div className="bg-[#f5832a] p-2 rounded-xl shadow-lg shadow-[#f5832a]/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AI-ActivEdu</span>
        </div>

        <div className="p-8 sm:p-10">
          {done ? (
            <div className="text-center animate-bounce-in">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1e3a5f] dark:text-white mb-2">Password reset!</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-1">Set a new password</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "New password", value: password, onChange: setPassword, placeholder: "At least 6 characters" },
                  { label: "Confirm password", value: confirm, onChange: setConfirm, placeholder: "Repeat your password" },
                ].map(({ label, value, onChange, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#1e3a5f] dark:text-gray-300 ml-1">{label}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#1e3a5f] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                        placeholder={placeholder}
                      />
                      {label === "New password" && (
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#f5832a] transition-colors duration-200">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !token}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#f5832a]/20"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>

                <div className="text-center pt-1">
                  <Link to="/login" className="text-sm font-semibold text-[#1e3a5f] dark:text-gray-400 hover:text-[#f5832a] dark:hover:text-[#f5832a] transition-colors duration-200">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
