import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";
import { contentApi, type Article, type HomeContent, type Story } from "@/shared/api/content";
import { publicAsset } from "@/shared/lib/public-asset";
import "./home-page.css";

const demoStories: Story[] = [
  { id: "welcome", title: "Привет, Нячанг", posterUrl: publicAsset("brand/nha-trang-scoot-promo.png"), text: "Скоро здесь появятся свежие истории, маршруты и предложения от партнёров.", description: "Город у моря — в своём темпе." },
  { id: "coast", title: "Маршрут у моря", posterUrl: publicAsset("brand/tile-coast.png"), text: "Откройте для себя набережную и любимые места Чанфу." },
  { id: "coffee", title: "Кофе в центре", posterUrl: publicAsset("brand/tile-cafe.png"), text: "Собираем места, ради которых стоит свернуть с привычного пути." },
  { id: "bay", title: "Вид на залив", posterUrl: publicAsset("brand/tile-bay.png"), text: "Подборки Нячанга скоро будут пополняться." },
];

const demoArticles: Article[] = [
  { id: "a1", slug: "first-ride", title: "Первая поездка на байке в Нячанге", excerpt: "Что проверить перед стартом, чтобы спокойно освоиться на дороге.", coverUrl: publicAsset("brand/tile-coast.png") },
  { id: "a2", slug: "rent-checklist", title: "Как выбрать байк в аренду", excerpt: "Короткий чек-лист состояния, документов и условий аренды.", coverUrl: publicAsset("brand/tile-cafe.png") },
  { id: "a3", slug: "city-routes", title: "Три идеи для городского маршрута", excerpt: "Море, кафе и смотровые точки на один день.", coverUrl: publicAsset("brand/tile-bay.png") },
  { id: "a4", slug: "helmet-fit", title: "Как подобрать шлем", excerpt: "Посадка и простые признаки правильного размера.", coverUrl: publicAsset("brand/tile-coast.png") },
  { id: "a5", slug: "long-rental", title: "Аренда на неделю: что уточнить", excerpt: "Залог, обслуживание и поддержка — вопросы до оплаты.", coverUrl: publicAsset("brand/tile-cafe.png") },
];

const emptyHome: HomeContent = { stories: [], articles: [], exchangeRates: [], rentals: [], saleListings: [], housing: [] };

const services = [
  { to: "/cashback", symbol: "↗", label: "Кэшбэк", detail: "VIP за поездки", className: "service-card--vip" },
  { to: "/sharing", symbol: "⌖", label: "Шеринг", detail: "Свободные байки", className: "service-card--share" },
  { to: "/rentals", symbol: "◷", label: "Аренда", detail: "Выберите скутер", className: "service-card--rent" },
  { to: "/marketplace", symbol: "＋", label: "Купить байк", detail: "Объявления города", className: "service-card--market" },
];

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const external = story.linkUrl?.startsWith("http");
  return <div className="story-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="story-viewer" style={{ backgroundImage: "linear-gradient(180deg,#102d2830 0%,#102d28d9 100%),url('" + story.posterUrl + "')" }}>
      <button className="story-close" onClick={onClose} aria-label="Закрыть">×</button>
      <div className="story-progress"><i /></div>
      <div className="story-copy"><small>SCOOT · НЯЧАНГ</small><h2>{story.title}</h2><p>{story.text}</p>{story.description && <span>{story.description}</span>}
        {story.linkUrl && (external ? <a className={buttonVariants({ className: "story-action" })} href={story.linkUrl} target="_blank" rel="noreferrer">{story.linkLabel ?? "Подробнее"} ↗</a> : <Link className={buttonVariants({ className: "story-action" })} to={story.linkUrl} onClick={onClose}>{story.linkLabel ?? "Открыть"} ↗</Link>)}
      </div>
    </article>
  </div>;
}

