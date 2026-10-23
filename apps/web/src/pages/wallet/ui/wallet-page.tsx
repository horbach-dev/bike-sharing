import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, CircleHelp, Clock3, Gift, History, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { walletApi, type CreateOrderResult, type TelegramLoginData, type WalletOffer, type WalletPendingOrder } from "@/shared/api/wallet";
import { publicAsset } from "@/shared/lib/public-asset";
import { getTelegramWebApp } from "@/shared/lib/telegram";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { SelectField } from "@/shared/ui/select-field";
import { CoinLogo } from "@/widgets/nhacoin";
import { WebBackButton } from "@/shared/ui/web-back-button";
import "./wallet-page.css";

const packagePreview = [
  { code: "starter", title: "Лёгкий старт", description: "Тестовый размер пакета. Цена включается после настройки тарифа.", coinAmount: 300, starsPrice: null, usdtPrice: null },
  { code: "city", title: "Городской запас", description: "Тестовый размер пакета. Цена включается после настройки тарифа.", coinAmount: 900, starsPrice: null, usdtPrice: null },
  { code: "trip", title: "Большое путешествие", description: "Тестовый размер пакета. Цена включается после настройки тарифа.", coinAmount: 2000, starsPrice: null, usdtPrice: null },
];

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function offerLabel(offer: WalletOffer, t: (key: string, options?: Record<string, unknown>) => string) {
  return t("{{days}} дн. · {{coins}} NHC", { days: offer.durationDays, coins: offer.coinCost });
}

