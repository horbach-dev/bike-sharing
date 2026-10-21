export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { username?: string; first_name?: string; last_name?: string } };
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string | undefined>;
  ready(): void;
  expand(): void;
  onEvent?(eventType: string, eventHandler: () => void): void;
  offEvent?(eventType: string, eventHandler: () => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}
