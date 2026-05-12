import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Save, X } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { updateMyAccount } from "../../lib/api";
import { useT } from "../../lib/useT";

export default function Account() {
  const navigate = useNavigate();
  const { token, user, getCurrentProfile, updateCurrentProfile, updateAuthenticatedUser } = useAuthStore();
  const t = useT();

  const profile = useMemo(() => getCurrentProfile(), [getCurrentProfile, user?.id]);
  const isAdmin = user?.role === "admin";

  const [displayName, setDisplayName] = useState(isAdmin ? "ADMIN" : (profile?.displayName || ""));
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (isAdmin) {
      setDisplayName((profile?.displayName || user?.username || "ADMIN").toUpperCase());
      setUsername((user?.username || "").toUpperCase());
      setEmail(user?.email || "");
    } else {
      setDisplayName(profile?.displayName || user?.username || "");
      setUsername(user?.username || "");
      setEmail(user?.email || "");
    }
  }, [token, profile?.displayName, user?.username, user?.email, navigate, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const normalizedUsername = isAdmin ? username.trim().toUpperCase() : username.trim();
    const normalizedEmail = email.trim();
    const normalizedDisplayName = isAdmin
      ? displayName.trim().toUpperCase()
      : (displayName.trim() || normalizedUsername);

    if (!normalizedUsername || !normalizedEmail) {
      setSaveError(t("account.error.required", "Username and email are required."));
      return;
    }

    try {
      const updatedUser = await updateMyAccount(normalizedUsername, normalizedEmail);
      updateAuthenticatedUser({ username: updatedUser.username, email: updatedUser.email });
      updateCurrentProfile({ displayName: normalizedDisplayName });
      navigate("/app/dashboard?profile_saved=1");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t("account.error.updateFailed", "Failed to update account settings."));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-[#242424] border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <span className="text-base font-semibold text-slate-800 dark:text-gray-200">{t("account.title", "Profile")}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t("account.displayName", "Display Name")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(isAdmin ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                placeholder={t("account.displayNamePlaceholder", "Your full name")}
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t("account.username", "Username")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(isAdmin ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                placeholder={t("account.username", "Username")}
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t("account.email", "Email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate("/app/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5832a] hover:bg-[#e86e15] dark:bg-transparent dark:border dark:border-[#f5832a] dark:hover:border-[#ffa05c] text-white font-semibold rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
                {t("action.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                {t("account.saveProfile", "Save Profile")}
              </button>
            </div>

            {saveError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{saveError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
