import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { contentApi, type Listing, type ListingCategory } from "@/shared/api/content";
import { Button } from "@/shared/ui";
import { ListingSubmissionForm } from "./listing-submission-form";
import { publicAsset } from "@/shared/lib/public-asset";
import { ServiceHeader } from "@/shared/ui/service-header";
import "./service-pages.css";

const sectionInfo: Record<string, { category: ListingCategory; title: string; eyebrow: string; intro: string; icon: string }> = {
  rentals: { category: "BIKE_RENTAL", title: "Аренда байков", eyebrow: "ГОРОДСКОЙ ПРОКАТ", intro: "Подберите скутер под маршрут и срок аренды.", icon: "🛵" },
  marketplace: { category: "BIKE_SALE", title: "Байки на продажу", eyebrow: "ОБЪЯВЛЕНИЯ ГОРОДА", intro: "Объявления владельцев и предложения партнёров.", icon: "✦" },
  housing: { category: "HOUSING_RENTAL", title: "Аренда жилья", eyebrow: "ЖИЗНЬ В НЯЧАНГЕ", intro: "Ищите жильё по району, цене и удобствам.", icon: "⌂" },
};

const sampleItems: Record<string, Listing[]> = {
  rentals: [
    { id: "sample-rent-vision", category: "BIKE_RENTAL", title: "Honda Vision 110", description: "Демо-предложение · лёгкий городской скутер", price: 120000, currency: "VND", imageUrls: [publicAsset("brand/tile-coast.png")] },
    { id: "sample-rent-lead", category: "BIKE_RENTAL", title: "Honda Lead 125", description: "Демо-предложение · практичный скутер с багажником", price: 180000, currency: "VND", imageUrls: [publicAsset("brand/tile-cafe.png")] },
    { id: "sample-rent-airblade", category: "BIKE_RENTAL", title: "Honda Air Blade 125", description: "Демо-предложение · городской скутер", price: 180000, currency: "VND", imageUrls: [publicAsset("brand/tile-bay.png")] },
    { id: "sample-rent-janus", category: "BIKE_RENTAL", title: "Yamaha Janus 125", description: "Демо-предложение · компактный автоматический скутер", price: 150000, currency: "VND", imageUrls: [publicAsset("brand/tile-cafe.png")] },
    { id: "sample-rent-vario", category: "BIKE_RENTAL", title: "Honda Vario 125", description: "Демо-предложение · скутер для поездок по городу", price: 200000, currency: "VND", imageUrls: [publicAsset("brand/tile-coast.png")] },
    { id: "sample-rent-shmode", category: "BIKE_RENTAL", title: "Honda SH Mode 125", description: "Демо-предложение · комфорт-класс", price: 200000, currency: "VND", imageUrls: [publicAsset("brand/tile-bay.png")] },
  ],
  marketplace: [
    { id: "sample-sale-1", category: "BIKE_SALE", title: "Honda Lead 125 · 2019", description: "Пример объявления. Опубликованные предложения появятся здесь.", price: 26500000, currency: "VND", imageUrls: [publicAsset("brand/tile-bay.png")] },
  ],
  housing: [
    { id: "sample-home-1", category: "HOUSING_RENTAL", district: "center", title: "Светлая студия у моря", description: "Демо-карточка каталога · кондиционер и балкон.", price: 9000000, currency: "VND", address: "Чанфу · Нячанг", areaSqm: 42, bedrooms: 1, bathrooms: 1, hasTv: true, hasFridge: true, hasTables: true, amenities: ["Кондиционер", "Балкон"], imageUrls: [publicAsset("brand/nha-trang-scoot-promo.png")] },
    { id: "sample-home-2", category: "HOUSING_RENTAL", district: "center", title: "Апартаменты с видом на город", description: "Демо-карточка · 2 комнаты, рядом кафе и магазины.", price: 14000000, currency: "VND", address: "Центр · Нячанг", areaSqm: 67, bedrooms: 2, bathrooms: 1, hasTv: true, hasFridge: true, hasTables: true, amenities: ["Лифт", "Балкон"], imageUrls: [publicAsset("brand/tile-cafe.png")] },
    { id: "sample-home-3", category: "HOUSING_RENTAL", district: "north", title: "Апартаменты у северного пляжа", description: "Демо-карточка · кухня, кондиционер, рядом набережная.", price: 11000000, currency: "VND", address: "Север · Нячанг", areaSqm: 58, bedrooms: 2, bathrooms: 1, hasTv: true, hasFridge: true, amenities: ["Кухня", "Кондиционер"], imageUrls: [publicAsset("brand/tile-bay.png")] },
    { id: "sample-home-4", category: "HOUSING_RENTAL", district: "south", title: "Квартира в южной части города", description: "Демо-карточка · тихий квартал и балкон.", price: 8000000, currency: "VND", address: "Юг · Нячанг", areaSqm: 45, bedrooms: 1, bathrooms: 1, hasFridge: true, amenities: ["Балкон", "Тихий район"], imageUrls: [publicAsset("brand/tile-coast.png")] },
    { id: "sample-home-5", category: "HOUSING_RENTAL", district: "outskirts", title: "Дом рядом с зелёной зоной", description: "Демо-карточка · больше пространства и спокойная улица.", price: 16000000, currency: "VND", address: "Пригород · Нячанг", areaSqm: 86, bedrooms: 3, bathrooms: 2, hasTv: true, hasFridge: true, hasTables: true, amenities: ["Терраса", "Парковка"], imageUrls: [publicAsset("brand/nha-trang-scoot-promo.png")] },
  ],
};

