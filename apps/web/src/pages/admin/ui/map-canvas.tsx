import { useEffect, useRef, useState } from "react";

export type GeoPoint = { lat: number; lng: number };
export type ScooterStatus = "В поездке" | "Стоит" | "Сервис";
export type Scooter = {
  id: string; plate: string; model: string; year: number; status: ScooterStatus;
  location: string; lat: number; lng: number; fuel: number; gps: number;
  idleMinutes: number; note: string;
};
export type ParkingZone = { id: string; name: string; points: GeoPoint[]; active: boolean };

declare global {
  interface Window { google?: { maps: any }; __scootMapsReady?: () => void }
}

const bounds = { north: 12.253, south: 12.222, west: 109.177, east: 109.216 };
const pointToSvg = ({ lat, lng }: GeoPoint) => ({
  x: ((lng - bounds.west) / (bounds.east - bounds.west)) * 1000,
  y: ((bounds.north - lat) / (bounds.north - bounds.south)) * 620,
});

type MapCanvasProps = {
  scooters: Scooter[];
  zones: ParkingZone[];
  selectedId?: string;
  drawMode?: boolean;
  draftPoints?: GeoPoint[];
  onSelect?: (id: string) => void;
  onAddPoint?: (point: GeoPoint) => void;
};

export function MapCanvas({ scooters, zones, selectedId, drawMode = false, draftPoints = [], onSelect, onAddPoint }: MapCanvasProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const onAddPointRef = useRef(onAddPoint);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  onAddPointRef.current = onAddPoint;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!apiKey || !elementRef.current) return;
    let cancelled = false;
    const initialize = () => {
      if (cancelled || !elementRef.current || !window.google?.maps) return;
      const maps = window.google.maps;
      mapRef.current = new maps.Map(elementRef.current, {
        center: { lat: 12.2389, lng: 109.1968 }, zoom: 14, mapTypeControl: false,
        streetViewControl: false, fullscreenControl: true, clickableIcons: false,
      });
      setMapReady(true);
    };

    if (window.google?.maps) initialize();
    else {
      window.__scootMapsReady = initialize;
      const existing = document.querySelector<HTMLScriptElement>('script[data-scoot-maps="true"]');
      if (existing) {
        existing.addEventListener("error", () => setMapFailed(true), { once: true });
      } else {
        const script = document.createElement("script");
        script.dataset.scootMaps = "true";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=__scootMapsReady&v=weekly`;
        script.async = true;
        script.onerror = () => setMapFailed(true);
        document.head.append(script);
      }
    }
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    scooters.forEach((scooter) => {
      const marker = new maps.Marker({
        map: mapRef.current,
        position: { lat: scooter.lat, lng: scooter.lng },
        title: `${scooter.id} · ${scooter.status}`,
        label: { text: scooter.id.replace("NT-", ""), color: "#fff", fontSize: "9px", fontWeight: "700" },
        icon: { path: maps.SymbolPath.CIRCLE, scale: scooter.id === selectedId ? 10 : 8, fillColor: scooter.status === "В поездке" ? "#397ba1" : scooter.status === "Сервис" ? "#bd7c32" : "#27805e", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      marker.addListener("click", () => onSelectRef.current?.(scooter.id));
      overlaysRef.current.push(marker);
    });
    zones.filter((zone) => zone.active).forEach((zone) => {
      const polygon = new maps.Polygon({ map: mapRef.current, paths: zone.points, strokeColor: "#d85845", strokeOpacity: .95, strokeWeight: 2, fillColor: "#ed7660", fillOpacity: .27, clickable: false });
      overlaysRef.current.push(polygon);
    });
    if (draftPoints.length > 0) {
      const polygon = new maps.Polygon({ map: mapRef.current, paths: draftPoints, strokeColor: "#087e80", strokeOpacity: 1, strokeWeight: 2, fillColor: "#087e80", fillOpacity: .2, clickable: false });
      overlaysRef.current.push(polygon);
      draftPoints.forEach((point) => {
        const marker = new maps.Marker({ map: mapRef.current, position: point, icon: { path: maps.SymbolPath.CIRCLE, scale: 4, fillColor: "#087e80", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 1 } });
        overlaysRef.current.push(marker);
      });
    }
  }, [mapReady, scooters, zones, draftPoints, selectedId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps || !drawMode) return;
    const listener = mapRef.current.addListener("click", (event: any) => {
      if (event.latLng) onAddPointRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    });
    return () => window.google?.maps.event.removeListener(listener);
  }, [mapReady, drawMode]);

  if (apiKey && !mapFailed) return <div className="map-canvas map-canvas--google" ref={elementRef} aria-label="Google Maps с точками парка и запретными зонами" />;

  return (
    <div className={`map-canvas map-canvas--demo ${drawMode ? "map-canvas--drawing" : ""}`}>
      <svg viewBox="0 0 1000 620" role="img" aria-label="Схема центра Нячанга с парком скутеров и зонами запрета парковки" onClick={(event) => {
        if (!drawMode || !onAddPoint) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 1000;
        const y = ((event.clientY - rect.top) / rect.height) * 620;
        onAddPoint({ lat: bounds.north - (y / 620) * (bounds.north - bounds.south), lng: bounds.west + (x / 1000) * (bounds.east - bounds.west) });
      }}>
        <rect width="1000" height="620" fill="#e8f0eb" />
        <path d="M0 0H1000V130C860 122 805 156 730 190S562 242 437 229 235 181 0 234Z" fill="#d6ecec" />
        <text x="786" y="75" className="map-water-label">МОРЕ ВОСТОЧНОЕ</text>
        <path d="M0 235C150 211 280 209 424 241S668 284 1000 206" className="demo-coast" />
        <g className="demo-road-minor">
          <path d="M50 292L916 250M18 352L995 322M14 426L985 410M42 505L963 486M94 272L162 600M244 258L286 610M402 267L424 615M565 279L572 616M718 271L696 610M862 241L834 600" />
          <path d="M58 388L892 371M65 461L933 447M138 256L188 600M333 260L355 605M487 274L495 600M638 279L623 600M791 258L767 600" />
        </g>
        <g className="demo-road-major"><path d="M110 265L160 615M903 237L840 614M22 465L984 439" /></g>
        <text x="304" y="346" className="map-place-label">TRẦN PHÚ</text><text x="615" y="430" className="map-place-label">XÓM MỚI</text><text x="175" y="560" className="map-place-label">НЯЧАНГ</text>
        {zones.filter((zone) => zone.active).map((zone) => <polygon key={zone.id} className="demo-zone" points={zone.points.map((point) => { const p = pointToSvg(point); return `${p.x},${p.y}`; }).join(" ")} />)}
        {draftPoints.length > 0 && <><polygon className="demo-zone demo-zone--draft" points={draftPoints.map((point) => { const p = pointToSvg(point); return `${p.x},${p.y}`; }).join(" ")} />{draftPoints.map((point, index) => { const p = pointToSvg(point); return <circle key={`${index}-${p.x}`} className="demo-draft-point" cx={p.x} cy={p.y} r="5" />; })}</>}
        {scooters.map((scooter) => { const p = pointToSvg(scooter); return <g key={scooter.id} className={`demo-marker ${scooter.status === "В поездке" ? "demo-marker--ride" : scooter.status === "Сервис" ? "demo-marker--service" : ""} ${scooter.id === selectedId ? "demo-marker--selected" : ""}`} onClick={(event) => { event.stopPropagation(); onSelect?.(scooter.id); }}><circle cx={p.x} cy={p.y} r="13" /><text x={p.x} y={p.y + 3}>{scooter.id.slice(-2)}</text></g>; })}
      </svg>
      {!apiKey && <span className="map-demo-label">ДЕМО-КАРТА · СХЕМА ЦЕНТРА</span>}
      {apiKey && mapFailed && <span className="map-demo-label">GOOGLE MAPS НЕ ЗАГРУЗИЛАСЬ · ДЕМО-КАРТА</span>}
    </div>
  );
}
