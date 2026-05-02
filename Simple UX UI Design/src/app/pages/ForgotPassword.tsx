import { useState } from "react";
import { Link } from "react-router";
import { Video, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-slate-200 p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-600 p-2.5 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">ReactivEdu</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Forgot your password?</h2>
          <p className="text-slate-500 text-[15px]">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm w-full">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox.</span>
            </div>
            <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-900 mt-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[14px] font-semibold text-slate-700 ml-1">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all text-[15px]"
                  placeholder="teacher@school.edu"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-[15px] font-bold text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>

            <div className="text-center text-sm text-slate-600">
              <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-900">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
