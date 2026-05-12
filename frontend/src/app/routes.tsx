import { useEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useNavigate } from "react-router";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminUserSettings from "./pages/AdminUserSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useAuthStore } from "../lib/authStore";

function RootRedirect() {
  return <Navigate to="/login" replace />;
}

function ProtectedRoute() {
  const { token, sessionChecked, validateSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    if (sessionChecked && !token) {
      navigate("/login", { replace: true });
    }
  }, [sessionChecked, token, navigate]);

  if (!sessionChecked) return null;
  if (!token) return null;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/app/account",
        Component: Account,
      },
      {
        path: "/app/settings",
        Component: Settings,
      },
      {
        path: "/app/admin",
        Component: Admin,
      },
      {
        path: "/app/admin/users/:id/settings",
        Component: AdminUserSettings,
      },
      {
        path: "/app/editor",
        Component: Editor,
      },
      {
        path: "/app/editor/:id",
        Component: Editor,
      },
      {
        path: "/app",
        Component: Layout,
        children: [
          {
            path: "dashboard",
            Component: Dashboard,
          },
        ],
      },
    ],
  },
]);
