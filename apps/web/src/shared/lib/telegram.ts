import { isTMA } from "@tma.js/sdk-react";

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { username?: string; first_name?: string; last_name?: string; language_code?: string } };
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string | undefined>;
  ready(): void;
  expand(): void;
  onEvent?(eventType: string, eventHandler: () => void): void;
  offEvent?(eventType: string, eventHandler: () => void): void;
  openInvoice?(url: string, callback?: (status: "paid" | "cancelled" | "failed") => void): void;
  HapticFeedback?: {
    impactOccurred?(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  };
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

export function isTelegramMiniApp(): boolean {
  try {
    if (isTMA()) return true;
  } catch {
    // Fall through to the official WebApp launch data when SDK detection is unavailable.
  }

  return Boolean(getTelegramWebApp()?.initData?.trim());
}
