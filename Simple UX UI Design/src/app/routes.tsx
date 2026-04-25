import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import AdminUserSettings from "./pages/AdminUserSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function RootRedirect() {
  return <Navigate to="/login" replace />;
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
    path: "/app",
    Component: Layout,
    children: [
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "editor",
        Component: Editor,
      },
      {
        path: "editor/:id",
        Component: Editor,
      },
      {
        path: "account",
        Component: Account,
      },
      {
        path: "admin",
        Component: Admin,
      },
      {
        path: "admin/users/:id/settings",
        Component: AdminUserSettings,
      }
    ],
  },
]);
