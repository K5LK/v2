import { soundFx } from "@/utils/soundFx";

// Quotes collection in English and Spanish
const DEV_QUOTES = {
  en: [
    "“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra",
    "“Make it work, make it right, make it fast.” — Kent Beck",
    "“Programs must be written for people to read, and only incidentally for machines to execute.” — Abelson & Sussman",
    "“There are only two hard things in Computer Science: cache invalidation and naming things.” — Phil Karlton",
    "“First, solve the problem. Then, write the code.” — John Johnson",
    "“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” — Martin Fowler",
    "“Code is like humor. When you have to explain it, it’s bad.” — Cory House",
    "“Experience is the name everyone gives to their mistakes.” — Oscar Wilde",
  ],
  es: [
    "«La simplicidad es prerrequisito para la confiabilidad.» — Edsger W. Dijkstra",
    "«Haz que funcione, hazlo bien, hazlo rápido.» — Kent Beck",
    "«El código debe escribirse para que las personas lo lean, y sólo incidentalmente para que las máquinas lo ejecuten.» — Abelson & Sussman",
    "«Solo hay dos cosas difíciles en Ciencias de la Computación: invalidar caché y nombrar variables.» — Phil Karlton",
    "«Primero, resuelve el problema. Luego, escribe el código.» — John Johnson",
    "«Cualquiera puede escribir código que una máquina entienda. Los buenos programadores escriben código que los humanos entienden.» — Martin Fowler",
    "«El código es como el humor. Si tienes que explicarlo, es malo.» — Cory House",
    "«La experiencia es el nombre que todos dan a sus errores.» — Oscar Wilde",
  ],
};

const ACCENTS = ["blue", "green", "purple", "amber", "rose"] as const;

// Matrix Rain Animation state
let matrixAnimationId: number | null = null;
let matrixTimeoutId: number | null = null;

/**
 * Halts Matrix digital rain and completely resets the canvas buffer
 * to 0x0 so it consumes zero memory when the terminal is closed.
 */
