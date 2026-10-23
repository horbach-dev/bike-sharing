export function ErrorScreen() {
  const homeUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();

  return (
    <main className="app-error-screen" role="alert">
      <section className="app-error-card" aria-labelledby="app-error-title">
        <div className="app-error-mark" aria-hidden="true">!</div>
        <p className="app-error-eyebrow">Scoot Nha Trang</p>
        <h1 id="app-error-title">Что-то пошло не так</h1>
        <p className="app-error-description">
          Не удалось открыть этот экран. Перезагрузите приложение или вернитесь на главную.
        </p>
        <div className="app-error-actions">
          <button className="app-error-primary" onClick={() => window.location.reload()}>
            Перезагрузить приложение
          </button>
          <button className="app-error-secondary" onClick={() => window.location.assign(homeUrl)}>
            На главную
          </button>
        </div>
      </section>
    </main>
  );
}
