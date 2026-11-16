(() => {
  const GAP = 40;
  const root = document.querySelector("#scroll-root");
  const slot = document.querySelector("#slot");
  const cards = [...document.querySelectorAll(".card")];
  const desktopQuery = window.matchMedia("(min-width: 801px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!root || !slot || cards.length === 0) return;

  function resetCards() {
    cards.forEach((card) => {
      card.style.removeProperty("--y");
      card.style.removeProperty("--blur");
      card.style.removeProperty("--opacity");
      card.style.removeProperty("--shade");
      card.style.removeProperty("--shadow-alpha");
      card.style.removeProperty("z-index");
      card.classList.remove("is-active");
    });
  }

  function renderStack() {
    if (!desktopQuery.matches || motionQuery.matches) {
      resetCards();
      return;
    }

    const slotHeight = slot.getBoundingClientRect().height;
    const stride = slotHeight + GAP;
    const scrollable = root.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-root.getBoundingClientRect().top, 0), scrollable);
    const progress = scrollable > 0 ? scrolled / scrollable : 0;
    const active = progress * (cards.length - 1);

    cards.forEach((card, index) => {
      const distance = index - active;
      const y = distance * stride;
      const travel = Math.min(Math.abs(distance), 1);
      const opacity = 1 - travel * 0.8;
      const blur = distance < 0 ? travel * 70 : travel * 12;
      const shade = 1 - travel;

      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--blur", `${blur}px`);
      card.style.setProperty("--opacity", opacity.toFixed(3));
      card.style.setProperty("--shade", shade.toFixed(3));
      card.style.setProperty("--shadow-alpha", (shade * 0.2).toFixed(3));
      card.style.zIndex = String(100 - Math.round(Math.abs(distance) * 10));
      card.classList.toggle("is-active", Math.abs(distance) < 0.5);
    });
  }

  let snapTimer = 0;
  let settling = false;

  function scrollLimits() {
    const scrollable = Math.max(root.offsetHeight - window.innerHeight, 0);
    const rootTop = window.scrollY + root.getBoundingClientRect().top;
    return { scrollable, rootTop };
  }

  function snapToNearest() {
    if (!desktopQuery.matches || motionQuery.matches || cards.length < 2) return;

    const { scrollable, rootTop } = scrollLimits();
    if (scrollable <= 0) return;

    const scrolled = Math.min(Math.max(window.scrollY - rootTop, 0), scrollable);
    const index = Math.round((scrolled / scrollable) * (cards.length - 1));
    const top = rootTop + (index / (cards.length - 1)) * scrollable;

    if (Math.abs(window.scrollY - top) < 1.5) {
      settling = false;
      renderStack();
      return;
    }

    settling = true;
    window.scrollTo({ top, behavior: "smooth" });
    window.setTimeout(() => {
      settling = false;
      renderStack();
    }, 700);
  }

  function onScroll() {
    window.requestAnimationFrame(renderStack);
    if (!desktopQuery.matches || motionQuery.matches) return;
    window.clearTimeout(snapTimer);
    if (settling) return;
    snapTimer = window.setTimeout(snapToNearest, 220);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scrollend", () => {
    settling = false;
    renderStack();
  });
  window.addEventListener("resize", onScroll);
  desktopQuery.addEventListener("change", onScroll);
  motionQuery.addEventListener("change", onScroll);
  renderStack();
})();
