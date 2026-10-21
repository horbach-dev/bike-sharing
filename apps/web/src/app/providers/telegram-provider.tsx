import { useEffect, type PropsWithChildren } from "react";
import { getTelegramWebApp } from "@/shared/lib/telegram";

const telegramThemeVariables = [
  "bg_color",
  "secondary_bg_color",
  "text_color",
  "hint_color",
  "link_color",
  "button_color",
  "button_text_color",
  "accent_text_color",
  "header_bg_color",
  "section_bg_color",
  "section_separator_color",
  "bottom_bar_bg_color",
  "subtitle_text_color",
  "destructive_text_color",
] as const;

export function TelegramProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;

    webApp.ready();
    webApp.expand();

    const root = document.documentElement;
    root.dataset.telegramWebApp = "true";

    const applyTheme = () => {
      const scheme = webApp.colorScheme ?? "light";
      root.dataset.telegramColorScheme = scheme;
      root.style.colorScheme = scheme;

      for (const key of telegramThemeVariables) {
        const value = webApp.themeParams?.[key];
        const cssName = "--tg-theme-" + key.replaceAll("_", "-");
        if (value) root.style.setProperty(cssName, value);
        else root.style.removeProperty(cssName);
      }
    };

    applyTheme();
    webApp.onEvent?.("themeChanged", applyTheme);

    return () => {
      webApp.offEvent?.("themeChanged", applyTheme);
      delete root.dataset.telegramWebApp;
      delete root.dataset.telegramColorScheme;
      root.style.removeProperty("color-scheme");
      for (const key of telegramThemeVariables) {
        root.style.removeProperty("--tg-theme-" + key.replaceAll("_", "-"));
      }
    };
  }, []);

  return children;
}
