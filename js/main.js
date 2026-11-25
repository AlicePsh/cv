(() => {
  const GAP = 40;
  const root = document.querySelector("#scroll-root");
  const slot = document.querySelector("#slot");
  const cards = [...document.querySelectorAll(".card")];
  const desktopQuery = window.matchMedia("(min-width: 801px)");
  const mobileQuery = window.matchMedia("(max-width: 800px)");
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

  function clearMobileStickyLayout() {
    const cases = document.querySelector(".cases");
    if (cases) {
      cases.style.removeProperty("--title-sticky-top");
      cases.style.removeProperty("--card-sticky-top");
    }
    cards.forEach((card) => {
      card.style.removeProperty("--sticky-top");
      card.style.removeProperty("--stack-scale");
      card.style.removeProperty("--stack-brightness");
    });
    slot.style.removeProperty("--slot-end-space");
  }

  /**
   * Mobile depth: as the next card overlaps a stuck card, scale it down slightly
   * and lighten it. Driven by live overlap progress (not a separate timeline).
   */
  function renderMobileDepth() {
    if (!mobileQuery.matches || motionQuery.matches) {
      cards.forEach((card) => {
        card.style.removeProperty("--stack-scale");
        card.style.removeProperty("--stack-brightness");
      });
      return;
    }

    const cases = document.querySelector(".cases");
    const stickyY = cases
      ? parseFloat(getComputedStyle(cases).getPropertyValue("--card-sticky-top")) || 0
      : 0;

    const cover = new Array(cards.length).fill(0);
    const stuck = cards.map((card) => {
      const top = card.getBoundingClientRect().top;
      // At or above the sticky line = participating in the stack.
      return top <= stickyY + 1.5;
    });

    for (let i = 0; i < cards.length - 1; i += 1) {
      if (!stuck[i]) continue;
      const current = cards[i].getBoundingClientRect();
      const next = cards[i + 1].getBoundingClientRect();
      const height = Math.max(current.height, 1);
      // 0 = next still fully below this card; 1 = next on the same sticky line.
      cover[i] = Math.min(1, Math.max(0, (current.bottom - next.top) / height));
    }

    // Accumulate so deeper stacked cards keep receding as more layers arrive.
    const depth = cover.slice();
    for (let i = cards.length - 3; i >= 0; i -= 1) {
      if (!stuck[i]) continue;
      depth[i] = Math.min(2.5, depth[i] + depth[i + 1]);
    }

    cards.forEach((card, index) => {
      // Arriving cards (still below the sticky line) stay full size / contrast.
      if (!stuck[index]) {
        card.style.setProperty("--stack-scale", "1");
        card.style.setProperty("--stack-brightness", "1");
        return;
      }
      const d = depth[index] || 0;
      // ~0.96 per full cover → first layer lands in the 0.95–0.97 band.
      const scale = Math.max(0.9, Math.pow(0.96, d));
      const brightness = 1 + Math.min(d, 2.5) * 0.07;
      card.style.setProperty("--stack-scale", scale.toFixed(4));
      card.style.setProperty("--stack-brightness", brightness.toFixed(4));
    });
  }

  /**
   * Mobile only: treat the "Кейсы" title + card stack as one composition and
   * pin that block around the vertical center of the viewport.
   * Layout measurement only — no scroll animation / transforms.
   */
  function syncMobileStickyLayout() {
    if (!mobileQuery.matches || motionQuery.matches) {
      clearMobileStickyLayout();
      return;
    }

    const cases = document.querySelector(".cases");
    const title = document.querySelector(".cases-title");
    if (!cases || !title) return;

    // Prefer visualViewport on mobile browsers where the URL bar changes layout height.
    const viewportH = Math.round(
      (window.visualViewport && window.visualViewport.height) || window.innerHeight
    );
    const titleH = Math.round(title.getBoundingClientRect().height);
    // Use the tallest card so every panel settles on the same baseline.
    const cardH = Math.round(
      Math.max(...cards.map((card) => card.getBoundingClientRect().height), 0)
    );
    if (titleH <= 0 || cardH <= 0) return;

    // One composition: heading directly above the active card, group centered.
    const compositionH = titleH + cardH;
    const titleTop = Math.max(16, Math.round((viewportH - compositionH) / 2));
    const cardTop = titleTop + titleH;

    // Shared on .cases so title + cards stay one coordinated sticky system.
    cases.style.setProperty("--title-sticky-top", `${titleTop}px`);
    cases.style.setProperty("--card-sticky-top", `${cardTop}px`);
    cards.forEach((card) => {
      card.style.setProperty("--sticky-top", `${cardTop}px`);
    });

    // Runway after the last card must cover: (1) travel up to the sticky line,
    // and (2) a hold distance similar to what earlier cards get from the next
    // card below them (~ one card height + stack gap).
    const stackGap = 24;
    const holdLikePrevious = cardH + stackGap;
    const endSpace = Math.max(
      cardTop + holdLikePrevious,
      Math.round(viewportH - titleTop)
    );
    slot.style.setProperty("--slot-end-space", `${endSpace}px`);
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
    window.requestAnimationFrame(() => {
      if (mobileQuery.matches && !motionQuery.matches) {
        renderMobileDepth();
      } else {
        renderStack();
      }
    });
    if (!desktopQuery.matches || motionQuery.matches) return;
    window.clearTimeout(snapTimer);
    if (settling) return;
    snapTimer = window.setTimeout(snapToNearest, 220);
  }

  function onLayout() {
    syncMobileStickyLayout();
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scrollend", () => {
    settling = false;
    if (mobileQuery.matches && !motionQuery.matches) {
      renderMobileDepth();
    } else {
      renderStack();
    }
  });
  window.addEventListener("resize", onLayout);
  desktopQuery.addEventListener("change", onLayout);
  mobileQuery.addEventListener("change", onLayout);
  motionQuery.addEventListener("change", onLayout);

  // Re-measure after mobile card images load (heights can change).
  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (!img) return;
    if (img.complete) return;
    img.addEventListener("load", () => {
      syncMobileStickyLayout();
      renderMobileDepth();
    }, { once: true });
  });

  syncMobileStickyLayout();
  if (mobileQuery.matches && !motionQuery.matches) {
    renderMobileDepth();
  } else {
    renderStack();
  }
})();
