import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { contentApi, type FleetBike } from "@/shared/api/content";
import { publicAsset } from "@/shared/lib/public-asset";
import { Button } from "@/shared/ui/button";
import { MapCanvas, type Scooter } from "@/pages/admin/ui/map-canvas";
import "./service-pages.css";
import "./other-pages.css";

const demoFleet: FleetBike[] = [
  { id: "demo-1", code: "NT-001", model: "Honda Lead 125", year: 2020, fuelPercent: 82, helmetCount: 2, hasRainwear: true, hasRemoteAccess: true, latitude: 12.2389, longitude: 109.1968, distanceKm: 0.4, walkingMinutes: 6, drivingMinutes: 2 },
  { id: "demo-2", code: "NT-003", model: "Honda Lead 125", year: 2018, fuelPercent: 68, helmetCount: 2, hasRainwear: false, hasRemoteAccess: true, latitude: 12.2418, longitude: 109.1878, distanceKm: 1.2, walkingMinutes: 16, drivingMinutes: 5 },
  { id: "demo-3", code: "NT-005", model: "Honda Lead 125", year: 2019, fuelPercent: 91, helmetCount: 1, hasRainwear: true, hasRemoteAccess: true, latitude: 12.2366, longitude: 109.1964, distanceKm: 0.7, walkingMinutes: 9, drivingMinutes: 3 },
];

function toMapScooters(bikes: FleetBike[]): Scooter[] {
  return bikes.map((bike) => ({
    id: bike.code,
    plate: "",
    model: bike.model,
    year: bike.year,
    status: "Стоит",
    location: "Нячанг · свободен",
    lat: bike.latitude,
    lng: bike.longitude,
    fuel: bike.fuelPercent ?? 0,
    gps: 100,
    idleMinutes: 0,
    note: bike.helmetCount + " шлема" + (bike.hasRainwear ? " · дождевик" : "") + (bike.hasRemoteAccess ? " · Smart Key" : ""),
  }));
}

