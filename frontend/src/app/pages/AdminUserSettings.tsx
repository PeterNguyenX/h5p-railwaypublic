import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, UserCircle2 } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { fetchAdminUser, updateAdminUserAccount } from "../../lib/api";

export default function AdminUserSettings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      navigate("/app/dashboard");
      return;
    }
    if (!id) {
      setSaveError("Missing user id.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setSaveError(null);
      try {
        const { user: selectedUser } = await fetchAdminUser(id);
        setUsername(selectedUser.username || "");
        setEmail(selectedUser.email || "");
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : "Failed to load user account settings.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, user?.role, navigate, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setSaveError("Missing user id.");
      return;
    }

    setSaveError(null);
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();

    if (!normalizedUsername || !normalizedEmail) {
      setSaveError("Username and email are required.");
      return;
    }

    try {
      const result = await updateAdminUserAccount(id, normalizedUsername, normalizedEmail);
      setUsername(result.user.username);
      setEmail(result.user.email);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update account settings.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">User Account Settings</h1>
          <p className="text-slate-600 dark:text-gray-400 text-[15px]">Update username and email for this account.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/admin")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:border dark:border-white/20 dark:hover:border-white/40 text-slate-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
      </div>

      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8">
        {isLoading ? (
          <p className="text-slate-500 dark:text-gray-400">Loading account settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-slate-700 dark:text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                placeholder="Username"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-700 dark:text-gray-300 mb-1.5">Email</label>
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
              <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400 text-sm">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-[#2e2e2e] text-slate-700 dark:text-gray-300 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <span>These changes apply to the selected account.</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>

            {saveError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{saveError}</p>}
            {saved && <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Saved successfully.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
