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
  // Pages rendered without the Layout nav bar
  {
    path: "/app/account",
    Component: Account,
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
]);
