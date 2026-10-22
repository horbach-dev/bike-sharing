import { Link } from "react-router-dom";
import { publicAsset } from "@/shared/lib/public-asset";
import "./investors-page.css";

const presentations = [
  {
    number: "01",
    title: "Бизнес-план",
    summary: "Экономика пилота на 10 байков, сценарии масштаба и модель партнёрства с VinFast.",
    href: "investors/01-business-plan.html",
    image: "brand/nha-trang-scoot-promo.png",
    className: "investor-card--business",
    label: "10 байков · пилот",
  },
  {
    number: "02",
    title: "Маркетинговый план",
    summary: "Фокус-группа из 20 человек, измеримые каналы привлечения и план запуска на 90 дней.",
    href: "investors/02-marketing-plan.html",
    image: "brand/tile-cafe.png",
    className: "investor-card--marketing",
    label: "20 участников · 90 дней",
  },
  {
    number: "03",
    title: "Роадмап приложения",
    summary: "Этапы разработки до апреля 2027 года, техническая схема и условия безопасного пилота.",
    href: "investors/03-app-roadmap.html",
    image: "brand/tile-coast.png",
    className: "investor-card--roadmap",
    label: "React · Mini App · Web",
  },
];

export function InvestorsPage() {
  return <main className="investors-page">
    <header className="investors-header">
      <Link className="investors-brand" to="/" aria-label="Scoot Nha Trang — главная">
        <img src={publicAsset("brand/nha-trang-scoot-mark.png")} alt="" />
        <span><b>SCOOT</b><small>NHA TRANG</small></span>
      </Link>
      <Link className="investors-back" to="/">← На главную</Link>
    </header>

    <section className="investors-intro">
      <span className="investors-kicker"><i /> ПАРТНЁРСКИЕ МАТЕРИАЛЫ · ОКТЯБРЬ 2026</span>
      <h1>Нячанг — в своём темпе</h1>
      <p>Пилот байкшеринга, план привлечения пользователей и путь приложения к запуску в апреле 2027 года.</p>
    </section>

    <section className="investors-grid" aria-label="Презентации для партнёров">
      {presentations.map((presentation) => <a
        key={presentation.number}
        className={`investor-card ${presentation.className}`}
        href={publicAsset(presentation.href)}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(13,38,31,.04) 0%, rgba(13,38,31,.28) 37%, rgba(13,38,31,.88) 100%), url("${publicAsset(presentation.image)}")` }}
      >
        <span className="investor-card-number">{presentation.number}</span>
        <span className="investor-card-copy">
          <small>{presentation.label}</small>
          <b>{presentation.title}</b>
          <span>{presentation.summary}</span>
          <i>Открыть презентацию <strong>↗</strong></i>
        </span>
      </a>)}
    </section>

    <footer className="investors-footer">
      <div><small>ОБСУДИМ ПИЛОТ И ПАРТНЁРСТВО</small><p>Напишите напрямую — договоримся о следующем шаге.</p></div>
      <a href="https://t.me/horbachAI" target="_blank" rel="noreferrer">Связаться в Telegram ↗</a>
    </footer>
  </main>;
}
