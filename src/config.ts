export const SITE = {
  website: "https://devosfera.vercel.app/",
  author: "Sandun Lakshan",
  profile:
    (typeof process !== "undefined" && process.env?.PUBLIC_SOCIAL_GITHUB) ||
    (import.meta.env?.PUBLIC_SOCIAL_GITHUB ?? "https://github.com/0xdres"),
  desc: "A space where curiosity becomes code. Exploring web development, software architecture and everything that makes the tech world spin.",
  title: "Astro Devosfera",
  ogImage: "devosfera-og.webp", // located in the public folder
  lightAndDarkMode: true,
  postPerIndex: 6,
  postPerPage: 12,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showGalleries: true,
  showGalleriesInIndex: true, // Show galleries in the general paginated list (only if showGalleries is true)
  showBackButton: true, // show back button in post detail
  showTagsInCards: true, // show tag pills at the bottom of post cards
  showCoverImages: false, // show cover images (OG) in post cards (requires pnpm build in dev mode)
  indexPostsGrid: false, // show recent/featured posts in grid layout on the home page (like /posts page)
  heroTerminalPrompt: {
    prefix: "~", // highlighted part on the left
    path: "/open-terminal", // central prompt text (suggestive interactive command)
    suffix: "$", // terminal symbol on the right
  },
  backdropEffects: {
    cursorGlow: true, // cursor tracking with soft halo
    grain: true, // background visual noise layer
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "America/Guatemala", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  introAudio: {
    enabled: true, // show/hide intro player in home and compact player while navigating
    mode: "meting" as const,
    // src: path to file (relative to /public or absolute URL). Example: "/intro.mp3" or "https://example.com/stream"
    src: "",
    isStream: false,
    label: "", // display label in player
    duration: 30, // duration in seconds (used for local files, ignored on streams)
    meting: {
      api: "https://y.qq.com/meting/?server=:server&type=:type&id=:id",
      server: "tencent",
      type: "playlist",
      id: "9789984391",
      fallbackApis: [
        "https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
      ],
    },
  },
} as const;
