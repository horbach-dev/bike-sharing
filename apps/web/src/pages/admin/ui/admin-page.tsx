import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { MapCanvas, type GeoPoint, type ParkingZone, type Scooter, type ScooterStatus } from "./map-canvas";
import { publicAsset } from "@/shared/lib/public-asset";

type Section = "overview" | "fleet" | "map";
type TripStatus = "Завершена" | "В поездке" | "Отклонена";
type Trip = { id: string; scooterId: string; started: string; distance: number; status: TripStatus; note?: string };

const demoScooters: Scooter[] = [
  { id: "NT-001", plate: "79-N1 238.41", model: "Honda Lead 125", year: 2020, status: "Стоит", location: "Пляж Чанфу · Ariyana", lat: 12.2389, lng: 109.1968, fuel: 82, gps: 98, idleMinutes: 18, note: "Два шлема · Smart Key" },
  { id: "NT-002", plate: "79-N1 415.26", model: "Honda Lead 125", year: 2018, status: "В поездке", location: "Набережная Чанфу", lat: 12.2378, lng: 109.1943, fuel: 56, gps: 93, idleMinutes: 0, note: "Поездка TR-2414 · 24 мин" },
  { id: "NT-003", plate: "79-N1 672.09", model: "Honda Lead 125", year: 2016, status: "Стоит", location: "Рынок Xóm Mới", lat: 12.2418, lng: 109.1878, fuel: 68, gps: 87, idleMinutes: 64, note: "Два шлема" },
  { id: "NT-004", plate: "79-N1 083.77", model: "Honda Lead 125", year: 2014, status: "Сервис", location: "Сервис · Nguyễn Thiện Thuật", lat: 12.2358, lng: 109.1891, fuel: 24, gps: 42, idleMinutes: 0, note: "Плановое ТО" },
  { id: "NT-005", plate: "79-N1 904.35", model: "Honda Lead 125", year: 2019, status: "Стоит", location: "Башня Trầm Hương", lat: 12.2366, lng: 109.1964, fuel: 91, gps: 100, idleMinutes: 12, note: "Два шлема · Smart Key" },
  { id: "NT-006", plate: "79-N1 510.62", model: "Honda Lead 125", year: 2012, status: "В поездке", location: "Ж/д вокзал → пляж", lat: 12.2451, lng: 109.1912, fuel: 73, gps: 76, idleMinutes: 0, note: "Поездка TR-2417 · 9 мин" },
];

const demoZones: ParkingZone[] = [{
  id: "ZONE-01", name: "Площадь 2 апреля · запрет парковки", active: true,
  points: [{ lat: 12.2393, lng: 109.1921 }, { lat: 12.2393, lng: 109.1950 }, { lat: 12.2367, lng: 109.1950 }, { lat: 12.2367, lng: 109.1921 }],
}];

const demoTrips: Trip[] = [
  { id: "TR-2417", scooterId: "NT-006", started: "14:32", distance: 2.1, status: "В поездке" },
  { id: "TR-2416", scooterId: "NT-004", started: "14:18", distance: 0, status: "Отклонена", note: "Старт внутри запретной зоны" },
  { id: "TR-2415", scooterId: "NT-005", started: "13:42", distance: 8.6, status: "Завершена" },
  { id: "TR-2414", scooterId: "NT-002", started: "13:20", distance: 3.2, status: "В поездке", note: "Внутри запретной зоны — завершение заблокировано" },
  { id: "TR-2413", scooterId: "NT-003", started: "12:58", distance: 12.1, status: "Завершена" },
  { id: "TR-2412", scooterId: "NT-001", started: "11:40", distance: 5.7, status: "Завершена" },
];

const statusClass: Record<ScooterStatus, string> = { "В поездке": "fleet-status fleet-status--rented", Стоит: "fleet-status fleet-status--available", Сервис: "fleet-status fleet-status--service" };

function getSaved<T,>(key: string, fallback: T): T {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; }
  catch { return fallback; }
}

function isPointInside(point: GeoPoint, polygon: GeoPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]; const b = polygon[j];
    const crosses = (a.lat > point.lat) !== (b.lat > point.lat) && point.lng < ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

function formatIdle(minutes: number) {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : `${minutes} мин`;
}