export function WalletPage() {
  const { t, i18n } = useTranslation(["wallet", "common"]);
  const queryClient = useQueryClient();
  const miniApp = getTelegramWebApp();
  const isMiniApp = Boolean(miniApp?.initData);
  const [loggedIn, setLoggedIn] = useState(walletApi.hasSession());
  const [loginBusy, setLoginBusy] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [selectedOffers, setSelectedOffers] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const configQuery = useQuery({ queryKey: ["wallet", "config"], queryFn: walletApi.config });
  const catalogQuery = useQuery({ queryKey: ["wallet", "catalog"], queryFn: walletApi.catalog });
  const meQuery = useQuery({ queryKey: ["wallet", "me"], queryFn: walletApi.me, enabled: loggedIn });
  const config = configQuery.data ?? meQuery.data?.payment;
  const catalog = catalogQuery.data ?? { packages: packagePreview, offers: [] };
  const providers = useMemo(() => {
    if (isMiniApp) return config?.telegramStarsEnabled ? ["TELEGRAM_STARS" as const] : [];
    return [
      ...(config?.telegramStarsEnabled ? ["TELEGRAM_STARS" as const] : []),
      ...(config?.cryptoPayEnabled ? ["CRYPTO_PAY" as const] : []),
    ];
  }, [config?.cryptoPayEnabled, config?.telegramStarsEnabled, isMiniApp]);
  const [provider, setProvider] = useState<"TELEGRAM_STARS" | "CRYPTO_PAY">("TELEGRAM_STARS");

  useEffect(() => {
    if (providers.length && !providers.includes(provider)) setProvider(providers[0]);
  }, [provider, providers]);

  useEffect(() => {
    const username = config?.telegramLoginBot;
    if (!username || isMiniApp || loggedIn || !config?.telegramLoginEnabled) return;
    const mount = document.getElementById("nhacoin-telegram-login");
    if (!mount) return;
    walletApi.setWidgetCallback(async (data: TelegramLoginData) => {
      setLoginBusy(true);
      setNotice("");
      try {
        await walletApi.login(data);
        setLoggedIn(true);
        await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      } catch (error) {
        setNotice(error instanceof Error ? error.message : t("Не удалось войти через Telegram."));
      } finally { setLoginBusy(false); }
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.dataset.telegramLogin = username;
    script.dataset.size = "large";
    script.dataset.userpic = "false";
    script.dataset.onauth = `${walletApi.widgetCallbackName}(user)`;
    mount.replaceChildren(script);
    return () => { walletApi.setWidgetCallback(undefined); mount.replaceChildren(); };
  }, [config?.telegramLoginBot, config?.telegramLoginEnabled, isMiniApp, loggedIn, queryClient, t]);

  async function buy(packageCode: string) {
    if (!loggedIn) { setNotice(t("Войдите через Telegram, чтобы создать личный баланс.")); return; }
    setBusyKey(packageCode);
    setNotice("");
    try {
      const order: CreateOrderResult = await walletApi.createOrder(packageCode, provider);
      if (provider === "TELEGRAM_STARS" && miniApp?.openInvoice) {
        miniApp.openInvoice(order.paymentUrl, (status) => {
          if (status === "paid") setNotice(t("Оплата принята Telegram. Обновляем баланс…"));
          if (status === "cancelled") setNotice(t("Оплата отменена."));
          void queryClient.invalidateQueries({ queryKey: ["wallet"] });
        });
      } else {
        window.location.assign(order.paymentUrl);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("Не удалось создать платёж."));
    } finally { setBusyKey(""); }
  }

  async function promote(listingId: string) {
    const offerCode = selectedOffers[listingId] ?? meQuery.data?.offers[0]?.code;
    if (!offerCode) return;
    setBusyKey(listingId);
    setNotice("");
    try {
      await walletApi.promote(listingId, offerCode);
      setNotice(t("Объявление поднято в топ."));
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      await queryClient.invalidateQueries({ queryKey: ["home"] });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("Не удалось списать NhaCoin."));
    } finally { setBusyKey(""); }
  }

  function resumePayment(order: WalletPendingOrder) {
    if (isMiniApp && order.provider === "CRYPTO_PAY") return;
    if (!order.paymentUrl) return;
    if (order.provider === "TELEGRAM_STARS" && miniApp?.openInvoice) {
      miniApp.openInvoice(order.paymentUrl, () => { void queryClient.invalidateQueries({ queryKey: ["wallet"] }); });
    } else window.location.assign(order.paymentUrl);
  }

  const balance = meQuery.data?.wallet.balance ?? 0;
  const sessionFailed = loggedIn && meQuery.isError;

  return <main className="wallet-shell">
    <header className="wallet-topbar">
      <WebBackButton className="wallet-back" />
      <CoinLogo />
    </header>

    <section className="wallet-hero">
      <div className="wallet-hero-copy">
        <span className="wallet-eyebrow"><i />{t("ВАЛЮТА ГОРОДСКИХ ВОЗМОЖНОСТЕЙ")}</span>
        <h1>{t("Знакомьтесь,")}<br /><em>{t("NhaCoin.")}</em></h1>
        <p>{t("Одна монета для продвижения объявлений и будущих полезных услуг в Нячанге.")}</p>
        <div className="wallet-hero-tags"><span><Sparkles size={14} />{t("Просто")}</span><span><ShieldCheck size={14} />{t("Каждое списание видно в истории")}</span></div>
      </div>
      <div className="wallet-coin-art"><img src={publicAsset("brand/nhacoin.png")} alt={t("Золотая монета NhaCoin с пальмой, закатом и морской волной")} /><span>NHC</span></div>
    </section>

    <section className="wallet-account-grid">
      <Card className="wallet-balance-card"><CardContent>
        <div className="wallet-balance-heading"><span className="wallet-small-icon"><Wallet size={19} /></span><span>{t("Ваш баланс")}</span><b>NHC</b></div>
        {loggedIn && !sessionFailed ? <><strong className="wallet-balance-number">{meQuery.isLoading ? "…" : balance.toLocaleString(i18n.language)}</strong><p>{t("NhaCoin в вашем кошельке")}</p></> : <><strong className="wallet-balance-number wallet-balance-number--guest">—</strong><p>{t("Войдите через Telegram, чтобы увидеть баланс.")}</p></>}
      </CardContent></Card>
      <Card className="wallet-login-card"><CardContent>
        <div className="wallet-login-icon"><LockKeyhole size={19} /></div>
        {isMiniApp ? <><h2>{t("Баланс связан с Telegram")}</h2><p>{t("Для входа используется подписанный Telegram-сеанс. Повторный ввод телефона не нужен.")}</p></> : <><h2>{t("Безопасный вход")}</h2><p>{t("Войдите через официальный виджет Telegram. Мы проверяем подпись на сервере.")}</p>{!loggedIn && config?.telegramLoginEnabled && <div id="nhacoin-telegram-login" className="wallet-telegram-login" />}{!loggedIn && !config?.telegramLoginEnabled && <span className="wallet-config-hint">{t("Вход станет доступен после настройки TELEGRAM_BOT_USERNAME и WALLET_SESSION_SECRET.")}</span>}</>}
        {loginBusy && <span className="wallet-inline-progress"><LoaderCircle size={14} className="wallet-spin" />{t("Подтверждаем аккаунт…")}</span>}
        {sessionFailed && <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("nhacoin-session"); setLoggedIn(false); }}>{t("Войти заново")}</Button>}
      </CardContent></Card>
    </section>

    <section className="wallet-buy-section">
      <div className="wallet-section-heading"><div><span className="wallet-eyebrow">{t("ПОПОЛНЕНИЕ")}</span><h2>{t("Выберите пакет монет")}</h2></div><span>{t("Оплата подтверждается провайдером")}</span></div>
      <div className="wallet-provider-row">
        <span>{t("Способ оплаты")}</span>
        {providers.length ? providers.map((item) => <Button key={item} variant={provider === item ? "default" : "outline"} size="sm" onClick={() => setProvider(item)}>{item === "TELEGRAM_STARS" ? "⭐ Telegram Stars" : "₮ USDT"}</Button>) : <span className="wallet-config-hint">{isMiniApp ? t("Для покупок в Telegram подключите Stars.") : t("Подключите Stars и Crypto Pay на сервере.")}</span>}
        {isMiniApp && <span className="wallet-stars-rule">{t("В Mini App доступны только Stars")}</span>}
      </div>
      {catalog.packages.length ? <div className="wallet-package-grid">{catalog.packages.map((item, index) => {
        const price = provider === "TELEGRAM_STARS" ? item.starsPrice : item.usdtPrice;
        const priceLabel = price ? (provider === "TELEGRAM_STARS" ? `${price} Stars` : `${price} USDT`) : t("Цена настраивается");
        return <Card className={`wallet-package-card ${index === 1 ? "wallet-package-card--featured" : ""}`} key={item.code}>
          {index === 1 && <span className="wallet-popular">{t("ПОПУЛЯРНЫЙ ВЫБОР")}</span>}
          <CardHeader><span className="wallet-package-coin"><img src={publicAsset("brand/nhacoin.png")} alt="" /></span><CardTitle>{t(item.title)}</CardTitle></CardHeader>
          <CardContent><strong className="wallet-package-amount">{item.coinAmount.toLocaleString(i18n.language)} <small>NHC</small></strong><p>{t(item.description)}</p><div className="wallet-package-price">{priceLabel}</div><Button className="wallet-buy-button" disabled={!price || !providers.includes(provider)} onClick={() => void buy(item.code)}>{busyKey === item.code ? <><LoaderCircle size={16} className="wallet-spin" />{t("Создаём платёж…")}</> : <>{t("Пополнить")} <ArrowUpRight size={15} /></>}</Button></CardContent>
        </Card>;
      })}</div> : <Card className="wallet-empty-catalog"><CardContent><CircleHelp size={20} /><div><b>{t("Тарифы готовятся")}</b><p>{t("Пакеты NhaCoin и цены появятся здесь после настройки в админ API.")}</p></div></CardContent></Card>}
      {catalog.packages.some((item) => !item.starsPrice || !item.usdtPrice) && <p className="wallet-pricing-note"><Clock3 size={14} />{t("Пакеты уже заведены; денежные цены требуется задать отдельно. Баланс не пополняется до подтверждённого платежа.")}</p>}
    </section>

    {loggedIn && meQuery.data?.listings.length ? <section className="wallet-spend-section">
      <div className="wallet-section-heading"><div><span className="wallet-eyebrow">{t("ИСПОЛЬЗОВАТЬ NHC")}</span><h2>{t("Продвигайте своё объявление")}</h2></div><span>{t("Списание с записью в журнале")}</span></div>
      <div className="wallet-owned-listings">{meQuery.data.listings.map((listing) => {
        const offers = meQuery.data?.offers ?? [];
        const selectedCode = selectedOffers[listing.id] ?? offers[0]?.code ?? "";
        const selected = offers.find((offer) => offer.code === selectedCode);
        return <Card className="wallet-owned-card" key={listing.id}><CardContent>
          <div className="wallet-owned-copy"><b>{listing.title}</b><small>{t(listing.category)}{listing.promotedUntil ? ` · ${t("в топе до")} ${formatDate(listing.promotedUntil, i18n.language)}` : ""}</small></div>
          {offers.length ? <><SelectField value={selectedCode} onValueChange={(value) => setSelectedOffers((current) => ({ ...current, [listing.id]: value }))} aria-label={t("Срок продвижения")} options={offers.map((offer) => ({ value: offer.code, label: `${offerLabel(offer, t)} · ${offer.title}` }))} /><Button disabled={!selected || balance < (selected?.coinCost ?? 0) || busyKey === listing.id} onClick={() => void promote(listing.id)}>{busyKey === listing.id ? t("Применяем…") : <>{t("Продвинуть")} · {selected?.coinCost ?? 0} NHC</>}</Button></> : <span className="wallet-config-hint">{t("Услуги появятся после настройки тарифов.")}</span>}
        </CardContent></Card>;
      })}</div>
    </section> : loggedIn && <section className="wallet-spend-section wallet-spend-empty"><div className="wallet-section-heading"><div><span className="wallet-eyebrow">{t("ИСПОЛЬЗОВАТЬ NHC")}</span><h2>{t("Продвигайте своё объявление")}</h2></div></div><Card><CardContent><Gift size={19} /><p>{t("Опубликованные вами объявления появятся здесь после модерации.")}</p><Link to="/marketplace">{t("Продать байк")} ↗</Link><Link to="/rentals">{t("Разместить аренду")} ↗</Link><Link to="/housing">{t("Сдать жильё")} ↗</Link></CardContent></Card></section>}

    {notice && <div className="wallet-notice" role="status"><Check size={16} />{t(notice)}</div>}

    <section className="wallet-history-section">
      <div className="wallet-section-heading"><div><span className="wallet-eyebrow">{t("ПОЛНАЯ ПРОЗРАЧНОСТЬ")}</span><h2><History size={21} />{t("История и чеки")}</h2></div><span>{t("Последние операции")}</span></div>
      {loggedIn && (meQuery.data?.orders.length ?? 0) > 0 && <div className="wallet-pending-orders"><h3><Clock3 size={15} />{t("Платежи ожидают завершения")}</h3>{meQuery.data!.orders.map((order) => <article key={order.id}><span><b>{order.coinAmount.toLocaleString(i18n.language)} NHC</b><small>{order.amount} {order.currency} · {formatDate(order.createdAt, i18n.language)}</small></span>{order.paymentUrl && (!isMiniApp || order.provider === "TELEGRAM_STARS") ? <Button size="sm" variant="outline" onClick={() => resumePayment(order)}>{t("Продолжить оплату")} ↗</Button> : order.provider === "CRYPTO_PAY" && <small>{t("Продолжите этот платёж в браузере")}</small>}</article>)}</div>}
      {loggedIn && meQuery.data?.transactions.length ? <div className="wallet-history-list">{meQuery.data.transactions.map((entry) => <article className="wallet-history-row" key={entry.id}>
        <span className={`wallet-history-icon wallet-history-icon--${entry.amount > 0 ? "plus" : "minus"}`}>{entry.amount > 0 ? "+" : "−"}</span><div className="wallet-history-copy"><b>{entry.description}</b><small>{formatDate(entry.createdAt, i18n.language)}{entry.receipt ? ` · ${entry.receipt.provider === "TELEGRAM_STARS" ? "Telegram Stars" : "Crypto Pay"}` : ""}</small></div><strong className={entry.amount > 0 ? "is-credit" : "is-debit"}>{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString(i18n.language)} NHC</strong>
        {entry.receipt && <details className="wallet-receipt"><summary>{t("Чек")}</summary><div><span>{t("Заказ")}</span><b>{entry.receipt.orderId}</b><span>{t("Оплачено")}</span><b>{entry.receipt.amount} {entry.receipt.currency}</b><span>{t("Статус")}</span><b>{t(entry.receipt.status)}</b>{entry.receipt.paidAt && <><span>{t("Дата оплаты")}</span><b>{formatDate(entry.receipt.paidAt, i18n.language)}</b></>}</div></details>}
      </article>)}</div> : <Card className="wallet-empty-history"><CardContent><History size={19} /><span>{loggedIn ? t("Здесь будут чеки пополнения и списания за услуги.") : t("После входа здесь появятся ваши чеки, операции и остатки после каждого списания.")}</span></CardContent></Card>}
    </section>

    <footer className="wallet-footer"><div><img src={publicAsset("brand/nhacoin.png")} alt="" /><span><b>NhaCoin</b><small>{t("Внутренний баланс SCOOT Nha Trang")}</small></span></div><Link to="/">{t("Вернуться в приложение")} ↗</Link><a href="https://t.me/horbachAI" target="_blank" rel="noreferrer">{t("Поддержка")} ↗</a></footer>
    {(loginBusy || meQuery.isFetching) && <span className="wallet-fetch-state" aria-hidden="true"><LoaderCircle className="wallet-spin" size={14} /></span>}
  </main>;
}
