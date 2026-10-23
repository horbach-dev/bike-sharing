import type { NavigateFunction } from "react-router-dom";

export function navigateBackWithinApp(navigate: NavigateFunction, pathname: string) {
  if (pathname === "/") return;

  const historyIndex = window.history.state?.idx;
  if (typeof historyIndex === "number" && historyIndex > 0) {
    navigate(-1);
    return;
  }

  navigate("/");
}
