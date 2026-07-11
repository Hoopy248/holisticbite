(function () {
  const doc = document;
  const root = doc.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadFinalVelvetFix() {
    if (doc.getElementById("velvet-fix-css")) return;
    const link = doc.createElement("link");
    link.id = "velvet-fix-css";
    link.rel = "stylesheet";
    link.href = "./velvet-fix.css?v=20260711";
    doc.head.appendChild(link);
  }

  function markVisible() {
    const items = doc.querySelectorAll(".velvet-reveal");
    if (!items.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((item) => observer.observe(item));
  }

  function duplicateMarquee() {
    const line = doc.querySelector(".velvet-marquee div");
    if (!line || line.dataset.duplicated === "true") return;
    line.innerHTML += line.innerHTML;
    line.dataset.duplicated = "true";
  }

  function initMagneticButtons() {
    if (prefersReduced || window.matchMedia("(pointer: coarse)").matches) return;
    doc.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
      });
      button.addEventListener("mouseleave", () => {
        button.style.transform = "";
      });
    });
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const closeButton = modal.querySelector("[data-close-modal]");
    closeButton?.focus({ preventScroll: true });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function initModals() {
    doc.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close-modal]");
      if (close) {
        closeModal(close.closest(".modal"));
      }
      const modalBackdrop = event.target.classList?.contains("modal") ? event.target : null;
      if (modalBackdrop) closeModal(modalBackdrop);
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      doc.querySelectorAll(".modal.is-open").forEach(closeModal);
    });

    doc.getElementById("openEducationModal")?.addEventListener("click", () => {
      openModal(doc.getElementById("educationModal"));
    });
  }

  function initFormatPicker() {
    const track = doc.getElementById("formatTrack");
    const cards = track ? Array.from(track.querySelectorAll(".format-card")) : [];
    const viewport = track?.closest(".format-viewport");
    if (!track || !cards.length) return;

    let index = Math.max(0, cards.findIndex((card) => card.querySelector("input")?.checked));

    function visibleCount() {
      return window.innerWidth < 900 ? 1 : 2;
    }

    function clampIndex(value) {
      return Math.max(0, Math.min(value, Math.max(0, cards.length - visibleCount())));
    }

    function update() {
      index = clampIndex(index);
      if (window.innerWidth < 900) {
        const card = cards[index];
        viewport?.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: prefersReduced ? "auto" : "smooth" });
        return;
      }
      const gap = parseFloat(getComputedStyle(track).gap || "0");
      const cardWidth = cards[0].getBoundingClientRect().width + gap;
      track.style.transform = `translate3d(${-index * cardWidth}px, 0, 0)`;
    }

    doc.getElementById("prevFormat")?.addEventListener("click", () => {
      index -= visibleCount();
      update();
    });

    doc.getElementById("nextFormat")?.addEventListener("click", () => {
      index += visibleCount();
      update();
    });

    cards.forEach((card, cardIndex) => {
      card.addEventListener("click", () => {
        index = clampIndex(cardIndex);
        card.querySelector("input")?.focus({ preventScroll: true });
        update();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        card.querySelector("input").checked = true;
        card.click();
      });
      card.setAttribute("tabindex", "0");
    });

    window.addEventListener("resize", update);
    update();
  }

  function initFeedbackSequence() {
    const section = doc.getElementById("feedback");
    const viewport = section?.querySelector(".feedback-viewport");
    const track = doc.getElementById("feedbackTrack");
    const initialCards = track ? Array.from(track.querySelectorAll(".feedback-card")) : [];
    const counter = doc.getElementById("feedbackCounter");
    const progress = section?.querySelector(".feedback-progress span");
    const prev = doc.getElementById("prevFeedback");
    const next = doc.getElementById("nextFeedback");
    if (!section || !viewport || !track || !initialCards.length) return;

    let active = 0;

    function cards() {
      return Array.from(track.querySelectorAll(".feedback-card"));
    }

    function maxShift() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    function setActive(value, fromButton) {
      const currentCards = cards();
      active = Math.max(0, Math.min(value, currentCards.length - 1));
      if (counter) counter.textContent = `${active + 1} / ${currentCards.length}`;
      if (progress) progress.style.width = `${((active + 1) / currentCards.length) * 100}%`;

      if (window.innerWidth < 900) {
        currentCards[active]?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", inline: "start", block: "nearest" });
        return;
      }

      if (fromButton) {
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
        const target = sectionTop + scrollable * (active / Math.max(1, currentCards.length - 1));
        window.scrollTo({ top: target, behavior: prefersReduced ? "auto" : "smooth" });
      }
    }

    function updateFromScroll() {
      if (window.innerWidth < 900 || prefersReduced) {
        section.classList.remove("is-scroll-sequence");
        track.style.transform = "";
        return;
      }

      section.classList.add("is-scroll-sequence");
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const raw = Math.min(1, Math.max(0, -rect.top / scrollable));
      const shift = maxShift() * raw;
      track.style.transform = `translate3d(${-shift}px, 0, 0)`;

      const currentCards = cards();
      const newActive = Math.min(currentCards.length - 1, Math.round(raw * (currentCards.length - 1)));
      if (newActive !== active) {
        active = newActive;
        if (counter) counter.textContent = `${active + 1} / ${currentCards.length}`;
        if (progress) progress.style.width = `${((active + 1) / currentCards.length) * 100}%`;
      }
    }

    prev?.addEventListener("click", () => setActive(active - 1, true));
    next?.addEventListener("click", () => setActive(active + 1, true));
    viewport.addEventListener("scroll", () => {
      if (window.innerWidth >= 900) return;
      const midpoint = viewport.scrollLeft + viewport.clientWidth / 2;
      const nextActive = cards().findIndex((card) => card.offsetLeft + card.offsetWidth > midpoint);
      if (nextActive >= 0 && nextActive !== active) setActive(nextActive, false);
    });

    const observer = new MutationObserver(() => {
      active = 0;
      track.style.transform = "";
      setActive(0, false);
      updateFromScroll();
    });
    observer.observe(track, { childList: true });

    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    setActive(0, false);
    updateFromScroll();
  }

  function initLenis() {
    if (prefersReduced || !window.Lenis || window.__velvetLenis) return;
    const lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.86
    });
    window.__velvetLenis = lenis;
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function boot() {
    loadFinalVelvetFix();
    root.classList.add("velvet-ready");
    duplicateMarquee();
    markVisible();
    initMagneticButtons();
    initModals();
    initFormatPicker();
    initFeedbackSequence();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
