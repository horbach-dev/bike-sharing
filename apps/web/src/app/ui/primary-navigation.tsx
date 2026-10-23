import { House, MapPinned, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./primary-navigation.css";

function PrimaryNavigation() {
  const { t } = useTranslation("common");

  return (
    <nav className="app-primary-navigation" aria-label={t("Основная навигация")}>
      <NavLink to="/" end className={({ isActive }) => "app-primary-navigation-link" + (isActive ? " is-active" : "")}>
        <House aria-hidden="true" />
        <span>{t("Главная")}</span>
      </NavLink>
      <NavLink to="/sharing" className={({ isActive }) => "app-primary-navigation-link" + (isActive ? " is-active" : "")}>
        <MapPinned aria-hidden="true" />
        <span>{t("Карта")}</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => "app-primary-navigation-link" + (isActive ? " is-active" : "")}>
        <UserRound aria-hidden="true" />
        <span>{t("Профиль")}</span>
      </NavLink>
    </nav>
  );
}

export function PrimaryNavigationLayout() {
  const { pathname } = useLocation();
  const showNavigation = !pathname.startsWith("/admin") && pathname !== "/investors";

  return (
    <>
      <Outlet />
      {showNavigation && <PrimaryNavigation />}
    </>
  );
}
