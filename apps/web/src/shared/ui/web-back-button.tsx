import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { isTelegramMiniApp } from "@/shared/lib/telegram";
import { navigateBackWithinApp } from "@/shared/lib/navigation";

interface WebBackButtonProps {
  className?: string;
}

export function WebBackButton({ className }: WebBackButtonProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (isTelegramMiniApp() || pathname === "/") return null;

  return (
    <button
      className={className}
      type="button"
      aria-label={t("← Назад")}
      onClick={() => navigateBackWithinApp(navigate, pathname)}
    >
      {t("← Назад")}
    </button>
  );
}
