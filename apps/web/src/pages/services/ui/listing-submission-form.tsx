import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Input, Label, NativeSelect, Textarea } from "@/shared/ui";
import { contentApi, isContentApiConfigured, type ListingCategory } from "@/shared/api/content";
import { getTelegramWebApp } from "@/shared/lib/telegram";
import { MapPin, Trash2, Upload, X } from "lucide-react";

type UploadedPhoto = { url: string; name: string };
type Coordinates = { latitude: string; longitude: string };
const categoryHeading: Record<ListingCategory, string> = { BIKE_RENTAL: "Сдать байк в аренду", BIKE_SALE: "Продать байк", HOUSING_RENTAL: "Разместить апартаменты" };
const districts = [{ id: "north", label: "Север" }, { id: "center", label: "Центр" }, { id: "south", label: "Юг" }, { id: "outskirts", label: "Пригород" }] as const;

export function ListingSubmissionForm({ category, onClose }: { category: ListingCategory; onClose: () => void }) {
  const username = getTelegramWebApp()?.initDataUnsafe?.user?.username;
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [contact, setContact] = useState(username ? `@${username}` : "");
  const [coordinates, setCoordinates] = useState<Coordinates>({ latitude: "", longitude: "" });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const housing = category === "HOUSING_RENTAL";

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!selectedFiles.length) return;
    const remaining = 8 - photos.length;
    if (remaining <= 0) {
      setMessage("Можно добавить не больше 8 фотографий.");
      return;
    }
    if (selectedFiles.length > remaining) setMessage(`Добавлены первые ${remaining} фото: максимум — 8.`);
    setUploading(true);
    for (const file of selectedFiles.slice(0, remaining)) {
      if (file.size > 8 * 1024 * 1024) {
        setMessage(`${file.name}: размер фото должен быть не больше 8 МБ.`);
        continue;
      }
      try {
        const uploaded = await contentApi.uploadListingMedia(file);
        setPhotos((current) => [...current, { url: uploaded.url, name: uploaded.name }]);
        setMessage("");
      } catch (error) {
        setMessage(`Не удалось загрузить «${file.name}»: ${(error as Error).message}`);
      }
    }
    setUploading(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage("Браузер не поддерживает геолокацию. Можно указать координаты вручную.");
      return;
    }
    setMessage("Определяем координаты…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) });
        setMessage("Координаты добавлены.");
      },
      () => setMessage("Не удалось получить геолокацию. Разрешите доступ или укажите адрес и координаты вручную."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isContentApiConfigured) {
      setMessage("Демо-режим: публикация и загрузка фотографий заработают после подключения API.");
      return;
    }
    if (!photos.length) {
      setMessage("Добавьте хотя бы одну фотографию.");
      return;
    }
    if (Boolean(coordinates.latitude) !== Boolean(coordinates.longitude)) {
      setMessage("Укажите обе координаты или очистите оба поля.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const optionalNumber = (raw: string) => raw === "" ? undefined : Number(raw);
    const amenities = value("amenities").split(",").map((item) => item.trim()).filter(Boolean);
    setSubmitting(true);
    setMessage("");
    try {
      await contentApi.submitListing({
        category, title: value("title"), description: value("description"), price: optionalNumber(value("price")),
        currency: value("currency") as "VND" | "USD" | "RUB", address: value("address"),
        district: housing ? value("district") as "north" | "center" | "south" | "outskirts" : undefined,
        latitude: optionalNumber(coordinates.latitude), longitude: optionalNumber(coordinates.longitude),
        areaSqm: housing ? optionalNumber(value("areaSqm")) : undefined,
        bedrooms: housing ? optionalNumber(value("bedrooms")) : undefined, bathrooms: housing ? optionalNumber(value("bathrooms")) : undefined,
        hasTv: housing && form.get("hasTv") === "on", hasFridge: housing && form.get("hasFridge") === "on", hasTables: housing && form.get("hasTables") === "on",
        amenities, imageUrls: photos.map((photo) => photo.url), contact,
      });
      setSent(true);
    } catch (error) {
      setMessage("Заявка не отправлена: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="listing-submit-panel" aria-labelledby="listing-submit-title">
    <header className="listing-submit-heading"><div><span className="service-eyebrow">ЗАЯВКА НА ПУБЛИКАЦИЮ</span><h2 id="listing-submit-title">{categoryHeading[category]}</h2><p>Заполните карточку — объявление появится в каталоге после проверки.</p></div><Button type="button" variant="ghost" size="icon" className="listing-submit-close" aria-label="Закрыть форму" onClick={onClose}><X size={18} /></Button></header>
    {!isContentApiConfigured && <p className="listing-submit-message" role="status">Демо-режим: каталог доступен, а отправка объявлений и загрузка фотографий включатся после запуска API.</p>}
    {sent ? <div className="listing-submit-success" role="status"><span>✓</span><h3>Заявка отправлена</h3><p>Мы проверим данные и фотографии и свяжемся с вами по указанному контакту.</p><Button type="button" onClick={onClose}>Готово</Button></div> : <form className="listing-submit-form" onSubmit={(event) => void submit(event)}>
      <div className="listing-submit-grid">
        <Label className="listing-form-label">{housing ? "Название апартаментов" : "Модель / заголовок"}<Input name="title" required minLength={3} maxLength={120} placeholder={housing ? "Например, студия у моря" : "Например, Honda Lead 125 · 2022"} /></Label>
        <div className="listing-submit-inline"><Label className="listing-form-label">Цена<Input name="price" type="number" min="0" step="any" placeholder="Можно оставить пустым" /></Label><Label className="listing-form-label">Валюта<NativeSelect name="currency" defaultValue="VND"><option value="VND">Донги · VND</option><option value="USD">Доллары · USD</option><option value="RUB">Рубли · RUB</option></NativeSelect></Label></div>
        <Label className="listing-form-label listing-form-wide">Описание<Textarea name="description" required minLength={10} maxLength={4000} placeholder={housing ? "Расскажите об апартаментах, условиях аренды и удобствах" : "Состояние, комплектация, срок и условия аренды или продажи"} /></Label>
        <Label className="listing-form-label listing-form-wide">Адрес или ориентир<Input name="address" required minLength={3} maxLength={240} placeholder="Район, улица или ближайший ориентир в Нячанге" /></Label>
        {housing && <><Label className="listing-form-label">Район<NativeSelect name="district" defaultValue="center">{districts.map((district) => <option key={district.id} value={district.id}>{district.label}</option>)}</NativeSelect></Label><div className="listing-submit-inline listing-form-wide"><Label className="listing-form-label">Площадь, м²<Input name="areaSqm" type="number" min="1" step="any" required placeholder="Например, 48" /></Label><Label className="listing-form-label">Спальни<Input name="bedrooms" type="number" min="0" step="1" placeholder="Например, 1" /></Label><Label className="listing-form-label">Санузлы<Input name="bathrooms" type="number" min="0" step="1" placeholder="Например, 1" /></Label></div><div className="listing-submit-checks listing-form-wide"><label><input type="checkbox" name="hasTv" /> Телевизор</label><label><input type="checkbox" name="hasFridge" /> Холодильник</label><label><input type="checkbox" name="hasTables" /> Стол</label></div><Label className="listing-form-label listing-form-wide">Удобства через запятую<Input name="amenities" placeholder="Балкон, кондиционер, лифт" /></Label></>}
        <div className="listing-submit-location listing-form-wide"><div className="listing-submit-location-heading"><span><MapPin size={16} /> Точка на карте</span><Button type="button" variant="outline" size="sm" onClick={useMyLocation}>Использовать геолокацию</Button></div><div className="listing-submit-inline"><Label className="listing-form-label">Широта<Input value={coordinates.latitude} onChange={(event) => setCoordinates((current) => ({ ...current, latitude: event.target.value }))} inputMode="decimal" placeholder="12.2388" /></Label><Label className="listing-form-label">Долгота<Input value={coordinates.longitude} onChange={(event) => setCoordinates((current) => ({ ...current, longitude: event.target.value }))} inputMode="decimal" placeholder="109.1967" /></Label></div><small>Можно указать адрес без координат. Доступ к геолокации запрашивается только после нажатия.</small></div>
        <div className="listing-submit-photos listing-form-wide"><Label className="listing-form-label">Фотографии <small>до 8 изображений, каждое до 8 МБ</small><Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={!isContentApiConfigured || uploading || photos.length >= 8} onChange={(event) => void uploadPhotos(event)} /></Label>{uploading && <p className="listing-upload-status"><Upload size={14} /> Загружаем фотографии…</p>}{photos.length > 0 && <div className="listing-photo-previews">{photos.map((photo, index) => <figure key={photo.url}><img src={photo.url} alt={`Фото ${index + 1}`} /><figcaption>{photo.name}</figcaption><button type="button" aria-label={`Удалить фото ${index + 1}`} onClick={() => setPhotos((current) => current.filter((item) => item.url !== photo.url))}><Trash2 size={13} /></button></figure>)}</div>}</div>
        <Label className="listing-form-label listing-form-wide">Контакт для связи<Input value={contact} onChange={(event) => setContact(event.target.value)} required minLength={3} maxLength={120} placeholder="@username или номер телефона" /></Label>
      </div>
      {message && <p className="listing-submit-message" role="status">{message}</p>}
      <div className="listing-submit-actions"><Button type="submit" disabled={!isContentApiConfigured || submitting || uploading}>{submitting ? "Отправляем…" : isContentApiConfigured ? "Отправить на проверку" : "Доступно после запуска API"}</Button><span>Отправляя форму, вы передаёте объявление модератору каталога.</span></div>
    </form>}
  </section>;
}
