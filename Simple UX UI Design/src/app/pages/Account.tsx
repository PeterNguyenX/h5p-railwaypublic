import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Home, Save } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { updateMyAccount } from "../../lib/api";

export default function Account() {
  const navigate = useNavigate();
  const { token, user, getCurrentProfile, updateCurrentProfile, updateAuthenticatedUser } = useAuthStore();

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
      setSaveError("Username and email are required.");
      return;
    }

    try {
      const updatedUser = await updateMyAccount(normalizedUsername, normalizedEmail);
      updateAuthenticatedUser({ username: updatedUser.username, email: updatedUser.email });
      updateCurrentProfile({ displayName: normalizedDisplayName });
      navigate("/app/dashboard?profile_saved=1");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update account settings.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Back header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <span className="text-base font-semibold text-slate-800">Account Settings</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-slate-700 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(isAdmin ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(isAdmin ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Username"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>

            {saveError && <p className="text-sm text-red-700 font-semibold">{saveError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
