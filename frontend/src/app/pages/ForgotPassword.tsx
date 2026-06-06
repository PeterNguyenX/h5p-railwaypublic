import { useState } from "react";
import { Link } from "react-router";
import { Video, Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#1a1a1a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#242424] shadow-2xl rounded-3xl border border-[#2563a8]/10 dark:border-white/10 overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-[#2563a8] px-8 py-6 flex items-center gap-3">
          <div className="bg-[#f5832a] p-2 rounded-xl shadow-lg shadow-[#f5832a]/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AI-ActivEdu</span>
        </div>

        <div className="p-8 sm:p-10">
          {sent ? (
            <div className="text-center animate-bounce-in">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#2563a8] dark:text-white mb-2">Check your inbox</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
                If an account exists for <span className="font-semibold text-[#2563a8] dark:text-white">{email}</span>,
                a reset link has been sent. It expires in 30 minutes.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5832a] hover:text-[#e86e15] transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-[#2563a8] dark:text-white mb-1">Forgot your password?</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#2563a8] dark:text-gray-300 ml-1">Email address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                      placeholder="teacher@school.edu"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#f5832a]/20"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>

                <div className="text-center pt-1">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563a8] dark:text-gray-400 hover:text-[#f5832a] dark:hover:text-[#f5832a] transition-colors duration-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
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
