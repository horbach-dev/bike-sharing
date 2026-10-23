import { createBrowserRouter, type RouteObject } from "react-router-dom";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/app/providers/error-boundary";
import { ErrorScreen } from "@/app/ui/error-screen";
import { AdminPage } from "@/pages/admin";
import { HomePage } from "@/pages/home";
import { CatalogPage } from "@/pages/services/ui/catalog-page";
import { SharingPage, CashbackPage, GuidesPage, GuideDetailPage, PlacesPage, PartnersPage } from "@/pages/services/ui/other-pages";
import { AdminContentPage } from "@/pages/admin-content/ui/admin-content-page";
import { InvestorsPage } from "@/pages/investors";
import { WalletPage } from "@/pages/wallet";

function pageRoute(path: string, page: ReactNode): RouteObject {
  return {
    path,
    element: <ErrorBoundary>{page}</ErrorBoundary>,
    errorElement: <ErrorScreen />,
  };
}

export const router = createBrowserRouter([
  pageRoute("/", <HomePage />),
  pageRoute("/investors", <InvestorsPage />),
  pageRoute("/admin", <AdminPage />),
  pageRoute("/admin/content", <AdminContentPage />),
  pageRoute("/sharing", <SharingPage />),
  pageRoute("/cashback", <CashbackPage />),
  pageRoute("/guides", <GuidesPage />),
  pageRoute("/guides/:slug", <GuideDetailPage />),
  pageRoute("/places", <PlacesPage />),
  pageRoute("/partners", <PartnersPage />),
  pageRoute("/coins", <WalletPage />),
  pageRoute("/:section", <CatalogPage />),
], { basename: import.meta.env.BASE_URL });
