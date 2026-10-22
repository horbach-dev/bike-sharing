(() => {
  const slides = Array.from(document.querySelectorAll(".deck-slide"));
  const previous = document.querySelector(".deck-prev");
  const next = document.querySelector(".deck-next");
  const counter = document.querySelector(".deck-counter");
  const progress = document.querySelector(".deck-progress i");
  if (!slides.length || !previous || !next || !counter || !progress) return;

  let active = 0;
  const fromHash = Number(window.location.hash.replace("#", ""));
  if (Number.isInteger(fromHash) && fromHash > 0 && fromHash <= slides.length) active = fromHash - 1;

  function show(index, updateHash = true) {
    active = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === active;
      slide.hidden = !selected;
      slide.setAttribute("aria-hidden", String(!selected));
    });
    counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    progress.style.width = `${((active + 1) / slides.length) * 100}%`;
    previous.disabled = active === 0;
    next.disabled = active === slides.length - 1;
    if (updateHash) history.replaceState(null, "", `#${active + 1}`);
  }

  previous.addEventListener("click", () => show(active - 1));
  next.addEventListener("click", () => show(active + 1));
  document.addEventListener("keydown", (event) => {
    if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); show(active + 1); }
    if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); show(active - 1); }
    if (event.key === "Home") show(0);
    if (event.key === "End") show(slides.length - 1);
  });
  window.addEventListener("hashchange", () => {
    const requested = Number(window.location.hash.replace("#", ""));
    if (Number.isInteger(requested) && requested > 0 && requested <= slides.length) show(requested - 1, false);
  });
  show(active, false);
})();
