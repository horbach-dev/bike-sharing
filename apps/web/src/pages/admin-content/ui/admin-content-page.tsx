import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiBase, type ListingCategory } from "@/shared/api/content";
import { Button, Card, CardContent, Checkbox, Input, Label, NativeSelect, Textarea } from "@/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { publicAsset } from "@/shared/lib/public-asset";
import "./admin-content.css";

type Tab = "stories" | "articles" | "listings" | "locations" | "partners" | "cashback";
type Row = { id: string; title: string; status?: string; published?: boolean; updatedAt?: string; posterUrl?: string; category?: string; district?: string | null; price?: number | string | null; currency?: string; description?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null; areaSqm?: number | null; bedrooms?: number | null; bathrooms?: number | null; contact?: string | null; imageUrls?: string[]; amenities?: string[] };
type LocationRow = { id: string; title: string; description: string; latitude: number; longitude: number; category: string };
const districtLabels: Record<string, string> = { north: "Север", center: "Центр", south: "Юг", outskirts: "Пригород" };
function formatListingPrice(price: Row["price"], currency = "VND") {
  if (price === null || price === undefined) return "Цена не указана";
  const code = currency.toUpperCase();
  if (!["VND", "USD", "RUB"].includes(code)) return `${Number(price).toLocaleString("ru-RU")} ${currency}`;
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: code, maximumFractionDigits: code === "VND" ? 0 : 2 }).format(Number(price));
}
const tabList: { id: Tab; label: string }[] = [
  { id: "stories", label: "Истории" }, { id: "articles", label: "Статьи" },
  { id: "listings", label: "Объявления" }, { id: "locations", label: "Локации на проверке" },
  { id: "partners", label: "Партнёры и курсы" }, { id: "cashback", label: "Кэшбэк" },
];

