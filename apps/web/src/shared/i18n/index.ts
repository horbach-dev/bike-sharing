import i18next from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

export type AppLanguage = "en" | "ru";
export type AppNamespace = "common" | "home" | "services" | "admin" | "investors" | "wallet";

const languageNamespaces: Record<AppLanguage, Record<AppNamespace, () => Promise<{ default: Record<string, unknown> }>>> = {
  en: {
    common: () => import("./locales/en/common.json"),
    home: () => import("./locales/en/home.json"),
    services: () => import("./locales/en/services.json"),
    admin: () => import("./locales/en/admin.json"),
    investors: () => import("./locales/en/investors.json"),
    wallet: () => import("./locales/en/wallet.json"),
  },
  ru: {
    common: () => import("./locales/ru/common.json"),
    home: () => import("./locales/ru/home.json"),
    services: () => import("./locales/ru/services.json"),
    admin: () => import("./locales/ru/admin.json"),
    investors: () => import("./locales/ru/investors.json"),
    wallet: () => import("./locales/ru/wallet.json"),
  },
};

function getTelegramLanguage(): AppLanguage | undefined {
  const language = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.toLowerCase();
  if (language?.startsWith("ru")) return "ru";
  if (language?.startsWith("en")) return "en";
  return undefined;
}

function getInitialLanguage(): AppLanguage {
  const saved = localStorage.getItem("scoot-language");
  if (saved === "en" || saved === "ru") return saved;
  return getTelegramLanguage() ?? (navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en");
}

export const i18n = i18next.createInstance();

export function initializeI18n() {
  i18n.on("languageChanged", (language) => {
    const selected = language.startsWith("ru") ? "ru" : "en";
    localStorage.setItem("scoot-language", selected);
    document.documentElement.lang = selected;
    document.title = i18n.t("Scoot Nha Trang — скутеры для города и побережья", { ns: "common" });
  });

  return i18n
    .use(resourcesToBackend(async (language: string, namespace: string) => {
      const lng = language.startsWith("ru") ? "ru" : "en";
      const ns = namespace as AppNamespace;
      return (await languageNamespaces[lng][ns]()).default;
    }))
    .use(initReactI18next)
    .init({
      lng: getInitialLanguage(),
      fallbackLng: "ru",
      supportedLngs: ["en", "ru"],
      ns: ["common"],
      defaultNS: "common",
      fallbackNS: "common",
      interpolation: { escapeValue: false },
      returnNull: false,
      react: { useSuspense: true },
    });
}
