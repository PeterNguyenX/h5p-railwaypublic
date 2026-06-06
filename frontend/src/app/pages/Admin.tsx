import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Home, Users, Plus, X, Ban, CheckCircle2, Trash2, AlertTriangle, Settings, FileText, LogIn, Search } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { useT } from "../../lib/useT";
import {
  fetchAdminUsers,
  setAdminUserRole,
  toggleAdminUserStatus,
  createAdminUser,
  deleteAdminUser,
  fetchAuditLogs,
  fetchLoginAttempts,
  fetchSystemSettings,
  updateSystemSetting,
  type AdminUser,
  type AuditLog,
  type LoginAttempt,
  type SystemSetting,
} from "../../lib/api";

function shortLastLoginAge(user: AdminUser, nowTs: number): string {
  if (!user.lastLoginAt) return "Never";
  const sourceDate = user.lastLoginAt;
  const elapsedSeconds = Math.max(0, Math.floor((nowTs - new Date(sourceDate).getTime()) / 1000));

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays}d`;
  }

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks < 4) {
    return `${elapsedWeeks}w`;
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return `${elapsedMonths}mo`;
  }

  const elapsedYears = Math.floor(elapsedDays / 365);
  return `${elapsedYears}y`;
}

export default function Admin() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const t = useT();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"users" | "audit" | "logins" | "settings">("users");
  
  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [contextMenu, setContextMenu] = useState<{ user: AdminUser } | null>(null);
  const [createFormData, setCreateFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  // Audit logs tab state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  // Login attempts tab state
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loginPage, setLoginPage] = useState(1);
  const [loginLoading, setLoginLoading] = useState(false);

  // Settings tab state
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      navigate("/app/dashboard");
      return;
    }

    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    } else if (activeTab === "logins") {
      loadLoginAttempts();
    } else if (activeTab === "settings") {
      loadSettings();
    }
  }, [token, user?.role, navigate, activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await fetchAuditLogs(auditPage, 50);
      setAuditLogs(data.logs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  };

  const loadLoginAttempts = async () => {
    setLoginLoading(true);
    try {
      const data = await fetchLoginAttempts(loginPage, 50);
      setLoginAttempts(data.attempts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load login attempts");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchingUsers = q
      ? users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : users;
    const now = Date.now();
    const loginAgeSeconds = (u: AdminUser) => {
      const sourceDate = u.lastLoginAt || u.updatedAt || u.createdAt;
      return Math.max(0, Math.floor((now - new Date(sourceDate).getTime()) / 1000));
    };
    return [...matchingUsers].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return loginAgeSeconds(a) - loginAgeSeconds(b);
    });
  }, [users, search]);

  const summary = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    const administrators = users.filter((u) => u.role === "admin").length;
    const teachers = users.filter((u) => u.role === "user").length;
    return { total: users.length, active, administrators, teachers };
  }, [users]);

  const handleRoleChange = async (id: string, role: "user" | "admin") => {
    try {
      const result = await setAdminUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: result.user.role } : u)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await toggleAdminUserStatus(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: result.user.isActive } : u)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteUser = async (id: string) => {
    const ok = window.confirm("Delete this account permanently?");
    if (!ok) return;
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.username || !createFormData.email || !createFormData.password) {
      setError("All fields are required");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createAdminUser(
        createFormData.username,
        createFormData.email,
        createFormData.password,
        createFormData.role
      );
      setUsers((prev) => [...prev, result.user]);
      setCreateFormData({ username: "", email: "", password: "", role: "user" });
      setShowCreateModal(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: unknown) => {
    try {
      await updateSystemSetting(key, value);
      await loadSettings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-[#242424] border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-800 dark:text-gray-200">{t('admin.title', 'Admin Console')}</span>
          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-[#2563a8] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#2563a8] dark:hover:border-[#3d6ba6] text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('action.home', 'Home')}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
          {(["users", "audit", "logins", "settings"] as const).map((tab) => {
            const icons = { users: <Users className="w-4 h-4" />, audit: <FileText className="w-4 h-4" />, logins: <LogIn className="w-4 h-4" />, settings: <Settings className="w-4 h-4" /> };
            const labels = {
              users: t('admin.tab.users', 'Users'),
              audit: t('admin.tab.audit', 'Audit Logs'),
              logins: t('admin.tab.logins', 'Login Attempts'),
              settings: t('admin.tab.settings', 'Settings'),
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-2 border-[#2563a8] dark:border-[#f5832a] text-[#2563a8] dark:text-[#f5832a]"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200"
                }`}
              >
                {icons[tab]}
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#242424] border-2 border-slate-300 dark:border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">Total Accounts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total}</p>
              </div>
              <div className="bg-white dark:bg-[#242424] border-2 border-[#2563a8] dark:border-[#2563a8] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">Active Accounts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.active}</p>
              </div>
              <div className="bg-white dark:bg-[#242424] border-2 border-[#f5832a] dark:border-[#f5832a] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">Admins</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.administrators}</p>
              </div>
              <div className="bg-white dark:bg-[#242424] border-2 border-[#2563a8] dark:border-[#2563a8] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">Teachers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.teachers}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-gray-200">
                  <Users className="w-4 h-4" />
                    {t('admin.accountsManagement', 'Accounts Management')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {searchOpen ? (
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-lg px-2 focus-within:ring-2 focus-within:ring-[#f5832a]/40 focus-within:border-[#f5832a] transition-all">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          autoFocus
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onBlur={() => { if (!search) setSearchOpen(false); }}
                          placeholder={t('admin.searchPlaceholder', 'Search username or email')}
                          className="w-52 py-2 px-1 bg-transparent text-sm outline-none"
                        />
                        {search && (
                          <button type="button" title={t('admin.clearSearch', 'Clear search')} onClick={() => { setSearch(""); }} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="flex items-center gap-1.5 h-9 px-3 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        {t('admin.search', 'Search')}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563a8] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#2563a8] dark:hover:border-[#3d6ba6] text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    {t('admin.createAccount', 'Create Account')}
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-slate-500 text-center">{t('admin.loadingAccounts', 'Loading accounts...')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#1a1a1a] text-slate-600 dark:text-gray-400">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">{t('admin.account', 'Account')}</th>
                        <th className="text-left px-4 py-3 font-semibold">{t('admin.role', 'Role')}</th>
                        <th className="text-left px-4 py-3 font-semibold">{t('admin.status', 'Status')}</th>
                        <th className="text-left px-4 py-3 font-semibold">{t('admin.lastLogin', 'Last Login')}</th>
                        <th className="text-right px-4 py-3 font-semibold">{t('admin.videos', 'Videos')}</th>
                        <th className="text-right px-4 py-3 font-semibold">{t('admin.trash', 'Trash')}</th>
                        <th className="text-right px-4 py-3 font-semibold">{t('admin.aiToday', 'AI Today')}</th>
                        <th className="text-right px-4 py-3 font-semibold">{t('admin.aiEver', 'AI Ever')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-black/20 cursor-context-menu transition-colors"
                          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ user: u }); }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-gray-200">{u.username}</div>
                            <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as "user" | "admin")}
                              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                            >
                              <option value="user">{t('admin.user', 'User')}</option>
                              <option value="admin">{t('admin.administrator', 'Administrator')}</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${u.isActive ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"}`}>
                              {u.isActive ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{shortLastLoginAge(u, nowTs)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-gray-300">{u.videoCount ?? 0}</td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-gray-400">{u.videoTrashCount ?? 0}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${(u.aiProcessedToday ?? 0) >= 3 && u.role !== 'admin' ? 'text-red-500' : 'text-slate-700'}`}>
                              {u.role === 'admin' ? '∞' : `${u.aiProcessedToday ?? 0}/3`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-gray-300">{u.aiProcessedEver ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/10">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-gray-200">
                <FileText className="w-4 h-4" />
                {t('admin.auditLogs', 'Audit Logs')}
              </div>
            </div>
            {auditLoading ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.loadingAuditLogs', 'Loading audit logs...')}</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.noAuditLogs', 'No audit logs found')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-[#1a1a1a] text-slate-600 dark:text-gray-400">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.admin', 'Admin')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.action', 'Action')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.target', 'Target')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.ipAddress', 'IP Address')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.date', 'Date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                        <td className="px-4 py-3 text-slate-800 dark:text-gray-200 font-medium">{log.adminId}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{log.action}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{log.targetType} {log.targetId ? `(${log.targetId})` : ""}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-400 font-mono text-xs">{log.ipAddress || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Login Attempts Tab */}
        {activeTab === "logins" && (
          <div className="bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/10">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-gray-200">
                <LogIn className="w-4 h-4" />
                {t('admin.loginAttempts', 'Login Attempts')}
              </div>
            </div>
            {loginLoading ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.loadingLoginAttempts', 'Loading login attempts...')}</div>
            ) : loginAttempts.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.noLoginAttempts', 'No login attempts found')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-[#1a1a1a] text-slate-600 dark:text-gray-400">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.account', 'Account')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.ipAddress', 'IP Address')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.status', 'Status')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.reason', 'Reason')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.time', 'Time')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginAttempts.map((attempt) => (
                      <tr key={attempt.id} className="border-t border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-gray-200">{attempt.username || attempt.email || "Unknown"}</div>
                          {attempt.username && <div className="text-xs text-slate-400 mt-0.5">{attempt.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-400 font-mono text-xs">{attempt.ipAddress}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${attempt.success ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"}`}>
                            {attempt.success ? t('admin.success', 'Success') : t('admin.failed', 'Failed')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-400 text-xs">{attempt.failureReason || "-"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{new Date(attempt.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/10">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-gray-200">
                <Settings className="w-4 h-4" />
                {t('admin.systemSettings', 'System Settings')}
              </div>
            </div>
            {settingsLoading ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.loadingSettings', 'Loading settings...')}</div>
            ) : settings.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">{t('admin.noSettings', 'No settings found')}</div>
            ) : (
              <div className="p-6 space-y-3">
                {settings.map((setting) => {
                  const raw = String(setting.value);
                  const isBool = raw === 'true' || raw === 'false';
                  const isNum  = !isBool && raw !== '' && !isNaN(Number(raw));
                  const boolOn = raw === 'true';
                  return (
                    <div key={setting.id} className="flex items-center justify-between gap-4 border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-[#242424]">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{t(`admin.setting.${setting.key}`, setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-300/50 mt-0.5">{setting.description || "No description"}</p>
                      </div>
                      {isBool ? (
                        /* Toggle for true/false */
                        <button
                          type="button"
                          onClick={() => handleUpdateSetting(setting.key, boolOn ? 'false' : 'true')}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/50 ${boolOn ? 'bg-[#f5832a]' : 'bg-slate-300 dark:bg-[#2e2e2e]'}`}
                          title={boolOn ? t('admin.enabledClickDisable', 'Enabled — click to disable') : t('admin.disabledClickEnable', 'Disabled — click to enable')}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${boolOn ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : isNum ? (
                        /* Number input */
                        <input
                          type="number"
                          defaultValue={raw}
                          title={setting.key}
                          placeholder={t('admin.value', '0')}
                          onBlur={(e) => handleUpdateSetting(setting.key, e.target.value)}
                          className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                        />
                      ) : (
                        /* Text input */
                        <input
                          type="text"
                          defaultValue={raw}
                          title={setting.key}
                          placeholder={t('admin.value', 'value')}
                          onBlur={(e) => handleUpdateSetting(setting.key, e.target.value)}
                          className="w-40 px-3 py-1.5 bg-slate-50 dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        >
          <div
            className="absolute z-50 bg-white dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg py-1 min-w-[180px]"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{contextMenu.user.username}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{contextMenu.user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { handleToggleStatus(contextMenu.user.id); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              {contextMenu.user.isActive
                ? <><Ban className="w-4 h-4 text-[#f5832a]" /> {t('admin.deactivate', 'Deactivate')}</>
                : <><CheckCircle2 className="w-4 h-4 text-[#2563a8] dark:text-[#3d6ba6]" /> {t('admin.activate', 'Activate')}</>}
            </button>
            <button
              type="button"
              onClick={() => { handleDeleteUser(contextMenu.user.id); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#f5832a] hover:bg-[#f5832a]/10 dark:hover:bg-[#f5832a]/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> {t('admin.deleteAccount', 'Delete account')}
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#242424] rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('admin.createNewAccount', 'Create New Account')}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({ username: "", email: "", password: "", role: "user" });
                }}
                className="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t('admin.username', 'Username')}</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t('admin.email', 'Email')}</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t('admin.password', 'Password')}</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">{t('admin.role', 'Role')}</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2e2e2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
                >
                  <option value="user">{t('admin.user', 'User')}</option>
                  <option value="admin">{t('admin.administrator', 'Administrator')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-[#2563a8] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#2563a8] dark:hover:border-[#3d6ba6] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {isCreating ? t('admin.creating', 'Creating...') : t('admin.create', 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:border dark:border-white/20 dark:hover:border-white/40 text-slate-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                >
                  {t('action.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