export function SharingPage() {
  const [position, setPosition] = useState<{ lat: number; lng: number }>();
  const [selectedCode, setSelectedCode] = useState<string>();
  const [geoMessage, setGeoMessage] = useState("");
  const fleetQuery = useQuery({
    queryKey: ["fleet", position?.lat, position?.lng],
    queryFn: () => contentApi.fleet(position?.lat, position?.lng),
  });
  const bikes = fleetQuery.data?.length ? fleetQuery.data : fleetQuery.isError ? demoFleet : [];
  const selected = bikes.find((bike) => bike.code === selectedCode) ?? bikes[0];
  const mapScooters = toMapScooters(bikes);

  function locateMe() {
    if (!navigator.geolocation) { setGeoMessage("Браузер не поддерживает геолокацию."); return; }
    setGeoMessage("Запрашиваем разрешение на геопозицию…");
    navigator.geolocation.getCurrentPosition(
      (result) => { setPosition({ lat: result.coords.latitude, lng: result.coords.longitude }); setGeoMessage("Ближайшие точки рассчитаны относительно вас."); },
      () => setGeoMessage("Геолокация не разрешена. Можно посмотреть карту Нячанга."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const route = selected ? "https://www.google.com/maps/dir/?api=1&destination=" + selected.latitude + "," + selected.longitude + "&travelmode=walking" : undefined;
  return <main className="service-shell">
    <header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header>
    <section className="service-hero share-hero"><span className="service-eyebrow">ПОЕЗДКИ ПО ГОРОДУ</span><div className="service-hero-row"><div><h1>Свободные байки</h1><p>Найдите скутер рядом и проверьте оснащение до поездки.</p></div><span className="service-hero-icon">⌖</span></div></section>
    <div className="sharing-actions"><Button onClick={locateMe}>⌖ Показать рядом</Button><span>{geoMessage || "Геолокация запрашивается только по вашему нажатию"}</span></div>
    <div className="sharing-layout"><section><div className="sharing-map-wrap"><MapCanvas scooters={mapScooters} zones={[]} selectedId={selected?.code} onSelect={setSelectedCode} /></div><div className="map-legends"><span><i />Свободен · {bikes.length}</span><span>Нячанг · {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Google Maps" : "схема центра"}</span></div></section>
      <aside className="bike-detail-panel">{selected ? <><div className="bike-detail-head"><div><small>ДОСТУПЕН СЕЙЧАС</small><h2>{selected.model}</h2><span>{selected.code} · {selected.year}</span></div><b>🛵</b></div><div className="bike-detail-condition"><i /> Состояние проверено оператором</div><div className="bike-detail-stats"><div><small>ДО ВАС</small><b>{selected.distanceKm == null ? "—" : selected.distanceKm + " км"}</b></div><div><small>ПЕШКОМ</small><b>{selected.walkingMinutes == null ? "—" : selected.walkingMinutes + " мин"}</b></div><div><small>НА БАЙКЕ</small><b>{selected.drivingMinutes == null ? "—" : selected.drivingMinutes + " мин"}</b></div></div><div className="bike-equipment"><span>⛑ Шлемы · {selected.helmetCount}</span><span>{selected.hasRainwear ? "☂ Дождевик есть" : "Дождевик не отмечен"}</span><span>{selected.hasRemoteAccess ? "⌑ Smart Key" : "Удалённый доступ уточняется"}</span></div>{selected.fuelPercent != null && <div className="fuel-meter"><span>Топливо <b>{selected.fuelPercent}%</b></span><i><em style={{ width: selected.fuelPercent + "%" }} /></i></div>}{route && <a className="bike-route-link" href={route} target="_blank" rel="noreferrer">Построить пеший маршрут ↗</a>}<p className="bike-demo-note">Показатели топливо, состояние и доступ будут поступать от парка и телематики.</p></> : <div className="bike-empty"><span>⌖</span><h2>{fleetQuery.isLoading ? "Ищем свободные байки" : "Пока нет свободных байков"}</h2><p>Свободные точки появятся здесь после подключения парка.</p></div>}</aside>
    </div>
    <section className="fleet-list"><div className="home-section-heading"><div><span className="service-eyebrow">ПАРК РЯДОМ</span><h2>Выберите байк</h2></div><span>{bikes.length} доступно</span></div>{bikes.map((bike) => <button key={bike.id} className={"fleet-bike-row " + (selected?.id === bike.id ? "fleet-bike-row--active" : "")} onClick={() => setSelectedCode(bike.code)}><span>🛵</span><b>{bike.code}</b><span>{bike.model}</span><small>{bike.walkingMinutes == null ? "Нячанг" : bike.walkingMinutes + " мин пешком"}</small><i>↗</i></button>)}</section>
  </main>;
}

const milestones = [10, 20, 30, 40, 50, 85, 100];

export function CashbackPage() {
  const { data: tiers = [] } = useQuery({ queryKey: ["cashback-tiers"], queryFn: () => contentApi.cashbackTiers().catch(() => []) });
  const rates = new Map(tiers.map((tier) => [tier.minimumCompletedTrips, Number(tier.cashbackPercent)]));
  return <main className="service-shell"><header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header>
    <section className="vip-hero"><span>✦ ПРОГРАММА ЛОЯЛЬНОСТИ</span><h1>Каждая поездка<br /><em>приближает к VIP.</em></h1><p>Счётчик поездок и персональные условия будут связаны с подтверждённым аккаунтом.</p><div className="vip-counter"><div><small>ВАШИ ПОЕЗДКИ</small><b>0 <i>/ 100</i></b></div><span className="vip-progress"><i /></span><strong>до VIP</strong></div></section>
    <section className="vip-levels"><div className="home-section-heading"><div><span className="service-eyebrow">ВАШ ПУТЬ</span><h2>Уровни программы</h2></div><span>Только завершённые поездки</span></div><div className="milestone-grid">{milestones.map((count, index) => <article className={"milestone " + (count === 100 ? "milestone--vip" : "")} key={count}><span>{index === milestones.length - 1 ? "✦" : "0" + (index + 1)}</span><b>{count}</b><small>поездок</small><strong>{rates.has(count) ? rates.get(count) + "% кэшбэк" : count === 100 ? "10% кэшбэк" : "уровень"}</strong></article>)}</div><p className="vip-note">Уровень 100 поездок предусматривает 10% кэшбэка за поездку. Значения промежуточных уровней настраиваются в админке.</p></section>
    <div className="vip-info-card"><span>☀</span><div><b>Главная открыта всем пользователям</b><p>Карту и предложения можно посмотреть до входа. История поездок появится после авторизации и привязки Telegram-аккаунта.</p></div></div>
  </main>;
}

const guideTitles = [
  ["first-ride", "Первая поездка на байке в Нячанге", "Что проверить перед стартом и как выбрать спокойный маршрут."],
  ["rent-checklist", "Как выбрать байк в аренду", "Состояние, документы и условия возврата."],
  ["city-routes", "Три идеи для городского маршрута", "Побережье, центр и обзорные остановки."],
  ["helmet-fit", "Как подобрать шлем", "Размер, фиксация и комфортная посадка."],
  ["long-rental", "Аренда на неделю: что уточнить", "Залог, обслуживание и поддержка."],
];

export function GuidesPage() {
  return <main className="service-shell"><header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header><section className="service-hero"><span className="service-eyebrow">ЛОКАЛЬНЫЙ ПУТЕВОДИТЕЛЬ</span><div className="service-hero-row"><div><h1>Гайды Нячанга</h1><p>Практичные заметки для поездок и жизни в городе.</p></div><span className="service-hero-icon">✦</span></div></section><section className="guide-grid">{guideTitles.map(([slug, title, excerpt], index) => <Link className="guide-card" to={"/guides/" + slug} key={slug}><img src={publicAsset("brand/" + (index % 2 ? "tile-cafe.png" : "tile-coast.png"))} alt="" /><span><small>ГАЙД · НЯЧАНГ</small><b>{title}</b><i>{excerpt}</i><em>Читать ↗</em></span></Link>)}</section></main>;
}

export function GuideDetailPage() {
  const { slug = "" } = useParams();
  const guide = guideTitles.find((item) => item[0] === slug);
  return <main className="service-shell"><header className="service-top"><Link className="service-back" to="/guides">← Все гайды</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header><article className="guide-detail"><span className="service-eyebrow">ПУТЕВОДИТЕЛЬ · НЯЧАНГ</span><h1>{guide?.[1] ?? "Гайд готовится к публикации"}</h1><p className="guide-lead">{guide?.[2] ?? "Публикации появятся после подготовки редакцией."}</p><img src={publicAsset("brand/tile-bay.png")} alt="Нячанг и побережье" /><p>Перед поездкой заранее проверьте условия аренды, документы, состояние байка и доступность поддержки. Для первой поездки выбирайте знакомый маршрут и оставьте время на адаптацию к городскому движению.</p><p>Редакционные статьи будут публиковаться через панель управления Scoot Nha Trang.</p></article></main>;
}

export function PlacesPage() {
  const [point, setPoint] = useState({ lat: 12.2389, lng: 109.1968 });
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("place");
  const mutation = useMutation({
    mutationFn: contentApi.submitLocation,
    onSuccess: () => { setStatus("Место отправлено на проверку. Спасибо, что делитесь Нячангом!"); setTitle(""); setDescription(""); },
    onError: () => setStatus("Сервер пока не подключён. Точка сохранится после запуска API."),
  });
  function setByClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setPoint({ lat: +(12.253 - y * (12.253 - 12.222)).toFixed(5), lng: +(109.177 + x * (109.216 - 109.177)).toFixed(5) });
  }
  return <main className="service-shell"><header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header><section className="service-hero"><span className="service-eyebrow">КАРТА ГОРОДСКИХ МЕСТ</span><div className="service-hero-row"><div><h1>Поделитесь локацией</h1><p>Точки появятся на общей карте после проверки.</p></div><span className="service-hero-icon">⌖</span></div></section><div className="place-submit-layout"><section><div className="place-map-pick" onClick={setByClick} role="button" tabIndex={0} aria-label="Выбрать точку на схеме"><div className="user-map-water"><span>ВОСТОЧНОЕ МОРЕ</span></div><div className="user-map-roadline road-a" /><div className="user-map-roadline road-c" /><span className="map-neighborhood area-one">TRẦN PHÚ</span><span className="map-neighborhood area-two">XÓM MỚI</span><i className="selected-place-pin" style={{ left: ((point.lng - 109.177) / (109.216 - 109.177)) * 100 + "%", top: ((12.253 - point.lat) / (12.253 - 12.222)) * 100 + "%" }}>⌖</i><span className="place-map-hint">Нажмите на схему, чтобы поставить отметку</span></div><small className="place-coordinates">{point.lat}, {point.lng}</small></section><form className="place-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ title, description, latitude: point.lat, longitude: point.lng, category }); }}><label>Название места<input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} placeholder="Например, видовая площадка" /></label><label>Категория<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="place">Интересное место</option><option value="food">Кафе или ресторан</option><option value="service">Полезный сервис</option><option value="view">Видовая точка</option></select></label><label>Что стоит знать<textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={10} placeholder="Опишите, почему сюда стоит заглянуть." /></label><Button disabled={mutation.isPending}>{mutation.isPending ? "Отправляем…" : "Отправить на проверку ↗"}</Button>{status && <p className="place-status">{status}</p>}<small>Точка попадёт в очередь админки. После одобрения появится в гайдах.</small></form></div></main>;
}

export function PartnersPage() {
  return <main className="service-shell"><header className="service-top"><Link className="service-back" to="/">← Главная</Link><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span /></header><section className="service-hero"><span className="service-eyebrow">ПАРТНЁРЫ SCOOT</span><div className="service-hero-row"><div><h1>Полезные сервисы города</h1><p>Справочная информация и специальные предложения партнёров.</p></div><span className="service-hero-icon">☀</span></div></section><div className="partner-card"><span>₫</span><div><small>КУРС ВАЛЮТ</small><h2>Minyao</h2><p>Добавим курсы, партнёрскую ссылку и размещение предложения после настройки интеграции.</p></div><b>Скоро</b></div></main>;
}