async function adminRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const response = await fetch(apiBase + path, {
    ...init,
    headers: { "x-admin-token": token, ...(isForm ? {} : { "content-type": "application/json" }), ...init?.headers },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function AdminContentPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("scoot-admin-token") ?? "");
  const [tab, setTab] = useState<Tab>("stories");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [listingDistrictFilter, setListingDistrictFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    sessionStorage.setItem("scoot-admin-token", token);
    let cancelled = false;
    const path = tab === "stories" ? "/admin/content/stories"
      : tab === "articles" ? "/admin/content/articles"
      : tab === "locations" ? "/admin/content/locations/pending"
      : tab === "listings" ? "/admin/content/listings" : "";
    if (!path) return;
    void adminRequest<unknown[]>(token, path).then((result) => {
      if (cancelled) return;
      if (tab === "locations") setLocations(result as LocationRow[]);
      else setRows(result as Row[]);
    }).catch((error) => { if (!cancelled) setNotice("Не удалось загрузить данные: " + (error as Error).message); });
    return () => { cancelled = true; };
  }, [token, tab]);

  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await adminRequest<{ url: string }>(token, "/admin/content/upload", { method: "POST", body: form });
      setImageUrls((existing) => [...existing, result.url]);
      setNotice("Фотография загружена.");
    } catch (error) { setNotice("Ошибка загрузки: " + (error as Error).message); }
    finally { setBusy(false); }
  }

  async function submitJson(event: FormEvent<HTMLFormElement>, path: string, transform?: (value: Record<string, FormDataEntryValue>) => Record<string, unknown>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    try {
      await adminRequest(token, path, { method: "POST", body: JSON.stringify(transform ? transform(values) : values) });
      form.reset();
      setImageUrls([]);
      setNotice("Изменения сохранены.");
      if (["stories", "articles", "listings"].includes(tab)) {
        const nextPath = tab === "stories" ? "/admin/content/stories" : tab === "articles" ? "/admin/content/articles" : "/admin/content/listings";
        const result = await adminRequest<Row[]>(token, nextPath);
        setRows(result);
      }
    } catch (error) { setNotice("Ошибка сохранения: " + (error as Error).message); }
    finally { setBusy(false); }
  }

  async function setStoryStatus(row: Row) {
    const status = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await adminRequest(token, "/admin/content/stories/" + row.id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
      setRows((items) => items.map((item) => item.id === row.id ? { ...item, status } : item));
      setNotice(status === "PUBLISHED" ? "История опубликована." : "История снята с публикации.");
    } catch (error) { setNotice("Ошибка изменения статуса: " + (error as Error).message); }
  }

  async function setListingPublished(row: Row) {
    const published = !row.published;
    try {
      await adminRequest(token, "/admin/content/listings/" + row.id + "/published", { method: "PATCH", body: JSON.stringify({ published }) });
      setRows((items) => items.map((item) => item.id === row.id ? { ...item, published } : item));
      setNotice(published ? "Объявление опубликовано." : "Объявление скрыто.");
    } catch (error) { setNotice("Ошибка изменения статуса: " + (error as Error).message); }
  }

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await adminRequest(token, "/admin/content/locations/" + id + "/review", { method: "PATCH", body: JSON.stringify({ status }) });
      setLocations((items) => items.filter((item) => item.id !== id));
      setNotice(status === "APPROVED" ? "Локация опубликована." : "Локация отклонена.");
    } catch (error) { setNotice("Ошибка модерации: " + (error as Error).message); }
  }

  function signOut() { sessionStorage.removeItem("scoot-admin-token"); setToken(""); setNotice(""); }

  return <main className="cms-shell">
    <header className="cms-top"><Link to="/" className="cms-back">← На главную</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><Link to="/admin" className="cms-back">Управление парком ↗</Link></header>
    <section className="cms-heading"><span className="service-eyebrow">АДМИН-ПАНЕЛЬ</span><h1>Публикации и каталоги</h1><p>Истории, гайды, объявления, партнёры и пользовательские точки.</p></section>
    <Card className="cms-token"><CardContent><Label>Токен админ API<Input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="ADMIN_API_TOKEN с сервера" /></Label><Button variant="ghost" onClick={signOut} disabled={!token}>Выйти</Button><small>Токен хранится в текущей вкладке. Все изменения проверяются сервером.</small></CardContent></Card>
    {notice && <p className="cms-notice" role="status">{notice}<Button variant="ghost" onClick={() => setNotice("")}>×</Button></p>}
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="cms-tab-system">
      <TabsList variant="line" className="cms-tabs w-full">{tabList.map((item) => <TabsTrigger key={item.id} value={item.id} className="cms-tab">{item.label}</TabsTrigger>)}</TabsList>
      <TabsContent value={tab} className="cms-tab-panel">
    {!token ? <div className="cms-empty"><span>⌑</span><b>Введите админский токен</b><small>На сервере должна быть задана переменная ADMIN_API_TOKEN.</small></div> : <>
      {tab === "stories" && <section className="cms-columns"><Card><CardContent><h2>Создать историю</h2><p className="cms-help">Постер, текст и необязательная внутренняя или внешняя ссылка.</p><form className="cms-form" onSubmit={(event) => void submitJson(event, "/admin/content/stories", (v) => ({ ...v, sortOrder: Number(v.sortOrder ?? 0) }))}><Label>Заголовок<Input name="title" required minLength={2} /></Label><Label>Постер URL<Input name="posterUrl" type="url" value={imageUrls[0] ?? ""} onChange={(event) => setImageUrls((urls) => [event.target.value, ...urls.slice(1)])} required /></Label><Label className="cms-upload">Загрузить постер<Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></Label><Label>Текст истории<Textarea name="text" required /></Label><Label>Описание<Input name="description" /></Label><div className="cms-inline"><Label>Подпись кнопки<Input name="linkLabel" placeholder="Подробнее" /></Label><Label>Ссылка<Input name="linkUrl" placeholder="/cashback или https://…" /></Label></div><div className="cms-inline"><Label>Порядок<Input name="sortOrder" type="number" defaultValue="0" /></Label><Label>Публикация<NativeSelect name="status"><option value="DRAFT">Черновик</option><option value="PUBLISHED">Опубликовать</option></NativeSelect></Label></div><Button disabled={busy}>Сохранить историю</Button></form></CardContent></Card><Card><CardContent><h2>Истории</h2>{rows.map((row) => <article className="cms-row" key={row.id}>{row.posterUrl && <img src={row.posterUrl} alt="" />}<span><b>{row.title}</b><small>{row.status} · {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("ru-RU") : ""}</small></span><Button variant="ghost" className="cms-row-action" onClick={() => void setStoryStatus(row)}>{row.status === "PUBLISHED" ? "Снять" : "Опубликовать"}</Button></article>)}{!rows.length && <p className="cms-help">Истории появятся после сохранения.</p>}</CardContent></Card></section>}
      {tab === "articles" && <Card><CardContent><h2>Добавить статью или гайд</h2><form className="cms-form cms-form--wide" onSubmit={(event) => void submitJson(event, "/admin/content/articles", (v) => ({ ...v, published: true, featured: v.featured === "on" }))}><div className="cms-inline"><Label>Заголовок<Input name="title" required /></Label><Label>Slug<Input name="slug" required pattern="[a-z0-9-]+" /></Label></div><Label>Краткое описание<Textarea name="excerpt" required /></Label><Label>Текст статьи<Textarea name="body" required /></Label><Label>Обложка URL<Input name="coverUrl" required type="url" value={imageUrls[0] ?? ""} onChange={(event) => setImageUrls((urls) => [event.target.value, ...urls.slice(1)])} /></Label><Label className="cms-upload">Загрузить обложку<Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></Label><Label className="cms-check"><Checkbox name="featured" value="on" />Показывать в топе</Label><Button disabled={busy}>Опубликовать статью</Button></form></CardContent></Card>}
      {tab === "listings" && <section className="cms-columns"><Card><CardContent><h2>Новое объявление</h2><form className="cms-form" onSubmit={(event) => void submitJson(event, "/admin/content/listings", (v) => ({ ...v, category: v.category as ListingCategory, district: v.category === "HOUSING_RENTAL" ? String(v.district || "center") : undefined, published: true, price: v.price ? Number(v.price) : undefined, areaSqm: v.areaSqm ? Number(v.areaSqm) : undefined, bedrooms: v.bedrooms ? Number(v.bedrooms) : undefined, bathrooms: v.bathrooms ? Number(v.bathrooms) : undefined, hasTv: v.hasTv === "on", hasFridge: v.hasFridge === "on", hasTables: v.hasTables === "on", amenities: String(v.amenities ?? "").split(",").map((x) => x.trim()).filter(Boolean), imageUrls }))}><Label>Тип<NativeSelect name="category"><option value="BIKE_RENTAL">Аренда байка</option><option value="BIKE_SALE">Продажа байка</option><option value="HOUSING_RENTAL">Аренда жилья</option></NativeSelect></Label><Label>Заголовок<Input name="title" required /></Label><Label>Описание<Textarea name="description" /></Label><div className="cms-inline"><Label>Цена<Input name="price" type="number" min="0" /></Label><Label>Валюта<NativeSelect name="currency" defaultValue="VND"><option value="VND">Донги · VND</option><option value="USD">Доллары · USD</option><option value="RUB">Рубли · RUB</option></NativeSelect></Label></div><Label>Контакт<Input name="contact" /></Label><Label>Адрес<Input name="address" /></Label><Label>Район жилья<NativeSelect name="district" defaultValue="center"><option value="north">Север</option><option value="center">Центр</option><option value="south">Юг</option><option value="outskirts">Пригород</option></NativeSelect></Label><div className="cms-inline"><Label>Площадь, м²<Input name="areaSqm" type="number" min="0" /></Label><Label>Спальни<Input name="bedrooms" type="number" min="0" /></Label><Label>Санузлы<Input name="bathrooms" type="number" min="0" /></Label></div><div className="cms-checks"><Label><Checkbox name="hasTv" value="on" />Телевизор</Label><Label><Checkbox name="hasFridge" value="on" />Холодильник</Label><Label><Checkbox name="hasTables" value="on" />Стол</Label></div><Label>Теги и удобства, через запятую<Input name="amenities" placeholder="Балкон, кондиционер, лифт" /></Label><Label>Фотографии<Input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { for (const file of Array.from(event.target.files ?? [])) void upload(file); }} /></Label>{imageUrls.length > 0 && <p className="cms-help">Загружено фотографий: {imageUrls.length}</p>}<Button disabled={busy}>Опубликовать</Button></form></CardContent></Card><Card><CardContent><div className="cms-listing-heading"><h2>Объявления</h2><NativeSelect value={listingDistrictFilter} onChange={(event) => setListingDistrictFilter(event.target.value)} aria-label="Фильтр объявлений по району"><option value="">Все районы</option><option value="north">Север</option><option value="center">Центр</option><option value="south">Юг</option><option value="outskirts">Пригород</option></NativeSelect></div>{rows.filter((row) => !listingDistrictFilter || row.district === listingDistrictFilter).map((row) => <article className="cms-listing-row" key={row.id}><span><b>{row.title}</b><small>{row.district ? districtLabels[row.district] + " · " : ""}{formatListingPrice(row.price, row.currency)} · {row.published ? "Опубликовано" : "На проверке"}</small></span><details className="cms-listing-details"><summary>{row.published ? "Детали" : "Проверить заявку"} · {row.imageUrls?.length ?? 0} фото</summary>{row.description && <p>{row.description}</p>}<small>{row.contact ? "Контакт: " + row.contact + " · " : ""}{row.address ?? "Адрес не указан"}{row.areaSqm != null ? ` · ${row.areaSqm} м²` : ""}{row.bedrooms != null ? ` · ${row.bedrooms} спальни` : ""}</small>{row.latitude != null && row.longitude != null && <a href={`https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer">Открыть точку на карте ↗</a>}<div className="cms-listing-photos">{row.imageUrls?.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Фото ${index + 1} · ${row.title}`} /></a>)}</div></details><Button variant="ghost" className="cms-row-action" onClick={() => void setListingPublished(row)}>{row.published ? "Скрыть" : "Опубликовать"}</Button></article>)}{!rows.filter((row) => !listingDistrictFilter || row.district === listingDistrictFilter).length && <p className="cms-help">Нет объявлений в выбранном районе.</p>}</CardContent></Card></section>}
      {tab === "locations" && <Card><CardContent><h2>Места на проверке</h2><p className="cms-help">После одобрения отметка попадёт в общую карту и раздел гайдов.</p>{locations.map((item) => <article className="cms-location" key={item.id}><div><b>{item.title}</b><small>{item.category} · {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</small><p>{item.description}</p></div><span><Button variant="ghost" onClick={() => void review(item.id, "APPROVED")}>Одобрить</Button><Button variant="ghost" onClick={() => void review(item.id, "REJECTED")}>Отклонить</Button></span></article>)}{!locations.length && <p className="cms-help">Новых точек нет.</p>}</CardContent></Card>}
      {tab === "cashback" && <Card><CardContent><h2>Настроить уровень кэшбэка</h2><p className="cms-help">Порог 100 поездок показывает 10% по текущему правилу. Промежуточные проценты остаются настраиваемыми до подтверждения сетки.</p><form className="cms-form cms-form--wide" onSubmit={(event) => void submitJson(event, "/admin/content/cashback-tiers", (v) => ({ minimumCompletedTrips: Number(v.minimumCompletedTrips), cashbackPercent: Number(v.cashbackPercent) }))}><div className="cms-inline"><Label>Завершённых поездок<Input name="minimumCompletedTrips" type="number" min="0" required /></Label><Label>Кэшбэк, %<Input name="cashbackPercent" type="number" min="0" max="100" step="0.1" required /></Label></div><Button disabled={busy}>Сохранить уровень</Button></form></CardContent></Card>}
      {tab === "partners" && <section className="cms-columns"><Card><CardContent><h2>Партнёр и ссылка</h2><form className="cms-form" onSubmit={(event) => void submitJson(event, "/admin/content/partners")}><Label>Название<Input name="name" required /></Label><Label>Slug<Input name="slug" required /></Label><Label>Сайт<Input name="websiteUrl" type="url" /></Label><Label>Партнёрская ссылка<Input name="affiliateUrl" type="url" /></Label><Label>Условия сотрудничества<Input name="commissionNote" /></Label><Button disabled={busy}>Сохранить партнёра</Button></form></CardContent></Card><Card><CardContent><h2>Проверенный курс</h2><form className="cms-form" onSubmit={(event) => void submitJson(event, "/admin/content/exchange-rates", (v) => ({ ...v, rate: Number(v.rate) }))}><Label>Slug партнёра<Input name="partnerSlug" required /></Label><div className="cms-inline"><Label>Из<Input name="baseCode" placeholder="USD" required /></Label><Label>В<Input name="quoteCode" placeholder="VND" required /></Label></div><Label>Курс<Input name="rate" type="number" min="0" step="0.000001" required /></Label><Label>Источник<Input name="sourceLabel" /></Label><Button disabled={busy}>Добавить курс</Button></form><p className="cms-help">Интеграцию Minyao подключим отдельно. Форма ведёт проверенные вручную курсы и партнёрские URL.</p></CardContent></Card></section>}
    </>}
      </TabsContent>
    </Tabs>
    <footer className="cms-footer">Scoot Nha Trang · CMS и модерация</footer>
  </main>;
}
