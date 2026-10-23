import { apiBase, isContentApiConfigured } from "@/shared/api/content";
import { getTelegramWebApp } from "@/shared/lib/telegram";

export type WalletPackage = {
  code: string; title: string; description: string; coinAmount: number;
  starsPrice: number | null; usdtPrice: string | null;
};
export type WalletOffer = { code: string; title: string; description: string; coinCost: number; durationDays: number };
export type WalletReceipt = { orderId: string; provider: "TELEGRAM_STARS" | "CRYPTO_PAY"; status: string; amount: string; currency: string; paidAt: string | null };
export type WalletTransaction = {
  id: string; kind: "TOP_UP" | "SERVICE_SPEND" | "REFUND" | "ADMIN_ADJUSTMENT";
  amount: number; balanceAfter: number; description: string; createdAt: string;
  referenceType?: string | null; referenceId?: string | null; receipt: WalletReceipt | null;
};
export type WalletListing = { id: string; title: string; category: string; promotedUntil: string | null };
export type WalletPendingOrder = { id: string; provider: "TELEGRAM_STARS" | "CRYPTO_PAY"; status: string; coinAmount: number; amount: string; currency: string; paymentUrl: string | null; createdAt: string; expiresAt: string | null };
export type WalletOverview = {
  wallet: { id: string; balance: number; currency: "NHC" };
  listings: WalletListing[]; orders: WalletPendingOrder[]; packages: WalletPackage[]; offers: WalletOffer[];
  transactions: WalletTransaction[];
  payment: { telegramStarsEnabled: boolean; cryptoPayEnabled: boolean; telegramLoginEnabled: boolean; telegramLoginBot: string; coinsPerUnitLabel: string };
};
export type WalletCatalog = { packages: WalletPackage[]; offers: WalletOffer[] };
export type WalletPaymentConfig = WalletOverview["payment"];
export type CreateOrderResult = { orderId: string; status: "PENDING"; coinAmount: number; currency: string; amount: string; paymentUrl: string };

const walletSessionKey = "nhacoin-session";
const widgetAuthKey = "onNhaCoinTelegramAuth";

export type TelegramLoginData = {
  id: number; auth_date: number; hash: string; first_name: string;
  last_name?: string; username?: string; photo_url?: string;
};

function authHeaders() {
  const headers: Record<string, string> = {};
  const initData = getTelegramWebApp()?.initData;
  const token = localStorage.getItem(walletSessionKey);
  if (initData) headers["x-telegram-init-data"] = initData;
  else if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isContentApiConfigured) throw new Error("Server API is not configured yet.");
  const response = await fetch(apiBase + path, {
    ...init,
    headers: { "content-type": "application/json", ...authHeaders(), ...init?.headers },
  });
  if (!response.ok) {
    let message = `API ${response.status}`;
    try {
      const body = await response.json() as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(" · ") : body.message;
    } catch { /* Keep the status text when the server response is not JSON. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const walletApi = {
  config: () => request<WalletPaymentConfig>("/wallet/config"),
  catalog: () => request<WalletCatalog>("/wallet/catalog"),
  me: () => request<WalletOverview>("/wallet/me"),
  transactions: () => request<WalletTransaction[]>("/wallet/transactions?limit=50"),
  login: async (data: TelegramLoginData) => {
    const result = await request<{ token: string; user: { telegramId: string; username?: string }; wallet: WalletOverview["wallet"] }>("/wallet/auth/telegram", { method: "POST", body: JSON.stringify(data) });
    localStorage.setItem(walletSessionKey, result.token);
    return result;
  },
  createOrder: (packageCode: string, provider: "TELEGRAM_STARS" | "CRYPTO_PAY") => request<CreateOrderResult>("/wallet/purchase-orders", { method: "POST", body: JSON.stringify({ packageCode, provider }) }),
  promote: (listingId: string, offerCode: string) => request<{ balance: number; promotedUntil: string; transactionId: string }>("/wallet/spend/top", { method: "POST", body: JSON.stringify({ listingId, offerCode }) }),
  hasSession: () => Boolean(getTelegramWebApp()?.initData || localStorage.getItem(walletSessionKey)),
  setWidgetCallback(callback: ((data: TelegramLoginData) => void) | undefined) {
    const globalWindow = window as Window & { [widgetAuthKey]?: (data: TelegramLoginData) => void };
    if (callback) globalWindow[widgetAuthKey] = callback;
    else delete globalWindow[widgetAuthKey];
  },
  widgetCallbackName: widgetAuthKey,
};
