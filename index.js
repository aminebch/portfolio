/* ============================
   Portfolio JS (accessibility + UX)
============================ */
(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothScrollTo(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  /* ============================
     Footer year
  ============================ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============================
     Mobile nav: close after click + click outside
  ============================ */
  const navCheckbox = document.getElementById("check");
  const header = document.querySelector(".header");

  function closeNavIfOpen() {
    if (navCheckbox && navCheckbox.checked) navCheckbox.checked = false;
  }

  document.querySelectorAll(".navbar a").forEach((a) => {
    a.addEventListener("click", closeNavIfOpen);
  });

  const navCta = document.querySelector(".nav-cta");
  if (navCta) {
    navCta.addEventListener("click", () => {
      const target = navCta.getAttribute("data-scroll");
      if (target) smoothScrollTo(target);
      closeNavIfOpen();
    });
  }

  // Click outside header closes menu (mobile)
  document.addEventListener(
    "click",
    (e) => {
      if (!navCheckbox || !navCheckbox.checked) return;
      if (!header) return;
      const target = e.target;
      if (target instanceof Node && !header.contains(target)) closeNavIfOpen();
    },
    { passive: true }
  );

  /* ============================
     Update aria-expanded on the checkbox (a11y)
  ============================ */
  if (navCheckbox) {
    const syncExpanded = () => {
      navCheckbox.setAttribute("aria-expanded", navCheckbox.checked ? "true" : "false");
    };
    navCheckbox.addEventListener("change", syncExpanded);
    syncExpanded();
  }

  /* ============================
     Active nav highlighting (IntersectionObserver)
  ============================ */
  const navLinks = Array.from(document.querySelectorAll(".navbar a[data-nav]"));
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("data-nav") || ""))
    .filter(Boolean);

  if ("IntersectionObserver" in window && navLinks.length && sections.length) {
    const map = new Map(sections.map((s, i) => [s, navLinks[i]]));

    const io = new IntersectionObserver(
      (entries) => {
        // Choose the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (!visible) return;

        navLinks.forEach((a) => a.removeAttribute("aria-current"));
        const link = map.get(visible.target);
        if (link) link.setAttribute("aria-current", "true");
      },
      { root: null, threshold: [0.25, 0.5, 0.75], rootMargin: "-20% 0px -65% 0px" }
    );

    sections.forEach((s) => io.observe(s));
  }

  /* ============================
     Blob follow: performant (rAF + lerp)
  ============================ */
  const blob = document.getElementById("blob");
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  if (blob && !prefersReducedMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    (function animateBlob() {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);

      blob.style.left = `${currentX}px`;
      blob.style.top = `${currentY}px`;

      requestAnimationFrame(animateBlob);
    })();
  }

  /* ============================
     Scramble text (hover/click)
  ============================ */
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789•";
  const heroText = document.getElementById("heroText");
  let scrambleInterval = null;

  function startScramble() {
    if (!heroText) return;
    const original = heroText.dataset.value || heroText.textContent || "";
    let iteration = 0;

    clearInterval(scrambleInterval);

    scrambleInterval = window.setInterval(() => {
      const current = original
        .split("")
        .map((char, index) => {
          if (index < iteration) return original[index];
          if (char === " " || char === "•") return char;
          return letters[Math.floor(Math.random() * letters.length)];
        })
        .join("");

      heroText.textContent = current;

      if (iteration >= original.length) {
        clearInterval(scrambleInterval);
        heroText.textContent = original;
      }
      iteration += 1 / 3;
    }, 30);
  }

  if (heroText && !prefersReducedMotion) {
    heroText.addEventListener("pointerenter", startScramble);
    heroText.addEventListener("click", startScramble);
  }

  /* ============================
     Gallery modal (click thumbnail) + focus management
  ============================ */
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("modalImg");
  const modalClose = document.getElementById("modalClose");

  let lastFocused = null;

  function openModal(src, alt) {
    if (!modal || !modalImg) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    modalImg.src = src;
    modalImg.alt = alt || "Expanded preview";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Focus close button for keyboard users
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modalImg) {
      modalImg.src = "";
      modalImg.alt = "Expanded preview";
    }
    if (lastFocused) lastFocused.focus();
    lastFocused = null;
  }

  // Click on the button, not only on the img (fixes missed clicks)
  document.querySelectorAll(".gallery .thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = btn.querySelector("img");
      if (!img) return;
      openModal(img.src, img.alt);
    });
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      const t = e.target;
      const close = t && typeof t.getAttribute === "function" ? t.getAttribute("data-close") : null;
      if (close === "true") closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
        closeModal();
      }

      // Minimal focus trap inside modal
      if (e.key === "Tab" && modal.getAttribute("aria-hidden") === "false") {
        const focusables = modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        const list = Array.from(focusables).filter((el) => el instanceof HTMLElement && !el.hasAttribute("disabled"));
        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    });
  }

  // Allow explicit close button
  if (modalClose) modalClose.addEventListener("click", closeModal);
})();
