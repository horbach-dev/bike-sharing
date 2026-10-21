import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { contentApi, type Listing, type ListingCategory } from "@/shared/api/content";
import { publicAsset } from "@/shared/lib/public-asset";
import "./service-pages.css";

const sectionInfo: Record<string, { category: ListingCategory; title: string; eyebrow: string; intro: string; icon: string }> = {
  rentals: { category: "BIKE_RENTAL", title: "Аренда байков", eyebrow: "ГОРОДСКОЙ ПРОКАТ", intro: "Подберите скутер под маршрут и срок аренды.", icon: "🛵" },
  marketplace: { category: "BIKE_SALE", title: "Байки на продажу", eyebrow: "ОБЪЯВЛЕНИЯ ГОРОДА", intro: "Объявления владельцев и предложения партнёров.", icon: "✦" },
  housing: { category: "HOUSING_RENTAL", title: "Аренда жилья", eyebrow: "ЖИЗНЬ В НЯЧАНГЕ", intro: "Ищите жильё по району, цене и удобствам.", icon: "⌂" },
};

const sampleItems: Record<string, Listing[]> = {
  rentals: [
    { id: "sample-rent-1", category: "BIKE_RENTAL", title: "Honda Lead 125 · комфорт", description: "Автомат · два шлема · городская поездка", price: 180000, currency: "VND", imageUrls: [publicAsset("brand/tile-coast.png")] },
    { id: "sample-rent-2", category: "BIKE_RENTAL", title: "Yamaha Grande · лёгкий ход", description: "Экономичный скутер для центра и побережья", price: 220000, currency: "VND", imageUrls: [publicAsset("brand/tile-cafe.png")] },
  ],
  marketplace: [
    { id: "sample-sale-1", category: "BIKE_SALE", title: "Honda Lead 125 · 2019", description: "Пример объявления. Опубликованные предложения появятся здесь.", price: 26500000, currency: "VND", imageUrls: [publicAsset("brand/tile-bay.png")] },
  ],
  housing: [
    { id: "sample-home-1", category: "HOUSING_RENTAL", title: "Светлая студия у моря", description: "Демо-карточка каталога · добавьте фильтр по району и сроку.", price: 9000000, currency: "VND", address: "Чанфу · Нячанг", areaSqm: 42, bedrooms: 1, bathrooms: 1, hasTv: true, hasFridge: true, hasTables: true, amenities: ["Кондиционер", "Балкон"], imageUrls: [publicAsset("brand/nha-trang-scoot-promo.png")] },
    { id: "sample-home-2", category: "HOUSING_RENTAL", title: "Апартаменты с видом на город", description: "Демо-карточка · 2 комнаты, рядом кафе и магазины.", price: 14000000, currency: "VND", address: "Центр · Нячанг", areaSqm: 67, bedrooms: 2, bathrooms: 1, hasTv: true, hasFridge: true, hasTables: true, amenities: ["Лифт", "Балкон"], imageUrls: [publicAsset("brand/tile-cafe.png")] },
  ],
};

function priceText(price: Listing["price"], currency: string) {
  if (price === null || price === undefined) return "Цена по запросу";
  const amount = Number(price);
  return currency === "VND" ? amount.toLocaleString("ru-RU") + " ₫" : amount.toLocaleString("ru-RU") + " " + currency;
}

export function CatalogPage() {
  const { section = "rentals" } = useParams();
  const info = sectionInfo[section] ?? sectionInfo.rentals;
  const [search, setSearch] = useState("");
  const [onlyPromoted, setOnlyPromoted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ["listings", info.category, search],
    queryFn: ({ pageParam }) => contentApi.listings(info.category, pageParam, search || undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const fromApi = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = useMemo(() => {
    const list = fromApi.length ? fromApi : sampleItems[section] ?? [];
    return onlyPromoted ? list.filter((item) => Boolean(item.promotedUntil)) : list;
  }, [fromApi, section, onlyPromoted]);

  useEffect(() => {
    if (!sentinelRef.current || !query.hasNextPage || query.isFetchingNextPage) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void query.fetchNextPage(); }, { rootMargin: "180px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return <main className="service-shell">
    <header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header>
    <section className="service-hero"><span className="service-eyebrow">{info.eyebrow}</span><div className="service-hero-row"><div><h1>{info.title}</h1><p>{info.intro}</p></div><span className="service-hero-icon">{info.icon}</span></div></section>
    <div className="catalog-toolbar"><label className="catalog-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={section === "housing" ? "Район, название или удобство" : "Модель или название"} /></label><button className={"filter-chip " + (onlyPromoted ? "filter-chip--active" : "")} onClick={() => setOnlyPromoted((value) => !value)}>✦ В топе</button><select className="catalog-sort" aria-label="Сортировка"><option>Сначала новые</option><option>Сначала дешевле</option><option>Сначала дороже</option></select></div>
    <div className="catalog-meta"><span>{fromApi.length ? fromApi.length + " объявлений" : "Подборка · демонстрационные карточки"}</span><span>Нячанг, Вьетнам</span></div>
    {query.isError && <p className="service-inline-note">Подключение к API появится после настройки сервера. Пока показаны карточки-примеры.</p>}
    <section className={"listing-grid " + (section === "housing" ? "listing-grid--housing" : "")}>
      {items.map((item) => <article className="listing-card" key={item.id}>
        <div className="listing-photo"><img src={item.imageUrls?.[0] ?? publicAsset("brand/tile-coast.png")} alt="" loading="lazy" />{item.promotedUntil && <span className="listing-top-badge">В ТОПЕ</span>}<button className="listing-favorite" aria-label="Сохранить">♡</button></div>
        <div className="listing-body"><div className="listing-price">{priceText(item.price, item.currency)}{item.category === "BIKE_RENTAL" && <small>/ сутки</small>}</div><h2>{item.title}</h2><p>{item.description}</p>
          {section === "housing" && <div className="housing-specs"><span>{item.areaSqm ?? "—"} м²</span><span>{item.bedrooms ?? "—"} спальни</span><span>{item.bathrooms ?? "—"} санузел</span></div>}
          {section === "housing" && <div className="housing-amenities">{item.hasTv && <span>ТВ</span>}{item.hasFridge && <span>Холодильник</span>}{item.hasTables && <span>Стол</span>}{item.amenities?.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>}
          <div className="listing-foot"><span>{item.address ?? (section === "rentals" ? "Нячанг · автомат" : "Нячанг")}</span><button>Подробнее ↗</button></div>
        </div>
      </article>)}
    </section>
    {!items.length && !query.isLoading && <div className="empty-catalog"><span>✦</span><h2>Пока нет объявлений</h2><p>Здесь появятся проверенные предложения из каталога.</p></div>}
    <div ref={sentinelRef} className="catalog-sentinel" aria-live="polite">{query.isFetchingNextPage ? "Загружаем ещё…" : ""}</div>
    <footer className="service-footer"><Link to="/">Scoot Nha Trang</Link><Link to="/admin/content">Панель публикаций</Link><span>Клиент и Telegram Mini App</span></footer>
  </main>;
}
