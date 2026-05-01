import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Home, Users, Plus, X, Ban, CheckCircle2, Trash2, AlertTriangle, Settings, FileText, LogIn } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
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
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"users" | "audit" | "logins" | "settings">("users");
  
  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <span className="text-base font-semibold text-slate-800">Admin Console</span>
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
        <div className="mb-6 flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "audit"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("logins")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "logins"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Login Attempts
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "settings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border-2 border-slate-600 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Accounts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
              </div>
              <div className="bg-white border-2 border-green-600 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Active Accounts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.active}</p>
              </div>
              <div className="bg-white border-2 border-orange-600 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Admins</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.administrators}</p>
              </div>
              <div className="bg-white border-2 border-blue-600 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Teachers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.teachers}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 font-semibold text-slate-800">
                  <Users className="w-4 h-4" />
                  Accounts Management
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search username or email"
                    className="w-[26rem] max-w-[60vw] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Create Account
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-slate-500 text-center">Loading accounts...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Username</th>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">Role</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-left px-4 py-3 font-semibold">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t border-slate-100 hover:bg-slate-50/70 cursor-context-menu"
                          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ user: u }); }}
                        >
                          <td className="px-4 py-3 text-slate-800 font-medium">{u.username}</td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as "user" | "admin")}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                            >
                              <option value="user">Teacher</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{shortLastLoginAge(u, nowTs)}</td>
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800">
                <FileText className="w-4 h-4" />
                Audit Logs
              </div>
            </div>
            {auditLoading ? (
              <div className="p-8 text-slate-500 text-center">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">No audit logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Admin</th>
                      <th className="text-left px-4 py-3 font-semibold">Action</th>
                      <th className="text-left px-4 py-3 font-semibold">Target</th>
                      <th className="text-left px-4 py-3 font-semibold">IP Address</th>
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-800 font-medium">{log.adminId}</td>
                        <td className="px-4 py-3 text-slate-700">{log.action}</td>
                        <td className="px-4 py-3 text-slate-600">{log.targetType} {log.targetId ? `(${log.targetId})` : ""}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.ipAddress || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(log.createdAt).toLocaleString()}</td>
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800">
                <LogIn className="w-4 h-4" />
                Login Attempts
              </div>
            </div>
            {loginLoading ? (
              <div className="p-8 text-slate-500 text-center">Loading login attempts...</div>
            ) : loginAttempts.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">No login attempts found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Email</th>
                      <th className="text-left px-4 py-3 font-semibold">IP Address</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Reason</th>
                      <th className="text-left px-4 py-3 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginAttempts.map((attempt) => (
                      <tr key={attempt.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-800 font-medium">{attempt.email || "Unknown"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{attempt.ipAddress}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${attempt.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {attempt.success ? "Success" : "Failed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{attempt.failureReason || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(attempt.timestamp).toLocaleString()}</td>
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-800">
                <Settings className="w-4 h-4" />
                System Settings
              </div>
            </div>
            {settingsLoading ? (
              <div className="p-8 text-slate-500 text-center">Loading settings...</div>
            ) : settings.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">No settings found</div>
            ) : (
              <div className="p-6 space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{setting.key}</h3>
                        <p className="text-sm text-slate-600 mt-1">{setting.description || "No description"}</p>
                      </div>
                      <input
                        type="text"
                        defaultValue={String(setting.value)}
                        onBlur={(e) => handleUpdateSetting(setting.key, e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                ))}
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
            className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="font-semibold text-slate-900 text-sm">{contextMenu.user.username}</p>
              <p className="text-xs text-slate-500">{contextMenu.user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { handleToggleStatus(contextMenu.user.id); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {contextMenu.user.isActive
                ? <><Ban className="w-4 h-4 text-orange-500" /> Deactivate</>
                : <><CheckCircle2 className="w-4 h-4 text-green-500" /> Activate</>}
            </button>
            <button
              type="button"
              onClick={() => { handleDeleteUser(contextMenu.user.id); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete account
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Create New Account</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({ username: "", email: "", password: "", role: "user" });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="user">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
