import { Link } from "react-router-dom";
import { ApiStatus } from "@/widgets/api-status";
import { Button, buttonVariants } from "@/shared/ui/button";
import { publicAsset } from "@/shared/lib/public-asset";

const rideTiles = [
  {
    image: publicAsset("brand/tile-coast.png"),
    alt: "Кремовый скутер на набережной Нячанга в солнечный день",
    eyebrow: "У МОРЯ",
    title: "По набережной",
    description: "Морской воздух, пальмы и длинный горизонт.",
    className: "trip-tile--coast",
  },
  {
    image: publicAsset("brand/tile-cafe.png"),
    alt: "Мятный скутер у уютного кафе на зелёной улице",
    eyebrow: "ГОРОД",
    title: "За кофе в центр",
    description: "Открывайте любимые места в своём темпе.",
    className: "trip-tile--city",
  },
  {
    image: publicAsset("brand/tile-bay.png"),
    alt: "Скутеры на смотровой площадке над заливом Нячанга на закате",
    eyebrow: "НА ВЕСЬ ДЕНЬ",
    title: "Вид на весь залив",
    description: "День для поездок подальше и новых остановок.",
    className: "trip-tile--day",
  },
];

export function HomePage() {
  return (
    <main className="user-page brand-home">
      <header className="brand-header">
        <Link className="brand-lockup" to="/" aria-label="Scoot Nha Trang — главная">
          <img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" />
          <span><b>SCOOT</b><small>NHA TRANG</small></span>
        </Link>
        <Link className={buttonVariants({ variant: "outline" })} to="/admin">Панель парка ↗</Link>
      </header>

      <section className="brand-hero">
        <img className="brand-hero-image" src={publicAsset("brand/nha-trang-scoot-promo.png")} alt="Путешественница на скутере у моря в Нячанге на закате" />
        <div className="brand-hero-shade" />
        <div className="brand-hero-content">
          <span className="brand-kicker"><i /> СВОБОДА ДВИЖЕНИЯ В НЯЧАНГЕ</span>
          <h1>Нячанг ближе<br />на скутере.</h1>
          <p>Садитесь и исследуйте побережье в своём темпе. Honda Lead 125 с простым бронированием и поддержкой на русском.</p>
          <div className="brand-hero-actions"><Button disabled>Скоро в городе</Button><span>Пилот · Honda Lead 125</span></div>
        </div>
        <div className="brand-hero-caption"><span>01 / ПЛЯЖ ЧАНФУ</span><span>12°14′ с. ш. · 109°11′ в. д.</span></div>
      </section>

      <section className="brand-explore" aria-labelledby="explore-heading">
        <div className="explore-heading">
          <div>
            <span className="explore-kicker"><i /> НЯЧАНГ В ВАШЕМ РИТМЕ</span>
            <h2 id="explore-heading">Куда поедем сегодня?</h2>
            <p>Выберите настроение для поездки. Скоро здесь появятся свободные скутеры рядом.</p>
          </div>
          <span className="explore-location"><b>⌖</b><span><strong>Карта рядом</strong><small>В разработке для пилота</small></span></span>
        </div>
        <div className="ride-tiles">
          {rideTiles.map((tile) => (
            <article className={"trip-tile " + tile.className} key={tile.title}>
              <img src={tile.image} alt={tile.alt} loading="lazy" />
              <span className="trip-tile-shade" />
              <span className="trip-tile-copy">
                <small>{tile.eyebrow}</small>
                <strong>{tile.title}</strong>
                <span>{tile.description}</span>
              </span>
              <span className="trip-tile-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
        <p className="explore-caption">Подборки вдохновляют на маршрут. Точки скутеров и геолокация появятся с запуском пилотного сервиса.</p>
      </section>

      <section className="brand-benefits">
        <article><span className="benefit-icon">⌖</span><div><b>Рядом с вами</b><p>Скутеры в популярных районах города</p></div></article>
        <article><span className="benefit-icon">◷</span><div><b>Без лишних шагов</b><p>Выберите скутер и оставьте заявку онлайн</p></div></article>
        <article><span className="benefit-icon">↗</span><div><b>Город — ваш</b><p>От набережной до любимых кафе и рынков</p></div></article>
      </section>

      <section className="brand-fleet-note"><div><p className="admin-eyebrow">ПРОСТОЙ ГОРОДСКОЙ ТРАНСПОРТ</p><h2>Знакомый скутер.<br />Новый ритм путешествия.</h2><p>Пилотный парк — Honda Lead 125, модели 2012–2020 годов. Каждую машину готовим к поездке и проверяем перед выдачей.</p></div><div className="brand-spec"><span>125<small>cc</small></span><b>Honda Lead</b><i>комфортный автомат</i></div></section>

      <footer className="brand-footer"><Link className="brand-lockup brand-lockup--small" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span>Нячанг, Вьетнам · Браузер и Telegram Mini App</span><ApiStatus /></footer>
    </main>
  );
}
