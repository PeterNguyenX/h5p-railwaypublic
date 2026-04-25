import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Shield, Users, Plus, X, Ban, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../lib/authStore";
import {
  fetchAdminUsers,
  setAdminUserRole,
  toggleAdminUserStatus,
  createAdminUser,
  deleteAdminUser,
  type AdminUser,
} from "../lib/api";

function shortLastLoginAge(user: AdminUser, nowTs: number): string {
  const sourceDate = user.lastLoginAt || user.updatedAt || user.createdAt;
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      navigate("/app/dashboard");
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAdminUsers();
        setUsers(data.users);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, user?.role, navigate]);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);
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
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Console</h1>
          <p className="text-slate-600 text-[15px]">Manage accounts, access levels, and activation status.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 font-semibold text-sm">
          <Shield className="w-4 h-4" />
          Administrator
        </div>
      </div>

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
          <p className="text-xs text-slate-500 uppercase tracking-wide">Administrator Accounts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.administrators}</p>
        </div>
        <div className="bg-white border-2 border-blue-600 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Teacher Accounts</p>
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

        {error && (
          <div className="mx-4 my-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

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
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ user: u });
                    }}
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      <div className="relative flex flex-col gap-1">
                        <span>{u.username}</span>
                        {u.suspicious && (
                          <div className="relative group w-fit">
                            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Warning: suspicious activity
                            </p>
                            <div className="hidden group-hover:block absolute top-full left-0 mt-1 z-20 w-72 p-3 rounded-lg border border-red-200 bg-white text-slate-700 text-xs shadow-lg">
                              <p className="font-bold text-red-700 mb-1">Why flagged</p>
                              <p className="mb-2">{u.suspiciousReason || "Unusual activity detected"}</p>
                              {u.recentActivity && u.recentActivity.length > 0 && (
                                <>
                                  <p className="font-bold text-slate-800 mb-1">Recent activity</p>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {u.recentActivity.map((item, idx) => (
                                      <li key={`${u.id}-activity-${idx}`}>{item}</li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {contextMenu?.user.id === u.id && (
                          <div
                            className="absolute left-0 top-full mt-2 z-40 min-w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleToggleStatus(contextMenu.user.id);
                                setContextMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                            >
                              {contextMenu.user.isActive ? <Ban className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                              {contextMenu.user.isActive ? "Deactivate account" : "Activate account"}
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteUser(contextMenu.user.id);
                                setContextMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete account
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as "user" | "admin")}
                        aria-label={`Role for ${u.username}`}
                        title={`Role for ${u.username}`}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                      >
                        <option value="user">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {shortLastLoginAge(u, nowTs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Create New Account</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({ username: "", email: "", password: "", role: "user" });
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
                title="Close dialog"
                aria-label="Close create account dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  placeholder="username"
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
                  placeholder="email@example.com"
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
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  title="Select user role"
                  aria-label="User role"
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
                  {isCreating ? "Creating..." : "Create Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({ username: "", email: "", password: "", role: "user" });
                    setError(null);
                  }}
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
