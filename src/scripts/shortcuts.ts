/**
 * shortcuts.ts
 *
 * Client-side keyboard shortcuts controller:
 * - Modal open/close with ESC, '?' or button triggers
 * - Go-To sequence ('g' + 'h', 'p', 't', 'g')
 * - Theme toggle ('t'), sound FX toggle ('x')
 * - Vim navigation ('j', 'k')
 * - Konami code detection ('↑↑↓↓←→←→BA') with retro 80s arcade celebration & canvas confetti
 * - Dynamic interactive toast notifications
 */
import { navigate } from "astro:transitions/client";
import { soundFx } from "@/utils/soundFx";

let shortcutsCleanup: AbortController | null = null;
let gPressed = false;
let gTimeout: number | null = null;

export function initShortcutsModal(): void {
  if (shortcutsCleanup) shortcutsCleanup.abort();
  shortcutsCleanup = new AbortController();
  const { signal } = shortcutsCleanup;

  const modal = document.getElementById("shortcuts-modal");
  if (!modal) return;

  const toastOpened =
    modal.getAttribute("data-toast-opened") || "Shortcuts panel opened";
  const toastSearchClosed =
    modal.getAttribute("data-toast-search-closed") || "Search modal closed";
  const toastGotoHome =
    modal.getAttribute("data-toast-goto-home") || "Navigating to Home...";
  const toastGotoPosts =
    modal.getAttribute("data-toast-goto-posts") || "Navigating to Articles...";
  const toastGotoTags =
    modal.getAttribute("data-toast-goto-tags") || "Navigating to Tags...";
  const toastGotoGalleries =
    modal.getAttribute("data-toast-goto-galleries") ||
    "Navigating to Galleries...";
  const toastTheme =
    modal.getAttribute("data-toast-theme") || "Theme changed to";
  const toastSoundEnabled =
    modal.getAttribute("data-toast-sound-enabled") ||
    "Sound effects enabled 🔊";
  const toastSoundMuted =
    modal.getAttribute("data-toast-sound-muted") || "Sound effects muted 🔇";

  const card = modal.querySelector("[data-modal-card]") as HTMLElement;
  const glow = modal.querySelector("[data-modal-glow]") as HTMLElement;
  const toastContainer = document.getElementById("shortcuts-toast-container");

  // Mouse-follow glow effect on modal card
  if (card && glow) {
    card.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          glow.style.setProperty("--gx", `${x}px`);
          glow.style.setProperty("--gy", `${y}px`);
          glow.style.opacity = "1";
        });
      },
      { signal }
    );

    card.addEventListener(
      "mouseleave",
      () => {
        glow.style.opacity = "0";
      },
      { signal }
    );
  }

  function openModal() {
    // Close other modals first (e.g., search modal)
    document.getElementById("search-modal")?.classList.remove("active");

    modal?.classList.add("active");
    document.body.style.overflow = "hidden";
    soundFx.playTap();
    showToast(["?"], toastOpened);
  }

  function closeModal() {
    modal?.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Close on trigger clicks
  modal.querySelectorAll("[data-shortcuts-close]").forEach(el => {
    el.addEventListener("click", closeModal, { signal });
  });

  // Button triggers inside the page (header, footer, mobile menu)
  document.querySelectorAll(".shortcuts-trigger").forEach(el => {
    el.addEventListener(
      "click",
      (e: Event) => {
        e.preventDefault();
        if (modal?.classList.contains("active")) {
          closeModal();
        } else {
          openModal();
        }
      },
      { signal }
    );
  });

  // Helper to show dynamic toasts
  function showToast(keys: string[], message: string) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "shortcuts-toast";

    const keysHTML = keys
      .map(key => `<kbd class="toast-kbd">${key}</kbd>`)
      .join(" ");

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-keys">${keysHTML}</span>
        <span class="toast-message">${message}</span>
      </div>
      <div class="toast-progress"></div>
    `;

    toastContainer.appendChild(toast);

    // Trigger transition
    requestAnimationFrame(() => {
      toast.classList.add("active");
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove("active");
      toast.classList.add("exit");

      // Bulletproof removal after exit animation (300ms)
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Keyboard event listener
  let konamiIndex = 0;
  let konamiTimeout: number | null = null;
  const KONAMI_SEQUENCE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      // Discard auto-repeat events
      if (e.repeat) return;

      // Ignore in form fields/editable elements
      const activeTag = document.activeElement?.tagName;
      const isEditable =
        document.activeElement?.hasAttribute("contenteditable") ||
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT";

      if (isEditable) return;

      // Ignore if modifier keys are pressed to avoid interfering with browser shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // 0. Check Konami Code sequence
      const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
      const targetKonamiKey = KONAMI_SEQUENCE[konamiIndex];
      const normalizedTarget =
        targetKonamiKey.length === 1
          ? targetKonamiKey.toLowerCase()
          : targetKonamiKey;

      if (normalizedKey === normalizedTarget) {
        konamiIndex++;
        if (konamiTimeout) clearTimeout(konamiTimeout);
        konamiTimeout = window.setTimeout(() => {
          konamiIndex = 0;
        }, 2500);

        if (konamiIndex === KONAMI_SEQUENCE.length) {
          konamiIndex = 0;
          if (konamiTimeout) clearTimeout(konamiTimeout);

          e.preventDefault();
          soundFx.play8BitFanfare();

          // Unlock arcade 80s accent theme and save 24h expiration timestamp
          document.documentElement.setAttribute("data-accent", "arcade");
          localStorage.setItem("theme-accent", "arcade");
          localStorage.setItem("konami-unlocked-at", String(Date.now()));

          showKonamiCelebration();
          return;
        }
      } else {
        konamiIndex = 0;
      }

      // Close Konami modal on ESC
      if (key === "Escape") {
        const konamiModal = document.getElementById("konami-celebration-modal");
        if (konamiModal && !konamiModal.classList.contains("hidden")) {
          closeKonamiCelebration();
          return;
        }
      }

      // 1. ESC key -> Close search or shortcuts modals
      if (key === "Escape") {
        const searchModal = document.getElementById("search-modal");
        const searchActive = searchModal?.classList.contains("active");
        const shortcutsActive = modal?.classList.contains("active");

        if (searchActive || shortcutsActive) {
          e.preventDefault();
          if (searchActive) {
            searchModal?.classList.remove("active");
            document.body.style.overflow = "";
            showToast(["esc"], toastSearchClosed);
          }
          if (shortcutsActive) {
            closeModal();
          }
        }
        return;
      }

      // If any modal is active, restrict general navigation shortcuts (j, k, g, t)
      const isSearchModalActive = document
        .getElementById("search-modal")
        ?.classList.contains("active");
      const isShortcutsModalActive = modal?.classList.contains("active");

      // Toggle shortcuts panel
      if (key === "?" && !isSearchModalActive) {
        e.preventDefault();
        if (isShortcutsModalActive) {
          closeModal();
        } else {
          openModal();
        }
        return;
      }

      if (isSearchModalActive || isShortcutsModalActive) {
        return;
      }

      // 2. Go-to sequence [g] + [key]
      if (gPressed) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);

        if (key === "h" || key === "H") {
          e.preventDefault();
          showToast(["g", "h"], toastGotoHome);
          setTimeout(() => {
            navigate("/");
          }, 150);
          return;
        }
        if (key === "p" || key === "P") {
          e.preventDefault();
          showToast(["g", "p"], toastGotoPosts);
          setTimeout(() => {
            navigate("/posts");
          }, 150);
          return;
        }
        if (key === "t" || key === "T") {
          e.preventDefault();
          showToast(["g", "t"], toastGotoTags);
          setTimeout(() => {
            navigate("/tags");
          }, 150);
          return;
        }
        if (key === "g" || key === "G") {
          e.preventDefault();
          showToast(["g", "g"], toastGotoGalleries);
          setTimeout(() => {
            navigate("/galleries");
          }, 150);
          return;
        }
        return;
      }

      // 3. Single key actions
      if (key === "g" || key === "G") {
        gPressed = true;
        gTimeout = window.setTimeout(() => {
          gPressed = false;
        }, 1200);
        return;
      }

      // [t] Key -> Toggle Theme
      if (key === "t" || key === "T") {
        e.preventDefault();
        const themeBtn = document.getElementById(
          "theme-btn"
        ) as HTMLElement | null;
        const themeBtnMobile = document.getElementById(
          "theme-btn-mobile"
        ) as HTMLElement | null;

        if (themeBtn && window.getComputedStyle(themeBtn).display !== "none") {
          themeBtn.click();
        } else if (themeBtnMobile) {
          themeBtnMobile.click();
        }

        setTimeout(() => {
          const currentTheme = localStorage.getItem("theme") || "dark";
          showToast(["t"], `${toastTheme} ${currentTheme}`);
        }, 50);
        return;
      }

      // [x] Key -> Toggle Sound Effects
      if (key === "x" || key === "X") {
        e.preventDefault();
        const newState = soundFx.toggle();
        showToast(["x"], newState ? toastSoundEnabled : toastSoundMuted);
        return;
      }

      // Vim navigation [j] / [k]
      if (key === "j" || key === "J") {
        e.preventDefault();
        navigateCards(1);
        soundFx.playTap(1400);
        return;
      }
      if (key === "k" || key === "K") {
        e.preventDefault();
        navigateCards(-1);
        soundFx.playTap(1400);
        return;
      }
    },
    { signal }
  );

  // ===== Konami Celebration Modal & Confetti =====
  const konamiModal = document.getElementById("konami-celebration-modal");
  const konamiCloseBtn = document.getElementById("konami-close-btn");
  const konamiBackdrop = document.getElementById("konami-celebration-backdrop");
  const konamiCanvas = document.getElementById(
    "konami-confetti-canvas"
  ) as HTMLCanvasElement | null;
  let konamiAnimFrame: number | null = null;

  function launchKonamiConfetti() {
    if (!konamiCanvas) return;
    const ctx = konamiCanvas.getContext("2d");
    if (!ctx) return;

    konamiCanvas.width = window.innerWidth;
    konamiCanvas.height = window.innerHeight;

    const colors = ["#00f0ff", "#ff007f", "#ffe600", "#a855f7", "#ffffff"];
    interface ConfettiParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      vRot: number;
    }

    const particles: ConfettiParticle[] = [];
    const count = 75;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2 - 50;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)] || "#00f0ff",
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
      });
    }

    const start = performance.now();
    const duration = 3000;

    function render(now: number) {
      if (!ctx || !konamiCanvas) return;
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, konamiCanvas.width, konamiCanvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.vx *= 0.985;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.5));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });

      if (progress < 1) {
        konamiAnimFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, konamiCanvas.width, konamiCanvas.height);
      }
    }

    if (konamiAnimFrame) cancelAnimationFrame(konamiAnimFrame);
    konamiAnimFrame = requestAnimationFrame(render);
  }

  function showKonamiCelebration() {
    if (!konamiModal) return;
    konamiModal.classList.remove("hidden");
    launchKonamiConfetti();

    setTimeout(() => {
      closeKonamiCelebration();
    }, 6000);
  }

  function closeKonamiCelebration() {
    if (!konamiModal) return;
    konamiModal.classList.add("hidden");
    if (konamiAnimFrame) cancelAnimationFrame(konamiAnimFrame);
  }

  konamiCloseBtn?.addEventListener("click", closeKonamiCelebration, { signal });
  konamiBackdrop?.addEventListener("click", closeKonamiCelebration, { signal });

  function navigateCards(direction: number) {
    const cards = Array.from(document.querySelectorAll(".card-glow"));
    if (cards.length === 0) return;

    const activeElement = document.activeElement;
    let activeIndex = cards.findIndex(card => card.contains(activeElement));

    if (activeIndex === -1) {
      activeIndex = direction === 1 ? 0 : cards.length - 1;
    } else {
      activeIndex += direction;
      if (activeIndex < 0) activeIndex = cards.length - 1;
      if (activeIndex >= cards.length) activeIndex = 0;
    }

    const targetCard = cards[activeIndex];
    const link = targetCard.querySelector("a[href]") as HTMLElement | null;
    if (link) {
      link.focus();
      link.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
}
