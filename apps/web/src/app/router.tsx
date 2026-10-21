import { createBrowserRouter } from "react-router-dom";
import { AdminPage } from "@/pages/admin";
import { HomePage } from "@/pages/home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
], { basename: import.meta.env.BASE_URL });
