import { navigate } from "astro:transitions/client";
import { soundFx } from "@/utils/soundFx";

export interface PostItem {
  title: string;
  href: string;
  tag?: string;
  readingTime?: string;
  description?: string;
}

let lastPickedHref = "";

export function initSurpriseRoulette() {
  const trigger = document.getElementById("surprise-me-trigger") as HTMLButtonElement | null;
  const modal = document.getElementById("surprise-roulette-modal") as HTMLElement | null;
  const backdrop = document.getElementById("roulette-backdrop") as HTMLElement | null;
  const closeBtn = document.getElementById("roulette-close-btn") as HTMLButtonElement | null;
  const shuffleView = document.getElementById("roulette-shuffle-view") as HTMLElement | null;
  const shuffleTitle = document.getElementById("shuffle-title") as HTMLElement | null;
  const winnerCard = document.getElementById("roulette-winner-card") as HTMLElement | null;
  const winnerTag = document.getElementById("winner-tag") as HTMLElement | null;
  const winnerTime = document.getElementById("winner-time-val") as HTMLElement | null;
  const winnerTitle = document.getElementById("winner-title") as HTMLElement | null;
  const winnerDesc = document.getElementById("winner-desc") as HTMLElement | null;
  const winnerReadBtn = document.getElementById("winner-read-btn") as HTMLAnchorElement | null;
  const winnerRespinBtn = document.getElementById("winner-respin-btn") as HTMLButtonElement | null;
  const statusText = document.getElementById("roulette-status-text") as HTMLElement | null;
  const diceIcon = document.getElementById("modal-dice-icon") as SVGElement | null;

  if (!trigger || !modal) return;

  let rawPosts: PostItem[] = [];
  try {
    rawPosts = JSON.parse(trigger.dataset.posts || "[]");
  } catch {
    rawPosts = [];
  }

  if (rawPosts.length === 0) return;

  let isSpinning = false;
  let selectedPost: PostItem | null = null;
  let shuffleTimerId: number | null = null;

  const isEs = document.documentElement.lang === "es";

  function openModal() {
    modal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    spin();
  }

  function closeModal() {
    if (shuffleTimerId) {
      window.clearInterval(shuffleTimerId);
      shuffleTimerId = null;
    }
    isSpinning = false;
    modal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function spin() {
    if (isSpinning || rawPosts.length === 0) return;
    isSpinning = true;

    if (shuffleTimerId) {
      window.clearInterval(shuffleTimerId);
      shuffleTimerId = null;
    }

    // Filter out previously picked post if we have > 1 posts
    const availablePool =
      rawPosts.length > 1
        ? rawPosts.filter(p => p.href !== lastPickedHref)
        : rawPosts;

    const winner = availablePool[Math.floor(Math.random() * availablePool.length)] || rawPosts[0]!;

    // Reset views to shuffling mode
    shuffleView?.classList.remove("hidden");
    winnerCard?.classList.add("hidden");

    if (statusText) {
      statusText.textContent = isEs
        ? "Buscando algo genial para ti..."
        : "Selecting something awesome for you...";
    }

    if (diceIcon) {
      diceIcon.style.transform = `rotate(${Math.floor(360 + Math.random() * 720)}deg)`;
    }

    // Snappy CSS shuffling effect (7 steps ~ 450ms total)
    let stepCount = 0;
    const maxSteps = 7;
    const stepDuration = 65;

    shuffleTimerId = window.setInterval(() => {
      stepCount++;
      const randomCandidate = rawPosts[Math.floor(Math.random() * rawPosts.length)];
      if (shuffleTitle && randomCandidate) {
        shuffleTitle.textContent = randomCandidate.title;
      }
      soundFx.playTick(600 + (stepCount / maxSteps) * 300);

      if (stepCount >= maxSteps) {
        if (shuffleTimerId) {
          window.clearInterval(shuffleTimerId);
          shuffleTimerId = null;
        }
        finishSpin(winner);
      }
    }, stepDuration);
  }

  function finishSpin(winner: PostItem) {
    isSpinning = false;
    selectedPost = winner;
    lastPickedHref = winner.href;

    // SFX chime
    soundFx.playChime();

    // Update status text
    if (statusText) {
      statusText.textContent = isEs
        ? "¡Encontramos tu próxima lectura!"
        : "Here's your next read!";
    }

    // Populate winner card
    if (winnerTag) {
      winnerTag.textContent = winner.tag ? `#${winner.tag}` : "#dev";
    }
    if (winnerTime) {
      winnerTime.textContent = winner.readingTime || "5 min";
    }
    if (winnerTitle) {
      winnerTitle.textContent = winner.title;
    }
    if (winnerDesc) {
      winnerDesc.textContent = winner.description || "";
    }
    if (winnerReadBtn) {
      winnerReadBtn.href = winner.href;
      setTimeout(() => winnerReadBtn.focus(), 60);
    }

    // Transition views
    shuffleView?.classList.add("hidden");
    winnerCard?.classList.remove("hidden");
  }

  // Event listeners
  trigger.addEventListener("click", openModal);
  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  winnerRespinBtn?.addEventListener("click", spin);

  winnerReadBtn?.addEventListener("click", e => {
    e.preventDefault();
    if (selectedPost?.href) {
      closeModal();
      navigate(selectedPost.href);
    }
  });

  // Keyboard controls
  const onKeyDown = (e: KeyboardEvent) => {
    if (!modal.classList.contains("hidden")) {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "r" || e.key === "R" || e.key === " ") {
        if (document.activeElement !== winnerReadBtn) {
          e.preventDefault();
          spin();
        }
      }
    }
  };

  window.addEventListener("keydown", onKeyDown);

  document.addEventListener(
    "astro:before-swap",
    () => {
      if (shuffleTimerId) window.clearInterval(shuffleTimerId);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    },
    { once: true }
  );
}
