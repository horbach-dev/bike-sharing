import { createBrowserRouter } from "react-router-dom";
import { AdminPage } from "@/pages/admin";
import { HomePage } from "@/pages/home";
import { CatalogPage } from "@/pages/services/ui/catalog-page";
import { SharingPage, CashbackPage, GuidesPage, GuideDetailPage, PlacesPage, PartnersPage } from "@/pages/services/ui/other-pages";
import { AdminContentPage } from "@/pages/admin-content/ui/admin-content-page";
import { InvestorsPage } from "@/pages/investors";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/investors", element: <InvestorsPage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "/admin/content", element: <AdminContentPage /> },
  { path: "/sharing", element: <SharingPage /> },
  { path: "/cashback", element: <CashbackPage /> },
  { path: "/guides", element: <GuidesPage /> },
  { path: "/guides/:slug", element: <GuideDetailPage /> },
  { path: "/places", element: <PlacesPage /> },
  { path: "/partners", element: <PartnersPage /> },
  { path: "/:section", element: <CatalogPage /> },
], { basename: import.meta.env.BASE_URL });