const popularScooters = [
  { model: "Honda Vision 110", note: "Лёгкий городской" },
  { model: "Honda Lead 125", note: "Практичный и вместительный" },
  { model: "Honda Air Blade 125", note: "Популярный городской автомат" },
  { model: "Yamaha Janus 125", note: "Манёвренный скутер" },
  { model: "Honda Vario 125", note: "Для поездок по городу" },
  { model: "Honda SH Mode 125", note: "Комфорт-класс" },
];

const housingDistricts = [
  { id: "north", label: "Север", caption: "Пляж и северная часть" },
  { id: "center", label: "Центр", caption: "Променад и центр города" },
  { id: "south", label: "Юг", caption: "Южные кварталы" },
  { id: "outskirts", label: "Пригород", caption: "Зелёные районы вокруг" },
] as const;
type HousingDistrict = (typeof housingDistricts)[number]["id"];
type HousingDistrictCounts = Record<HousingDistrict, number>;

function HousingDistrictMap({ selected, counts, onChange }: { selected: HousingDistrict | ""; counts: HousingDistrictCounts; onChange: (district: HousingDistrict | "") => void }) {
  const total = housingDistricts.reduce((sum, district) => sum + counts[district.id], 0);
  function choose(district: HousingDistrict) { onChange(selected === district ? "" : district); }
  function districtShape(district: HousingDistrict, label: string, x: number, y: number) {
    const active = selected === district;
    return <g className={"housing-map-zone " + (active ? "is-active" : "")} role="button" tabIndex={0} aria-pressed={active} aria-label={`${label}: ${counts[district]} объектов`} onClick={() => onChange(district)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChange(district); } }}>
      <path d={district === "outskirts" ? "M82 57 247 39 247 280 96 274 51 211 47 134Z" : district === "north" ? "M247 39 441 29Q498 28 542 66L520 118 247 116Z" : district === "center" ? "M247 116 520 118 548 170 510 224 247 213Z" : "M247 213 510 224 522 280Q501 300 468 310L247 280Z"} />
      <circle className="housing-map-count" cx={x} cy={y} r="19" /><text className="housing-map-count-text" x={x} y={y + 4}>{counts[district]}</text>
      <text className="housing-map-label" x={x} y={y + 36}>{label}</text>
    </g>;
  }
  return <section className="housing-map-panel" aria-label="Выбор района жилья">
    <div className="housing-map-heading"><div><span className="service-eyebrow">КАРТА ЖИЛЬЯ</span><h2>Выберите район</h2><p>Нажмите на зону карты — каталог покажет объявления только в ней.</p></div><strong>{total}<small> объектов</small></strong></div>
    <div className="housing-map-layout">
      <div className="housing-map-frame">
        <svg className="housing-district-map" viewBox="0 0 620 340" role="group" aria-label="Схематичная карта районов Нячанга">
          <rect className="housing-map-water" x="0" y="0" width="620" height="340" rx="20" />
          <path className="housing-map-land" d="M82 57 247 39 441 29Q498 28 542 66L564 104 568 157 548 207 522 280Q501 300 468 310L247 280 96 274 51 211 47 134Z" />
          {districtShape("outskirts", "Пригород", 155, 174)}
          {districtShape("north", "Север", 393, 76)}
          {districtShape("center", "Центр", 409, 168)}
          {districtShape("south", "Юг", 398, 260)}
          <g className="housing-map-streets" aria-hidden="true"><path d="M91 102 204 125 318 130 500 93M72 158 184 162 273 166 540 151M84 219 204 205 301 221 509 201M133 71 155 267M221 53 222 273M313 47 309 282M416 42 418 292M482 56 473 278" /></g>
          <path className="housing-map-coast" d="M548 64Q577 87 575 119T566 178Q573 212 548 244T521 292" />
          <text className="housing-map-sea-label" x="566" y="165" transform="rotate(90 566 165)">МОРЕ</text>
          <path className="housing-map-river" d="M278 38Q290 74 278 106T294 159Q309 184 290 213T300 280" />
        </svg>
        <div className="housing-map-foot"><span><i />Схема районов Нячанга</span><span>Выберите область на карте</span></div>
      </div>
      <div className="housing-district-list">
        <button type="button" className={"housing-district-all " + (!selected ? "is-active" : "")} onClick={() => onChange("")} aria-pressed={!selected}><span><b>Весь Нячанг</b><small>Показать все районы</small></span><strong>{total}</strong></button>
        {housingDistricts.map((district) => <button type="button" key={district.id} className={"housing-district-option " + (selected === district.id ? "is-active" : "")} onClick={() => choose(district.id)} aria-pressed={selected === district.id}><span><b>{district.label}</b><small>{district.caption}</small></span><strong>{counts[district.id]}</strong></button>)}
      </div>
    </div>
  </section>;
}