export function HomePage() {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const { data } = useQuery({ queryKey: ["home"], queryFn: () => contentApi.home().catch(() => emptyHome) });
  const stories = data?.stories.length ? data.stories : demoStories;
  const articles = data?.articles.length ? data.articles : demoArticles;
  const rates = data?.exchangeRates ?? [];

  return <main className="home-shell">
    <header className="home-topbar">
      <Link className="home-brand" to="/" aria-label="Scoot Nha Trang — главная">
        <img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span>
      </Link>
      <div className="home-top-actions"><span className="city-pill">☀ Нячанг, Вьетнам</span></div>
    </header>

    <section className="home-welcome">
      <div><span className="home-eyebrow"><i /> ГОРОД У МОРЯ — В СВОЁМ ТЕМПЕ</span><h1>Добро пожаловать<br /><em>в Нячанг.</em></h1><p>Поездки, аренда и места, которые хочется сохранить.</p></div>
      <div className="welcome-art"><img src={publicAsset("brand/nha-trang-scoot-promo.png")} alt="Поездка на скутере вдоль моря" /><span>12°14′ N · 109°11′ E</span></div>
    </section>

    <section className="home-stories" aria-labelledby="stories-heading">
      <div className="home-section-heading"><div><span className="home-eyebrow">СЕГОДНЯ В ГОРОДЕ</span><h2 id="stories-heading">Истории и новости</h2></div><Link to="/guides">Все публикации <b>↗</b></Link></div>
      <div className="story-rail">
        {stories.map((story, index) => <button className="story-bubble" key={story.id} onClick={() => setActiveStory(story)}>
          <span className={"story-ring " + (index === 0 ? "story-ring--new" : "")}><img src={story.posterUrl} alt="" /></span><span>{story.title}</span>
        </button>)}
      </div>
    </section>

    <section className="home-services" aria-labelledby="services-heading">
      <div className="home-section-heading"><div><span className="home-eyebrow">SCOOT ДЛЯ ГОРОДА</span><h2 id="services-heading">Выберите, что нужно</h2></div><span className="open-for-everyone">Доступно без регистрации</span></div>
      <div className="service-grid">
        {services.map((service) => <Link key={service.to} className={"service-card " + service.className} to={service.to}>
          <span className="service-symbol">{service.symbol}</span><span className="service-copy"><b>{service.label}</b><small>{service.detail}</small></span><span className="service-arrow">↗</span>
        </Link>)}
      </div>
    </section>

    <section className="home-articles">
      <div className="home-section-heading"><div><span className="home-eyebrow">ПУТЕВОДИТЕЛЬ</span><h2>Пять полезных гайдов</h2></div><Link to="/guides">Все гайды <b>↗</b></Link></div>
      <div className="article-row">{articles.slice(0, 5).map((article, index) => <Link className="article-card" to={"/guides/" + article.slug} key={article.id}>
        <span className="article-cover"><img src={article.coverUrl} alt="" loading="lazy" /><i>0{index + 1}</i></span><b>{article.title}</b><small>{article.excerpt}</small><span className="article-read">Читать ↗</span>
      </Link>)}</div>
    </section>

    <section className="home-exchange">
      <div className="exchange-intro"><span className="home-eyebrow">ОБМЕН В НЯЧАНГЕ</span><h2>Курс валют</h2><p>Курсы и партнёрские предложения будут обновляться через Minyao после настройки интеграции.</p><Link to="/partners">О партнёрах ↗</Link></div>
      <div className="exchange-card"><div className="exchange-card-top"><span className="exchange-mark">₫</span><span><b>Актуальные курсы</b><small>{rates.length ? "Партнёрский источник" : "Интеграция готовится"}</small></span><span className="exchange-sun">☀</span></div>
        {rates.length ? rates.slice(0, 3).map((rate) => <a className="rate-line" key={rate.id} href={rate.partner?.affiliateUrl ?? undefined} target={rate.partner?.affiliateUrl ? "_blank" : undefined} rel="noreferrer"><span>{rate.baseCode} <i>→</i> {rate.quoteCode}</span><b>{Number(rate.rate).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</b><small>{rate.partner?.name ?? rate.sourceLabel ?? "Источник"}</small></a>) : <div className="rate-empty"><b>Minyao · скоро</b><span>Добавим данные и партнёрскую ссылку в админке.</span></div>}
      </div>
    </section>

    <Link className="home-housing-banner" to="/housing">
      <img src={publicAsset("brand/tile-cafe.png")} alt="" loading="lazy" />
      <span className="housing-banner-glaze" />
      <span className="housing-banner-copy"><small>ЖИЗНЬ В НЯЧАНГЕ</small><b>Найдите своё<br />место у моря.</b><i>Аренда жилья · каталог объявлений ↗</i></span>
      <span className="housing-banner-stamp">NHA<br />TRANG</span>
    </Link>

    <section className="home-community">
      <div><span className="home-eyebrow">СОВЕТУЙТЕ ДРУГ ДРУГУ</span><h2>Карта мест Нячанга</h2><p>Добавьте кафе, видовую точку или полезное место. После проверки отметка появится на общей карте.</p><Link className={buttonVariants()} to="/places">Открыть карту мест ↗</Link></div>
      <div className="community-map-art" aria-hidden="true"><span className="map-water" /><i className="place-pin pin-one">☕</i><i className="place-pin pin-two">⌖</i><i className="place-pin pin-three">✦</i><span className="map-road road-one" /><span className="map-road road-two" /><b>NHATRANG<br />LOCAL MAP</b></div>
    </section>

    <footer className="home-footer"><Link className="home-brand" to="/"><img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" /><span><b>SCOOT</b><small>NHA TRANG</small></span></Link><span>Браузер · Telegram Mini App</span><Link to="/admin/content">Управление контентом ↗</Link></footer>
    {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
  </main>;
}