export function stopMatrixRain() {
  if (matrixAnimationId !== null) {
    cancelAnimationFrame(matrixAnimationId);
    matrixAnimationId = null;
  }
  if (matrixTimeoutId !== null) {
    clearTimeout(matrixTimeoutId);
    matrixTimeoutId = null;
  }

  const canvas = document.getElementById("matrix-rain-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  canvas.classList.add("hidden");
  canvas.style.opacity = "0";

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Release GPU framebuffer memory by zeroing dimensions
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Executes full-screen Matrix rain effect. Automatically cleans up
 * and frees canvas memory after 4.5 seconds or upon terminal close.
 */
function runMatrixRain() {
  stopMatrixRain();

  const canvas = document.getElementById("matrix-rain-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.remove("hidden");
  canvas.style.opacity = "1";

  const characters = "0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜDEVOSFERA_ASTRO_REACT_RUST_PYTHON";
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops: number[] = Array.from({ length: columns }).fill(1) as number[];

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const bgFade = isDark ? "rgba(10, 15, 25, 0.08)" : "rgba(255, 255, 255, 0.14)";
  const textColor = isDark ? "#00ff66" : "#059669";

  function draw() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = bgFade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = characters.charAt(Math.floor(Math.random() * characters.length));
      ctx.fillText(text, i * fontSize, (drops[i] ?? 0) * fontSize);

      if ((drops[i] ?? 0) * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      if (drops[i] !== undefined) drops[i]++;
    }

    matrixAnimationId = requestAnimationFrame(draw);
  }

  draw();

  // Auto-fadeout after 4.5 seconds and free memory
  matrixTimeoutId = window.setTimeout(() => {
    canvas.style.opacity = "0";
    setTimeout(() => {
      stopMatrixRain();
    }, 700);
  }, 4500);
}

export function initHeroTerminal() {
  const trigger = document.getElementById("hero-terminal-trigger") as HTMLButtonElement | null;
  const modal = document.getElementById("hero-terminal-modal") as HTMLElement | null;
  const backdrop = document.getElementById("terminal-backdrop") as HTMLElement | null;
  const closeBtn = document.getElementById("terminal-close-btn") as HTMLButtonElement | null;
  const clearBtn = document.getElementById("terminal-clear-btn") as HTMLButtonElement | null;
  const form = document.getElementById("terminal-form") as HTMLFormElement | null;
  const input = document.getElementById("terminal-input") as HTMLInputElement | null;
  const output = document.getElementById("terminal-output") as HTMLElement | null;
  const chips = document.querySelectorAll<HTMLButtonElement>(".term-chip");

  if (!trigger || !modal || !input || !output) return;

  const commandHistory: string[] = [];
  let historyIndex = -1;

  const isEs = document.documentElement.lang === "es";

  function appendOutput(content: string, typeClass = "") {
    if (!output) return;
    const line = document.createElement("div");
    line.className = `term-line ${typeClass}`;
    line.innerHTML = content;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function openTerminal() {
    modal?.classList.remove("hidden");
    trigger?.setAttribute("aria-expanded", "true");
    setTimeout(() => input?.focus(), 80);
  }

  function closeTerminal() {
    modal?.classList.add("hidden");
    trigger?.setAttribute("aria-expanded", "false");
    // Free canvas GPU buffer and stop matrix loop immediately
    stopMatrixRain();
  }

  function clearOutput() {
    if (!output) return;
    output.innerHTML = `<div class="text-accent/90 font-bold">⚡ ${isEs ? "Consola limpiada. Escribe 'help' para ver comandos." : "Console cleared. Type 'help' to see commands."}</div>`;
  }

  function executeCommand(rawCmd: string) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(" ");
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1).join(" ").trim();

    soundFx.playExecute();

    // Echo command line
    appendOutput(`<span class="term-prompt-echo">guest@devosfera:~$ ${trimmed}</span>`);

    commandHistory.unshift(trimmed);
    if (commandHistory.length > 50) commandHistory.pop();
    historyIndex = -1;

    switch (cmd) {
      case "help":
        appendOutput(`
          <div class="space-y-1">
            <div class="text-accent font-bold">${isEs ? "Comandos disponibles:" : "Available commands:"}</div>
            <div><span class="term-cyan-text">matrix</span>    - ${isEs ? "Lluvia de código Matrix digital (4.5s)" : "Trigger Matrix digital rain stream"}</div>
            <div><span class="term-cyan-text">random</span>    - ${isEs ? "Lanza la ruleta de artículos aleatorios" : "Pick a random post with roulette"}</div>
            <div><span class="term-cyan-text">quote</span>     - ${isEs ? "Muestra una frase/consejo dev al azar" : "Display a witty dev quote"}</div>
            <div><span class="term-cyan-text">theme</span>     - ${isEs ? "Cicla entre colores de acento cromático" : "Cycle through accent theme colors"}</div>
            <div><span class="term-cyan-text">ping</span>      - ${isEs ? "Prueba de latencia y estado (ej: ping google.com)" : "Test latency & stats (e.g. ping google.com)"}</div>
            <div><span class="term-cyan-text">cat</span>       - ${isEs ? "Gatito ASCII o lectura de archivos (ej: cat .env)" : "ASCII kitty or inspect files (e.g. cat .env)"}</div>
            <div><span class="term-cyan-text">neofetch</span>  - ${isEs ? "Información del sistema y blog" : "System and blog status summary"}</div>
            <div><span class="term-cyan-text">audio</span>     - ${isEs ? "Alterna reproducción Lo-Fi" : "Toggle Lo-Fi audio stream"}</div>
            <div><span class="term-cyan-text">whoami</span>    - ${isEs ? "Información sobre el autor y el blog" : "About author & blog info"}</div>
            <div><span class="term-cyan-text">clear</span>     - ${isEs ? "Limpia la pantalla" : "Clear terminal screen"}</div>
            <div><span class="term-cyan-text">exit</span>      - ${isEs ? "Cierra la terminal" : "Close terminal"}</div>
          </div>
        `);
        break;

      case "matrix":
        appendOutput(`<div>${isEs ? "Iniciando lluvia de código Matrix... 🕶️" : "Initiating Matrix digital rain stream... 🕶️"}</div>`, "term-res-success");
        runMatrixRain();
        break;

      case "random":
      case "roll":
        appendOutput(`<div>${isEs ? "Girando la ruleta de artículos... 🎲" : "Spinning the Post Roulette... 🎲"}</div>`, "term-res-info");
        closeTerminal();
        document.getElementById("surprise-me-trigger")?.click();
        break;

      case "quote":
      case "tip": {
        const pool = isEs ? DEV_QUOTES.es : DEV_QUOTES.en;
        const q = pool[Math.floor(Math.random() * pool.length)];
        appendOutput(`<div class="term-res-quote">${q}</div>`);
        break;
      }

      case "theme":
      case "color": {
        const currentAccent = localStorage.getItem("theme-accent") || "blue";
        const currentIdx = (ACCENTS as readonly string[]).indexOf(currentAccent as (typeof ACCENTS)[number]);
        const nextAccent = ACCENTS[(currentIdx + 1) % ACCENTS.length] || "blue";

        localStorage.setItem("theme-accent", nextAccent);
        document.firstElementChild?.setAttribute("data-accent", nextAccent);
        soundFx.playPop(nextAccent);

        appendOutput(`<div>${isEs ? "Tema de acento cambiado a:" : "Theme accent changed to:"} <strong class="text-accent uppercase">${nextAccent}</strong> ✨</div>`, "term-res-success");
        break;
      }

      case "ping": {
        const target = args || "devosfera.vercel.app";
        const ms1 = (Math.random() * 0.35 + 0.15).toFixed(3);
        const ms2 = (Math.random() * 0.35 + 0.15).toFixed(3);
        const ms3 = (Math.random() * 0.35 + 0.15).toFixed(3);
        const avg = (((+ms1) + (+ms2) + (+ms3)) / 3).toFixed(3);
        appendOutput(`
          <div class="space-y-0.5">
            <div class="term-cyan-text">PING ${target} (127.0.0.1): 56 data bytes</div>
            <div>64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=${ms1} ms</div>
            <div>64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=${ms2} ms</div>
            <div>64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=${ms3} ms</div>
            <div class="text-accent font-semibold pt-1">--- ${target} ping statistics ---</div>
            <div>3 packets transmitted, 3 packets received, 0.0% packet loss</div>
            <div class="term-green-text">round-trip min/avg/max = ${Math.min(+ms1, +ms2, +ms3).toFixed(3)}/${avg}/${Math.max(+ms1, +ms2, +ms3).toFixed(3)} ms (100% good vibes 🟢)</div>
          </div>
        `);
        break;
      }

      case "cat": {
        const target = args.toLowerCase();
        if (!target || target === "cat" || target === "kitty" || target === "miau" || target === "meow") {
          appendOutput(`
            <pre class="term-green-text font-mono leading-tight whitespace-pre">
 /\\_/\\  
( o.o )  ${isEs ? "¡Miau! La curiosidad no mató al gato, lo hizo programar." : "Meow! Curiosity didn't kill this cat, it made it code."}
 > ^ &lt;   ${isEs ? "Tip: ¡Prueba 'matrix', 'ping' o 'quote' para más diversión!" : "Tip: Try 'matrix', 'ping' or 'quote' for more fun!"}
            </pre>
          `);
        } else if (target === ".env" || target === "secrets" || target === "secret" || target === "passwords") {
          appendOutput(`<div>${isEs ? "🔐 [ACCESO DENEGADO]: Todas las variables de entorno están cifradas en la bóveda cuántica." : "🔐 [ACCESS DENIED]: All environment variables are locked in the quantum vault."}</div>`, "term-res-warn");
        } else if (target === "flag" || target === "easteregg" || target === "easter-egg") {
          appendOutput(`<div>🚩 <strong class="text-accent font-bold">FLAG&#123;y0u_f0und_th3_d3v0sf3ra_t3rm1n4l_s3cr3t&#125;</strong> — ${isEs ? "¡Felicidades, eres un hacker curioso!" : "Congrats, you are a curious hacker!"}</div>`, "term-res-success");
        } else if (target === "blog" || target === "posts" || target === "articles") {
          appendOutput(`<div>📚 ${isEs ? "¡Explora nuestros posts! Ejecuta 'random' para descubrir uno al instante." : "Explore our blog! Type 'random' to discover one instantly."}</div>`, "term-res-info");
        } else {
          appendOutput(`<div>cat: ${args}: ${isEs ? "No existe el archivo o el gato se lo comió 🐈" : "No such file or directory, or the cat ate it 🐈"}</div>`, "term-res-error");
        }
        break;
      }

      case "cowsay": {
        const msg = args || (isEs ? "¡Sigue programando con pasión!" : "Keep shipping awesome code!");
        appendOutput(`
          <pre class="term-cyan-text font-mono leading-tight whitespace-pre">
 &lt; ${msg} &gt;
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
          </pre>
        `);
        break;
      }

      case "neofetch":
      case "fastfetch": {
        const accent = localStorage.getItem("theme-accent") || "blue";
        appendOutput(`
          <div class="flex flex-col sm:flex-row items-start gap-3">
            <pre class="text-accent font-bold leading-tight font-mono text-xs">
   ____
  / __ \\___ _   __
 / / / / _ \\ | / /
/ /_/ /  __/ |/ / 
\\____/\\___/|___/  
            </pre>
            <div class="text-xs space-y-0.5 font-mono">
              <div><span class="text-accent font-bold">guest@devosfera</span></div>
              <div class="text-foreground/40">-----------------</div>
              <div><strong class="term-cyan-text">OS:</strong> Web / Astro 5.x</div>
              <div><strong class="term-cyan-text">Host:</strong> Devosfera Personal Space</div>
              <div><strong class="term-cyan-text">Uptime:</strong> 24/7 curiosity</div>
              <div><strong class="term-cyan-text">Shell:</strong> bash (devosfera-sh)</div>
              <div><strong class="term-cyan-text">Theme:</strong> ${accent.toUpperCase()}</div>
              <div><strong class="term-cyan-text">Cheat:</strong> ↑ ↑ ↓ ↓ ← → ← → B A (Arcade 80s)</div>
              <div><strong class="term-cyan-text">Stack:</strong> Tailwind + TypeScript + Pagefind</div>
            </div>
          </div>
        `);
        break;
      }

      case "audio":
      case "lofi":
      case "music": {
        const audioBtn = document.getElementById("intro-audio-btn") || document.getElementById("intro-audio-compact-btn");
        if (audioBtn) {
          audioBtn.click();
          appendOutput(`<div>${isEs ? "Reproducción de audio alternada." : "Toggled audio playback."}</div>`, "term-res-info");
        } else {
          appendOutput(`<div>${isEs ? "Reproductor no disponible en esta vista." : "Audio player not available in this view."}</div>`, "term-res-warn");
        }
        break;
      }

      case "whoami":
      case "about":
        appendOutput(`
          <div class="space-y-1">
            <div><strong class="text-accent">Andrés (0xdres)</strong> - Systems Engineer & Creative Developer 🚀</div>
            <div class="text-foreground/80">${isEs ? "Apasionado por la inteligencia artificial, desarrollo web moderno, arquitectura de software y experiencias de usuario con alta atención al detalle." : "Passionate about AI agents, modern web development, software architecture, and pixel-perfect sensory user experiences."}</div>
            <div class="text-xs text-foreground/60 pt-1">${isEs ? "Blog creado con Astro, Tailwind CSS, TypeScript y Web Audio API." : "Built with Astro, Tailwind CSS, TypeScript, and Web Audio API."}</div>
          </div>
        `, "term-res-info");
        break;

      case "clear":
      case "cls":
        clearOutput();
        break;

      case "exit":
      case "close":
      case "quit":
        closeTerminal();
        break;

      case "sudo":
        appendOutput(`<div>${isEs ? "¡Buen intento! Ya tienes superpoderes de root en este blog. 😎" : "Nice try! You already have full root superpowers in this blog. 😎"}</div>`, "term-res-warn");
        break;

      default:
        appendOutput(`<div>${isEs ? "Comando no reconocido. Escribe 'help' para ver la lista." : "Command not found. Type 'help' for available commands."}</div>`, "term-res-error");
        break;
    }
  }

  // Event Listeners
  trigger.addEventListener("click", openTerminal);
  backdrop?.addEventListener("click", closeTerminal);
  closeBtn?.addEventListener("click", closeTerminal);
  clearBtn?.addEventListener("click", clearOutput);

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const cmd = chip.dataset.cmd;
      if (cmd) {
        if (input) input.value = cmd;
        executeCommand(cmd);
        input.value = "";
      }
    });
  });

  input.addEventListener("input", () => {
    soundFx.playKeyClick();
  });

  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        input.value = commandHistory[historyIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex] || "";
      } else {
        historyIndex = -1;
        input.value = "";
      }
    }
  });

  form?.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    const val = input.value;
    input.value = "";
    executeCommand(val);
  });

  const onKeyDownGlobal = (e: KeyboardEvent) => {
    // If modal is open, ESC closes it and frees memory
    if (!modal.classList.contains("hidden")) {
      if (e.key === "Escape") {
        closeTerminal();
      }
      return;
    }

    // Check that we are strictly on the home page
    const isHome =
      document.querySelector('[data-layout="index"]') !== null ||
      window.location.pathname === "/" ||
      window.location.pathname === "/es" ||
      window.location.pathname === "/es/";
    if (!isHome) return;

    // Ignore modifier keys to not hijack browser / OS shortcuts
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (e.repeat) return;

    // Ignore if user is currently typing in an input, textarea, select or contenteditable
    const target = e.target as HTMLElement | null;
    const activeTag = document.activeElement?.tagName;
    const isEditable =
      document.activeElement?.hasAttribute("contenteditable") ||
      activeTag === "INPUT" ||
      activeTag === "TEXTAREA" ||
      activeTag === "SELECT" ||
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "SELECT";
    if (isEditable) return;

    // Ignore if any other modal is active
    const isSearchActive = document.getElementById("search-modal")?.classList.contains("active");
    const isShortcutsActive = document.getElementById("shortcuts-modal")?.classList.contains("active");
    const isRouletteActive = !document.getElementById("surprise-roulette-modal")?.classList.contains("hidden");
    if (isSearchActive || isShortcutsActive || isRouletteActive) return;

    // Open terminal when 'c' or 'C' is pressed
    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      openTerminal();
    }
  };

  window.addEventListener("keydown", onKeyDownGlobal);

  document.addEventListener("astro:before-swap", () => {
    window.removeEventListener("keydown", onKeyDownGlobal);
    stopMatrixRain();
  }, { once: true });
}