export function AdminPage() {
  const [section, setSection] = useState<Section>("overview");
  const [scooters, setScooters] = useState<Scooter[]>(() => getSaved("scoot-nha-trang-fleet-v2", demoScooters));
  const [zones, setZones] = useState<ParkingZone[]>(() => getSaved("scoot-nha-trang-zones", demoZones));
  const [trips, setTrips] = useState(demoTrips);
  const [selectedId, setSelectedId] = useState("NT-002");
  const [filter, setFilter] = useState("Все статусы");
  const [fuelFilter, setFuelFilter] = useState("Любой уровень топлива");
  const [query, setQuery] = useState("");
  const [draftPoints, setDraftPoints] = useState<GeoPoint[]>([]);
  const [zoneName, setZoneName] = useState("Новая зона · запрет парковки");
  const [drawMode, setDrawMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Scooter | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [rulesPublished, setRulesPublished] = useState(false);

  const selected = scooters.find((scooter) => scooter.id === selectedId) ?? scooters[0];
  const visibleScooters = useMemo(() => scooters.filter((scooter) => {
    const matchesStatus = filter === "Все статусы" || scooter.status === filter;
    const matchesQuery = `${scooter.id} ${scooter.plate} ${scooter.location}`.toLowerCase().includes(query.toLowerCase());
    const matchesFuel = fuelFilter === "Любой уровень топлива" || (fuelFilter === "Топливо меньше 25%" ? scooter.fuel < 25 : scooter.fuel >= 50);
    return matchesStatus && matchesQuery && matchesFuel;
  }), [filter, fuelFilter, query, scooters]);

  const inRide = scooters.filter((scooter) => scooter.status === "В поездке").length;
  const idle = scooters.filter((scooter) => scooter.status === "Стоит").length;
  const service = scooters.filter((scooter) => scooter.status === "Сервис").length;
  const drivenKm = trips.filter((trip) => trip.status !== "Отклонена").reduce((total, trip) => total + trip.distance, 0);
  const tripAttempts = trips.length;
  const rejectedTrips = trips.filter((trip) => trip.status === "Отклонена").length;

  function saveScooters(next: Scooter[]) {
    setScooters(next);
    localStorage.setItem("scoot-nha-trang-fleet-v2", JSON.stringify(next));
  }

  function saveZones(next: ParkingZone[]) {
    setZones(next);
    localStorage.setItem("scoot-nha-trang-zones", JSON.stringify(next));
    setRulesPublished(false);
  }

  function updateStatus(id: string, status: ScooterStatus) {
    saveScooters(scooters.map((scooter) => scooter.id === id ? { ...scooter, status } : scooter));
  }

  function submitScooter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const scooter: Scooter = {
      id: String(data.get("id")), plate: String(data.get("plate")), model: "Honda Lead 125", year: Number(data.get("year")),
      status: data.get("status") as ScooterStatus, location: String(data.get("location")), lat: Number(data.get("lat")),
      lng: Number(data.get("lng")), fuel: Number(data.get("fuel")), gps: Number(data.get("gps")), idleMinutes: Number(data.get("idleMinutes")), note: String(data.get("note")),
    };
    const next = creating ? [...scooters, scooter] : scooters.map((item) => item.id === scooter.id ? scooter : item);
    saveScooters(next); setSelectedId(scooter.id); setEditing(null); setCreating(false);
  }

  function saveDraftZone() {
    if (draftPoints.length < 3) { setNotice("Для зоны нужно поставить минимум три точки."); return; }
    const nextNumber = Math.max(0, ...zones.map((zone) => Number(zone.id.replace("ZONE-", "")))) + 1;
    const next = [...zones, { id: `ZONE-${String(nextNumber).padStart(2, "0")}`, name: zoneName.trim() || "Новая запретная зона", points: draftPoints, active: true }];
    saveZones(next); setDraftPoints([]); setDrawMode(false); setNotice("Зона сохранена в демо. Команда на скутеры пока не отправляется.");
  }

  function tryEndTrip(scooterId: string) {
    const scooter = scooters.find((item) => item.id === scooterId);
    if (!scooter) return;
    const blockedZone = zones.find((zone) => zone.active && isPointInside(scooter, zone.points));
    if (blockedZone) {
      setNotice(`Завершение заблокировано: скутер находится в зоне «${blockedZone.name}».`);
      const nextNumber = Math.max(2411, ...trips.map((trip) => Number(trip.id.replace("TR-", "")))) + 1;
      setTrips((current) => [{ id: `TR-${nextNumber}`, scooterId, started: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), distance: 0, status: "Отклонена", note: `Завершение запрещено · ${blockedZone.name}` }, ...current]);
      return;
    }
    updateStatus(scooterId, "Стоит");
    setTrips((current) => current.map((trip) => trip.scooterId === scooterId && trip.status === "В поездке" ? { ...trip, status: "Завершена", note: "Поездка завершена" } : trip));
    setNotice("Поездка завершена. Байк отмечен как стоящий.");
  }

  function openNewScooter() {
    setCreating(true);
    setEditing({ id: `NT-${String(scooters.length + 1).padStart(3, "0")}`, plate: "", model: "Honda Lead 125", year: 2020, status: "Стоит", location: "Нячанг", lat: 12.2389, lng: 109.1968, fuel: 100, gps: 100, idleMinutes: 0, note: "" });
  }

  const sectionNames: Record<Section, string> = { overview: "Обзор", fleet: "Скутеры", map: "Карта" };

  return (
    <main className="admin-shell admin-shell--wide">
      <header className="admin-topbar">
        <div className="admin-brand"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><div><span>SCOOT NHA TRANG</span><small>операционная панель · демо</small></div></div>
        <Link className={buttonVariants({ variant: "outline" })} to="/">К приложению ↗</Link>
      </header>

      <nav className="admin-nav" aria-label="Разделы админки">
        {(["overview", "fleet", "map"] as Section[]).map((item) => <button key={item} className={section === item ? "admin-nav-item admin-nav-item--active" : "admin-nav-item"} onClick={() => setSection(item)}><span>{item === "overview" ? "▦" : item === "fleet" ? "◉" : "⌖"}</span>{sectionNames[item]}</button>)}
      </nav>

      {notice && <div className="admin-notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Закрыть уведомление">×</button></div>}

      {section === "overview" && <>
        <section className="admin-heading admin-heading--row"><div><p className="admin-eyebrow">ЧЕТВЕРГ, 22 ОКТЯБРЯ · НЯЧАНГ</p><h1>Сводка парка</h1><p>Состояние скутеров и поездок за сегодня</p></div><button className="text-action" onClick={() => setSection("map")}>Открыть карту парка ↗</button></section>
        <section className="overview-stats">
          <button onClick={() => { setSection("fleet"); setFilter("В поездке"); }}><span>В поездке</span><strong>{inRide}<small> скутера</small></strong><i className="stat-blue">Смотреть на карте →</i></button>
          <button onClick={() => { setSection("fleet"); setFilter("Стоит"); }}><span>Простаивают</span><strong>{idle}<small> скутера</small></strong><i className="stat-green">{scooters.filter((s) => s.status === "Стоит" && s.idleMinutes >= 60).length} больше часа</i></button>
          <button onClick={() => setSection("map")}><span>Поездок сегодня</span><strong>{tripAttempts}<small> попыток</small></strong><i>Детали ниже</i></button>
          <button onClick={() => setSection("map")}><span>Проехали сегодня</span><strong>{drivenKm.toFixed(1)}<small> км</small></strong><i>Отклонено поездок: {rejectedTrips}</i></button>
        </section>

        <section className="overview-grid">
          <Card className="overview-map-card"><CardContent><div className="panel-heading"><div><h2>Расположение парка</h2><p>Статусы и запретная зона</p></div><button className="text-action" onClick={() => setSection("map")}>Вся карта ↗</button></div><MapCanvas scooters={scooters} zones={zones} selectedId={selectedId} onSelect={setSelectedId} /><div className="map-legend"><span><i className="legend-dot legend-dot--ride" />В поездке</span><span><i className="legend-dot legend-dot--idle" />Стоит</span><span><i className="legend-zone" />Не парковать</span></div></CardContent></Card>
          <Card className="attention-card"><CardContent><div className="panel-heading"><div><h2>Нужны действия</h2><p>Скутеры и поездки с риском простоя</p></div><span className="attention-count">{scooters.filter((s) => s.fuel < 25 || s.gps < 55 || s.idleMinutes >= 60).length}</span></div>
            {scooters.filter((s) => s.fuel < 25 || s.gps < 55 || s.idleMinutes >= 60).map((scooter) => <button className="attention-row" key={scooter.id} onClick={() => { setSelectedId(scooter.id); setSection("map"); }}><span className="attention-symbol">{scooter.fuel < 25 ? "!" : scooter.gps < 55 ? "⌁" : "◷"}</span><span><b>{scooter.id} · {scooter.plate}</b><small>{scooter.fuel < 25 ? `Мало топлива · ${scooter.fuel}%` : scooter.gps < 55 ? `Слабый GPS · ${scooter.gps}%` : `Стоит ${formatIdle(scooter.idleMinutes)}`}</small></span><em>К карте ↗</em></button>)}
          </CardContent></Card>
        </section>

        <section className="overview-trips"><div className="panel-heading"><div><h2>Поездки сегодня</h2><p>{trips.filter((trip) => trip.status === "Завершена").length} завершено · {inRide} в пути · {rejectedTrips} отклонено</p></div><button className="text-action" onClick={() => setSection("map")}>Статистика поездок ↗</button></div>
          {trips.slice(0, 5).map((trip) => <TripRow key={trip.id} trip={trip} scooter={scooters.find((s) => s.id === trip.scooterId)} onMap={() => { setSelectedId(trip.scooterId); setSection("map"); }} onEnd={() => tryEndTrip(trip.scooterId)} />)}
        </section>
      </>}

      {section === "fleet" && <>
        <section className="admin-heading admin-heading--row"><div><p className="admin-eyebrow">ПАРК · HONDA LEAD 125</p><h1>Скутеры</h1><p>Список единиц парка, состояния и технических показателей</p></div><Button onClick={openNewScooter}>＋ Добавить скутер</Button></section>
        <section className="fleet-toolbar"><label className="fleet-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по ID, номеру или району" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Фильтр по статусу"><option>Все статусы</option><option>В поездке</option><option>Стоит</option><option>Сервис</option></select><select value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value)} aria-label="Фильтр по топливу"><option>Любой уровень топлива</option><option>Топливо меньше 25%</option><option>Топливо не меньше 50%</option></select><span className="demo-chip">{visibleScooters.length} / {scooters.length} БАЙКОВ</span></section>
        <Card className="fleet-table-card"><CardContent><div className="fleet-table-head"><span>СКУТЕР / ГОСНОМЕР</span><span>СТАТУС</span><span>ТОПЛИВО</span><span>GPS</span><span>ПОСЛЕДНЯЯ ТОЧКА</span><span>ПРОСТОЙ</span><span /></div>
          {visibleScooters.map((scooter) => <div className={`fleet-table-row ${selectedId === scooter.id ? "fleet-table-row--selected" : ""}`} key={scooter.id} onClick={() => setSelectedId(scooter.id)}><div className="scooter-table-name"><span className="scooter-thumb"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /></span><span><b>{scooter.id}</b><small>{scooter.plate} · {scooter.year}</small></span></div><div><span className={statusClass[scooter.status]}><i />{scooter.status}</span></div><div className="meter-cell"><b>{scooter.fuel}%</b><span><i style={{ width: `${scooter.fuel}%` }} /></span></div><div className={`gps-cell ${scooter.gps < 55 ? "gps-cell--low" : ""}`}>⌁ {scooter.gps}%</div><div className="location-cell">⌖ {scooter.location}</div><div>{scooter.status === "Стоит" ? formatIdle(scooter.idleMinutes) : "—"}</div><div className="row-tools"><button onClick={(event) => { event.stopPropagation(); setSelectedId(scooter.id); setSection("map"); }} aria-label={`Показать ${scooter.id} на карте`}>⌖</button><button onClick={(event) => { event.stopPropagation(); setCreating(false); setEditing(scooter); }} aria-label={`Редактировать ${scooter.id}`}>···</button></div></div>)}
          {visibleScooters.length === 0 && <div className="fleet-empty">Скутеров по этим условиям нет.</div>}
        </CardContent></Card>
      </>}

      {section === "map" && <>
        <section className="admin-heading admin-heading--row"><div><p className="admin-eyebrow">ГЕОЗОНЫ · СОСТОЯНИЕ ПАРКА</p><h1>Карта</h1><p>Фильтруйте скутеры, проверяйте стоянки и задавайте зоны запрета</p></div><div className="map-filter-group"><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Фильтр статуса на карте"><option>Все статусы</option><option>В поездке</option><option>Стоит</option><option>Сервис</option></select><select value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value)} aria-label="Фильтр топлива на карте"><option>Любой уровень топлива</option><option>Топливо меньше 25%</option><option>Топливо не меньше 50%</option></select></div></section>
        <div className="map-page-layout"><section className="map-main-card"><div className="map-main-toolbar"><div className="map-legend"><span><i className="legend-dot legend-dot--ride" />В поездке</span><span><i className="legend-dot legend-dot--idle" />Стоит</span><span><i className="legend-dot legend-dot--service" />Сервис</span><span><i className="legend-zone" />Запретная зона</span></div><span className="demo-chip">{visibleScooters.length} БАЙКОВ · ДЕМО</span></div><MapCanvas scooters={visibleScooters} zones={zones} selectedId={selectedId} drawMode={drawMode} draftPoints={draftPoints} onSelect={setSelectedId} onAddPoint={(point) => setDraftPoints((current) => [...current, point])} />
          <div className="map-coord-bar">{selected ? <><b>{selected.id}</b><span>{selected.location}</span><span>{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</span><span>Топливо {selected.fuel}% · GPS {selected.gps}%</span></> : <span>Выберите точку парка</span>}<a href={`https://www.google.com/maps/search/?api=1&query=${selected?.lat ?? 12.2389},${selected?.lng ?? 109.1968}`} target="_blank" rel="noreferrer">Google Maps ↗</a></div>
        </section>
        <aside className="map-side-panel"><Card><CardContent><div className="panel-heading"><div><h2>Запретные зоны</h2><p>Завершение поездки блокируется внутри зоны</p></div><span className="attention-count">{zones.filter((zone) => zone.active).length}</span></div>
          <div className="zone-list">{zones.map((zone) => <article className="zone-row" key={zone.id}><span className="zone-icon">▧</span><span><b>{zone.name}</b><small>{zone.points.length} точек · {zone.active ? "Активна" : "Выключена"}</small></span><button onClick={() => saveZones(zones.map((item) => item.id === zone.id ? { ...item, active: !item.active } : item))}>{zone.active ? "Вкл" : "Выкл"}</button><button className="zone-delete" onClick={() => saveZones(zones.filter((item) => item.id !== zone.id))} aria-label={`Удалить зону ${zone.name}`}>×</button></article>)}</div>
          {!editorOpen ? <Button className="zone-start-button" onClick={() => { setEditorOpen(true); setDrawMode(true); setDraftPoints([]); }}>＋ Нарисовать зону</Button> : <div className="zone-editor"><div className="zone-editor-top"><b>Новая запретная зона</b><button onClick={() => { setEditorOpen(false); setDrawMode(false); setDraftPoints([]); }}>×</button></div><p>Кликайте по карте, чтобы поставить вершины контура (минимум 3).</p><label>Название зоны<input value={zoneName} onChange={(event) => setZoneName(event.target.value)} /></label><span className="zone-point-count">Точек добавлено: {draftPoints.length}</span><div className="zone-editor-actions"><Button variant="outline" onClick={() => setDraftPoints((current) => current.slice(0, -1))} disabled={draftPoints.length === 0}>Отменить точку</Button><Button onClick={saveDraftZone} disabled={draftPoints.length < 3}>Сохранить зону</Button></div><button className="cancel-draw" onClick={() => { setEditorOpen(false); setDrawMode(false); setDraftPoints([]); }}>Отмена</button></div>}
          <div className="zone-signal"><span className="signal-dot" /><div><b>Правило блокировки активно в демо</b><small>{rulesPublished ? "Демо-правило применено локально · на скутеры ничего не отправлено" : "Сохраните зону, затем примените демо-правило"}</small></div></div><Button className="zone-start-button zone-publish-button" variant="outline" disabled={zones.every((zone) => !zone.active)} onClick={() => { setRulesPublished(true); setNotice("Правило применено в демо. Команда на реальный скутер не отправлялась."); }}>Применить правило в демо</Button>
        </CardContent></Card>
        <Card className="map-idle-card"><CardContent><div className="panel-heading"><div><h2>Долгий простой</h2><p>Байки стоят больше часа</p></div><span>{scooters.filter((s) => s.status === "Стоит" && s.idleMinutes >= 60).length}</span></div>{scooters.filter((s) => s.status === "Стоит" && s.idleMinutes >= 60).map((scooter) => <button className="attention-row" key={scooter.id} onClick={() => setSelectedId(scooter.id)}><span className="attention-symbol">◷</span><span><b>{scooter.id}</b><small>{formatIdle(scooter.idleMinutes)} · {scooter.location}</small></span><em>Показать</em></button>)}{scooters.filter((s) => s.status === "Стоит" && s.idleMinutes >= 60).length === 0 && <p className="no-idle">Долгостоящих скутеров нет.</p>}</CardContent></Card></aside></div>
        <p className="map-api-note">{import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Подключена Google Maps JavaScript API. Точки и зоны пока хранятся только в демо-браузере." : "Интерактивная схема используется без ключа. Для карт Google Maps добавьте VITE_GOOGLE_MAPS_API_KEY в apps/web/.env.local; ключу нужны ограничения по домену и Maps JavaScript API."} Команда на байк сейчас не передаётся.</p>
      </>}

      <footer className="admin-foot"><span>Пилотный парк · Honda Lead 125 · 2012–2020</span><span>Данные демо сохраняются в текущем браузере</span></footer>

      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setCreating(false); } }}><form className="scooter-modal" onSubmit={submitScooter}>
        <div className="modal-heading"><div><p className="admin-eyebrow">{creating ? "НОВАЯ ЕДИНИЦА ПАРКА" : `КАРТОЧКА ${editing.id}`}</p><h2>{creating ? "Добавить скутер" : "Изменить данные"}</h2></div><button type="button" onClick={() => { setEditing(null); setCreating(false); }}>×</button></div>
        <div className="modal-grid"><label>ID парка<input name="id" defaultValue={editing.id} required readOnly={!creating} /></label><label>Госномер<input name="plate" defaultValue={editing.plate} required placeholder="79-N1 123.45" /></label><label>Год выпуска<select name="year" defaultValue={editing.year}>{[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020].map((year) => <option key={year}>{year}</option>)}</select></label><label>Статус<select name="status" defaultValue={editing.status}><option>В поездке</option><option>Стоит</option><option>Сервис</option></select></label><label className="modal-wide">Район / последняя точка<input name="location" defaultValue={editing.location} required /></label><label>Широта<input name="lat" type="number" step="0.0001" defaultValue={editing.lat} required /></label><label>Долгота<input name="lng" type="number" step="0.0001" defaultValue={editing.lng} required /></label><label>Топливо, %<input name="fuel" type="number" min="0" max="100" defaultValue={editing.fuel} required /></label><label>GPS, %<input name="gps" type="number" min="0" max="100" defaultValue={editing.gps} required /></label><label>Простой, мин<input name="idleMinutes" type="number" min="0" defaultValue={editing.idleMinutes} required /></label><label className="modal-wide">Заметка<input name="note" defaultValue={editing.note} /></label></div>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>Отмена</Button><Button type="submit">Сохранить</Button></div>
      </form></div>}
    </main>
  );
}

function TripRow({ trip, scooter, onMap, onEnd }: { trip: Trip; scooter?: Scooter; onMap: () => void; onEnd: () => void }) {
  const tripClass = trip.status === "Отклонена" ? "trip-state trip-state--rejected" : trip.status === "В поездке" ? "trip-state trip-state--active" : "trip-state trip-state--done";
  return <article className="trip-row"><span className="trip-time">{trip.started}</span><span className="trip-id"><b>{trip.id}</b><small>{trip.scooterId} · {scooter?.plate ?? ""}</small></span><span className={tripClass}><i />{trip.status}</span><span className="trip-distance">{trip.distance.toFixed(1)} км</span><span className="trip-note">{trip.note ?? "Нячанг · завершена"}</span><button onClick={onMap}>Карта ↗</button>{trip.status === "В поездке" && <button className="trip-end-button" onClick={onEnd}>Проверить завершение</button>}</article>;
}
