import { ArrowUpRight, Languages, UserRound, WalletCards } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getTelegramWebApp } from "@/shared/lib/telegram";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { ServiceHeader } from "@/shared/ui/service-header";
import "./profile-page.css";

export function ProfilePage() {
  const { t } = useTranslation("common");
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.username || t("Гость");
  const accountDetail = user?.username
    ? "@" + user.username
    : t("Профиль можно связать с Telegram через кошелёк NhaCoin.");

  return (
    <main className="service-shell profile-shell">
      <ServiceHeader />
      <section className="service-hero profile-hero">
        <span className="service-eyebrow">{t("НАСТРОЙКИ ПРИЛОЖЕНИЯ")}</span>
        <div className="service-hero-row">
          <div>
            <h1>{t("Профиль")}</h1>
            <p>{t("Настройки приложения")}</p>
          </div>
          <span className="service-hero-icon"><UserRound aria-hidden="true" /></span>
        </div>
      </section>

      <section className="profile-account-card" aria-label={t(user ? "АККАУНТ TELEGRAM" : "ГОСТЕВОЙ ДОСТУП")}>
        <span className="profile-account-icon"><UserRound aria-hidden="true" /></span>
        <div className="profile-account-copy">
          <small>{t(user ? "АККАУНТ TELEGRAM" : "ГОСТЕВОЙ ДОСТУП")}</small>
          <h2>{displayName}</h2>
          <p>{accountDetail}</p>
        </div>
      </section>

      <section className="profile-settings-card" aria-labelledby="profile-language-title">
        <div className="profile-settings-heading">
          <span className="profile-settings-icon"><Languages aria-hidden="true" /></span>
          <div>
            <h2 id="profile-language-title">{t("Язык приложения")}</h2>
            <p>{t("Выберите язык интерфейса.")}</p>
          </div>
        </div>
        <LanguageToggle />
        <small className="profile-settings-note">{t("Выбор сохраняется на этом устройстве.")}</small>
      </section>

      <Link className="profile-wallet-link" to="/coins">
        <span className="profile-wallet-icon"><WalletCards aria-hidden="true" /></span>
        <span className="profile-wallet-copy">
          <b>{t("Кошелёк NhaCoin")}</b>
          <small>{t("Баланс, операции и вход через Telegram")}</small>
        </span>
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </main>
  );
}
