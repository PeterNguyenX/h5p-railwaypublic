import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
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
      }
    ],
  },
]);