function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const gallery = images.length ? images : [publicAsset("brand/tile-coast.png")];
  function move(delta: number) {
    setIndex((current) => (current + delta + gallery.length) % gallery.length);
  }
  return <>
    <img src={gallery[index % gallery.length]} alt={title} loading="lazy" />
    {gallery.length > 1 && <><button type="button" className="gallery-control gallery-control--left" aria-label="Предыдущее фото" onClick={() => move(-1)}>‹</button><button type="button" className="gallery-control gallery-control--right" aria-label="Следующее фото" onClick={() => move(1)}>›</button><span className="gallery-count">{index + 1} / {gallery.length}</span></>}
  </>;
}

function priceText(price: Listing["price"], currency: string) {
  if (price === null || price === undefined) return "Цена по запросу";
  const amount = Number(price);
  const normalized = currency.toUpperCase();
  if (["VND", "USD", "RUB"].includes(normalized)) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: normalized === "VND" ? 0 : 2,
    }).format(amount);
  }
  return amount.toLocaleString("ru-RU") + " " + currency;
}

export function CatalogPage() {
  const { section = "rentals" } = useParams();
  const info = sectionInfo[section] ?? sectionInfo.rentals;
  const [search, setSearch] = useState("");
  const [onlyPromoted, setOnlyPromoted] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [minArea, setMinArea] = useState("");
  const [amenity, setAmenity] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [district, setDistrict] = useState<HousingDistrict | "">("");
  const [sortMode, setSortMode] = useState("new");
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const activeDistrict = section === "housing" ? district : "";
  const sentinelRef = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ["listings", info.category, search, minPrice, maxPrice, currencyFilter, minArea, amenity, bedrooms, activeDistrict, onlyPromoted, sortMode],
    queryFn: ({ pageParam }) => contentApi.listings(info.category, pageParam, { search: search || undefined, minPrice: currencyFilter ? minPrice || undefined : undefined, maxPrice: currencyFilter ? maxPrice || undefined : undefined, currency: currencyFilter || undefined, minArea: minArea || undefined, amenity: amenity || undefined, bedrooms: bedrooms || undefined, district: activeDistrict || undefined, promotedOnly: onlyPromoted, sort: sortMode as "new" | "price-asc" | "price-desc" }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const fromApi = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = useMemo(() => {
    const list = query.isError ? sampleItems[section] ?? [] : fromApi;
    let filtered = onlyPromoted ? list.filter((item) => Boolean(item.promotedUntil)) : list;
    if (currencyFilter) filtered = filtered.filter((item) => item.currency === currencyFilter);
    if (currencyFilter && minPrice) filtered = filtered.filter((item) => Number(item.price ?? 0) >= Number(minPrice));
    if (currencyFilter && maxPrice) filtered = filtered.filter((item) => Number(item.price ?? 0) <= Number(maxPrice));
    if (minArea) filtered = filtered.filter((item) => Number(item.areaSqm ?? 0) >= Number(minArea));
    if (amenity) filtered = filtered.filter((item) => item.amenities?.some((tag) => tag.toLowerCase().includes(amenity.toLowerCase())));
    if (section === "housing" && bedrooms) filtered = filtered.filter((item) => item.bedrooms === Number(bedrooms));
    if (section === "housing" && activeDistrict) filtered = filtered.filter((item) => item.district === activeDistrict);
    if (sortMode === "price-asc") filtered = [...filtered].sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity));
    if (sortMode === "price-desc") filtered = [...filtered].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return filtered;
  }, [fromApi, query.isError, section, onlyPromoted, minPrice, maxPrice, currencyFilter, minArea, amenity, bedrooms, activeDistrict, sortMode]);

  const housingDistrictCounts = useMemo(() => {
    const serverCounts = query.data?.pages[0]?.districtCounts;
    if (!query.isError && serverCounts) {
      return Object.fromEntries(housingDistricts.map(({ id }) => [id, serverCounts[id] ?? 0])) as HousingDistrictCounts;
    }
    const source = query.isError ? sampleItems.housing : fromApi;
    return Object.fromEntries(housingDistricts.map(({ id }) => [id, source.filter((item) => item.district === id).length])) as HousingDistrictCounts;
  }, [query.data, query.isError, fromApi]);

  useEffect(() => {
    if (!sentinelRef.current || !query.hasNextPage || query.isFetchingNextPage) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void query.fetchNextPage(); }, { rootMargin: "180px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return <main className="service-shell">
    <ServiceHeader />
    <section className="service-hero"><span className="service-eyebrow">{info.eyebrow}</span><div className="service-hero-row"><div><h1>{info.title}</h1><p>{info.intro}</p></div><span className="service-hero-icon">{info.icon}</span></div></section>
    <section className="listing-submit-cta"><div><b>{section === "housing" ? "Сдаёте жильё?" : "Есть байк для каталога?"}</b><span>{section === "housing" ? "Добавьте апартаменты с фото и точкой на карте." : "Предложите байк в аренду или на продажу."}</span></div><Button type="button" onClick={() => setSubmissionOpen((open) => !open)}>{submissionOpen ? "Закрыть форму" : section === "housing" ? "Разместить жильё" : "Разместить объявление"}</Button></section>
    {submissionOpen && <ListingSubmissionForm key={info.category} category={info.category} onClose={() => setSubmissionOpen(false)} />}
    {section === "housing" && <HousingDistrictMap selected={activeDistrict} counts={housingDistrictCounts} onChange={setDistrict} />}
    {section === "rentals" && <section className="popular-scooters"><div className="popular-scooters-heading"><div><span className="service-eyebrow">ПАРК НЯЧАНГА</span><h2>Популярные скутеры</h2><p>Выберите модель, чтобы отфильтровать предложения аренды. Наличие смотрите в карточках.</p></div><span className="popular-scooter-mark">✦</span></div><div className="popular-scooter-grid">{popularScooters.map((scooter) => <button type="button" key={scooter.model} className={"popular-scooter " + (search === scooter.model ? "is-active" : "")} aria-pressed={search === scooter.model} onClick={() => setSearch(search === scooter.model ? "" : scooter.model)}><span className="popular-scooter-icon">🛵</span><span className="popular-scooter-copy"><small>{scooter.model.split(" ")[0]}</small><b>{scooter.model.replace(scooter.model.split(" ")[0] + " ", "")}</b><i>{scooter.note}</i></span><span className="popular-scooter-arrow">↗</span></button>)}</div></section>}
    <div className="catalog-toolbar"><label className="catalog-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={section === "housing" ? "Район, название или удобство" : "Модель или название"} /></label><input className="catalog-price" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min="0" disabled={!currencyFilter} placeholder="Цена от" aria-label={`Минимальная цена${currencyFilter ? ` в ${currencyFilter}` : "; сначала выберите валюту"}`} /><input className="catalog-price" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" disabled={!currencyFilter} placeholder="Цена до" aria-label={`Максимальная цена${currencyFilter ? ` в ${currencyFilter}` : "; сначала выберите валюту"}`} /><select className="catalog-sort" value={currencyFilter} onChange={(event) => { setCurrencyFilter(event.target.value); setMinPrice(""); setMaxPrice(""); if (!event.target.value && sortMode !== "new") setSortMode("new"); }} aria-label="Валюта цен"><option value="">Все валюты</option><option value="VND">Донги · ₫</option><option value="USD">Доллары · $</option><option value="RUB">Рубли · ₽</option></select>{section === "housing" && <><input className="catalog-price" value={minArea} onChange={(event) => setMinArea(event.target.value)} type="number" min="0" placeholder="От м²" aria-label="Минимальная площадь" /><input className="catalog-price" value={amenity} onChange={(event) => setAmenity(event.target.value)} placeholder="Удобство" aria-label="Удобство" /><select className="catalog-sort" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} aria-label="Количество спален"><option value="">Спальни</option><option value="1">1 спальня</option><option value="2">2 спальни</option><option value="3">3+ спальни</option></select></>}<button className={"filter-chip " + (onlyPromoted ? "filter-chip--active" : "")} onClick={() => setOnlyPromoted((value) => !value)}>✦ В топе</button><select className="catalog-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value)} aria-label="Сортировка"><option value="new">Сначала новые</option><option value="price-asc" disabled={!currencyFilter}>Сначала дешевле</option><option value="price-desc" disabled={!currencyFilter}>Сначала дороже</option></select></div>
    <div className="catalog-meta"><span>{query.isError ? "Подборка · демонстрационные карточки" : fromApi.length + " объявлений"}</span><span>Нячанг, Вьетнам</span></div>
    {query.isError && <p className="service-inline-note">Подключение к API появится после настройки сервера. Пока показаны карточки-примеры.</p>}
    <section className={"listing-grid " + (section === "housing" ? "listing-grid--housing" : "")}>
      {items.map((item) => <article className="listing-card" key={item.id}>
        <div className="listing-photo"><ListingGallery images={item.imageUrls ?? []} title={item.title} />{item.promotedUntil && <span className="listing-top-badge">В ТОПЕ</span>}<button className="listing-favorite" aria-label="Сохранить">♡</button></div>
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
