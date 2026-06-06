import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { User, Mail, Lock, UserPlus, AlertCircle, Video, Eye, EyeOff, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { register as apiRegister, verifyEmail as apiVerifyEmail } from "../../lib/api";

type Step = "form" | "verify" | "done";

export default function Register() {
  const navigate = useNavigate();
  const { clearError, error } = useAuthStore();

  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [step, setStep] = useState<Step>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (username.trim().length < 3) return setLocalError("Username must be at least 3 characters.");
    if (!email.includes("@")) return setLocalError("Please enter a valid email address.");
    if (password.length < 6) return setLocalError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setLocalError("Passwords do not match.");

    setIsLoading(true);
    try {
      const data = await apiRegister(username.trim(), email.trim(), password);
      setPendingEmail(data.email);
      setStep("verify");
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return setLocalError("Enter all 6 digits.");
    setLocalError(null);
    setIsLoading(true);
    try {
      await apiVerifyEmail(pendingEmail, fullCode);
      setStep("done");
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await apiRegister(username.trim(), pendingEmail, password);
      setCode(["", "", "", "", "", ""]);
      setLocalError(null);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((n) => {
          if (n <= 1) { clearInterval(timer); return 0; }
          return n - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#1a1a1a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[500px] bg-white dark:bg-[#242424] shadow-2xl rounded-3xl border border-[#2563a8]/10 dark:border-white/10 overflow-hidden animate-fade-in">

        {/* Header bar */}
        <div className="bg-[#2563a8] px-8 py-6 flex items-center gap-3">
          <div className="bg-[#f5832a] p-2 rounded-xl shadow-lg shadow-[#f5832a]/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AI-ActivEdu</span>
        </div>

        <div className="p-8 sm:p-10">

          {/* ── Step 1: Registration form ── */}
          {step === "form" && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-[#2563a8] dark:text-white mb-1">Create Account</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Start building interactive lessons in minutes.</p>
              </div>

              {displayError && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "Username", icon: User, type: "text", value: username, onChange: setUsername, placeholder: "Choose a username" },
                  { label: "Email", icon: Mail, type: "email", value: email, onChange: setEmail, placeholder: "teacher@school.edu" },
                ].map(({ label, icon: Icon, type, value, onChange, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#2563a8] dark:text-gray-300 ml-1">{label}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                      </div>
                      <input
                        type={type}
                        required
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                        placeholder={placeholder}
                      />
                    </div>
                  </div>
                ))}

                {[
                  { label: "Password", value: password, onChange: setPassword, placeholder: "At least 6 characters" },
                  { label: "Confirm Password", value: confirmPassword, onChange: setConfirmPassword, placeholder: "Re-enter password" },
                ].map(({ label, value, onChange, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#2563a8] dark:text-gray-300 ml-1">{label}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#f5832a] transition-colors duration-200" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 text-sm"
                        placeholder={placeholder}
                      />
                      {label === "Password" && (
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
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#f5832a]/20"
                  >
                    {isLoading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <UserPlus className="w-4 h-4" />
                    }
                    {isLoading ? "Sending code..." : "Create Account"}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500 dark:text-gray-300/50">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#2563a8] dark:text-[#f5832a] hover:text-[#f5832a] dark:hover:text-[#ffa05c] transition-colors duration-200">
                  Sign in
                </Link>
              </div>
            </>
          )}

          {/* ── Step 2: Verify email ── */}
          {step === "verify" && (
            <div className="animate-fade-in">
              <div className="mb-7 text-center">
                <div className="w-14 h-14 bg-[#f0f5ff] dark:bg-[#2e2e2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#2563a8] dark:text-[#f5832a]" />
                </div>
                <h1 className="text-2xl font-bold text-[#2563a8] dark:text-white mb-2">Check your email</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-[#2563a8] dark:text-white">{pendingEmail}</span>
                </p>
              </div>

              {displayError && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleVerify}>
                {/* 6-digit code inputs */}
                <div className="flex gap-2 justify-center mb-6" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      aria-label={`Digit ${i + 1} of verification code`}
                      title={`Digit ${i + 1}`}
                      placeholder="·"
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-11 h-13 text-center text-xl font-bold bg-[#f0f4f8] dark:bg-[#2e2e2e] border-2 border-transparent dark:border-white/10 rounded-xl text-[#2563a8] dark:text-white placeholder-slate-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all duration-200 select-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || code.join("").length < 6}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#f5832a]/20"
                >
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : null
                  }
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-300/50 mb-2">Didn't receive it?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f5832a] hover:text-[#e86e15] disabled:text-slate-400 dark:disabled:text-gray-600 transition-colors duration-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <div className="text-center animate-fade-in py-4">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#2563a8] dark:text-white mb-2">Email verified!</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-7">
                Your account is ready. Sign in to get started.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold text-white bg-[#f5832a] hover:bg-[#e86e15] focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f2040] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#f5832a]/20"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
