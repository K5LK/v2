export type IntroAudioTrack = {
  name: string;
  url: string;
  artist?: string;
  duration?: number;
  isStream?: boolean;
};

export type MetingConfig = {
  api: string;
  server: string;
  type: string;
  id: string;
  fallbackApis?: readonly string[];
};

type IntroAudioConfig = {
  src: string;
  label: string;
  isStream: boolean;
  durationHint: number;
  mode?: "meting";
  meting?: MetingConfig;
};

export type IntroAudioStore = IntroAudioConfig & {
  audio: HTMLAudioElement;
  hasStarted: boolean;
  listenersBound: boolean;
  playlist: readonly IntroAudioTrack[];
  currentTrackIndex: number;
  artist: string;
  metingLoadKey?: string;
  metingLoadPromise?: Promise<void>;
};

export type IntroAudioState = {
  src: string;
  label: string;
  artist: string;
  isStream: boolean;
  playing: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  trackIndex: number;
  trackCount: number;
};

export const INTRO_AUDIO_STATE_EVENT = "intro-audio:state";

declare global {
  interface Window {
    __introAudioStore?: IntroAudioStore;
  }
}

const getEffectiveDuration = (store: IntroAudioStore) => {
  if (store.isStream) return 0;
  const mediaDuration = store.audio.duration;

  if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
    return Math.floor(mediaDuration);
  }

  return Math.max(0, Math.floor(store.durationHint));
};

const readState = (store: IntroAudioStore): IntroAudioState => ({
  src: store.src,
  label: store.label,
  artist: store.artist,
  isStream: store.isStream,
  playing: !store.audio.paused,
  hasStarted: store.hasStarted,
  currentTime: store.isStream ? 0 : store.audio.currentTime,
  duration: getEffectiveDuration(store),
  trackIndex: store.currentTrackIndex,
  trackCount: store.playlist.length,
});

export const emitIntroAudioState = (store: IntroAudioStore) => {
  window.dispatchEvent(
    new CustomEvent<IntroAudioState>(INTRO_AUDIO_STATE_EVENT, {
      detail: readState(store),
    })
  );
};

const bindStoreListeners = (store: IntroAudioStore) => {
  if (store.listenersBound) return;

  const emit = () => emitIntroAudioState(store);

  store.audio.addEventListener("play", () => {
    store.hasStarted = true;
    emit();
  });
  store.audio.addEventListener("pause", emit);
  store.audio.addEventListener("ended", () => {
    if (store.playlist.length > 1) {
      setIntroAudioTrack(
        store,
        (store.currentTrackIndex + 1) % store.playlist.length,
        true
      );
      return;
    }

    emit();
  });
  store.audio.addEventListener("timeupdate", emit);
  store.audio.addEventListener("loadedmetadata", emit);
  store.audio.addEventListener("durationchange", emit);

  store.listenersBound = true;
};

const configureStore = (store: IntroAudioStore, next: IntroAudioConfig) => {
  const loadedMetingPlaylist =
    next.mode === "meting" &&
    next.meting &&
    store.metingLoadKey === JSON.stringify(next.meting) &&
    store.metingLoadPromise;
  const playlist = loadedMetingPlaylist
    ? store.playlist
    : [
        {
          name: next.label,
          url: next.src,
          duration: next.durationHint,
          isStream: next.isStream,
        },
      ];
  const currentIndex =
    playlist[store.currentTrackIndex]?.url === store.src
      ? store.currentTrackIndex
      : playlist.findIndex(track => track.url === store.src);
  const configuredIndex = playlist.findIndex(track => track.url === next.src);
  const nextIndex =
    currentIndex >= 0
      ? currentIndex
      : configuredIndex >= 0
        ? configuredIndex
        : 0;
  const track = playlist[nextIndex];
  const sourceChanged = store.src !== track.url;
  const shouldResume = !store.audio.paused;

  store.playlist = playlist;
  store.currentTrackIndex = nextIndex;
  store.label = track.name;
  store.artist = track.artist ?? "";
  store.isStream = track.isStream ?? false;
  store.durationHint = track.duration ?? next.durationHint;

  if (sourceChanged) {
    store.audio.pause();
    store.audio.src = track.url;
    store.audio.preload = store.isStream ? "none" : "metadata";
    store.audio.load();
    store.src = track.url;
    store.hasStarted = false;

    if (shouldResume) {
      void store.audio.play().catch(() => {
        /* playback blocked by browser */
      });
    }
  } else {
    store.audio.preload = store.isStream ? "none" : "metadata";
  }
};

export const setIntroAudioTrack = (
  store: IntroAudioStore,
  index: number,
  shouldPlay = !store.audio.paused
) => {
  const track = store.playlist[index];
  if (!track) return;

  store.audio.pause();
  store.currentTrackIndex = index;
  store.src = track.url;
  store.label = track.name;
  store.artist = track.artist ?? "";
  store.isStream = track.isStream ?? false;
  store.durationHint = track.duration ?? 0;
  store.hasStarted = false;
  store.audio.src = track.url;
  store.audio.preload = store.isStream ? "none" : "metadata";
  store.audio.load();
  emitIntroAudioState(store);

  if (shouldPlay) {
    void store.audio.play().catch(() => {
      /* playback blocked by browser */
    });
  }
};

export const nextIntroAudioTrack = (store: IntroAudioStore) => {
  if (store.playlist.length > 1) {
    setIntroAudioTrack(
      store,
      (store.currentTrackIndex + 1) % store.playlist.length
    );
  }
};

export const previousIntroAudioTrack = (store: IntroAudioStore) => {
  if (store.playlist.length > 1) {
    const index =
      (store.currentTrackIndex - 1 + store.playlist.length) %
      store.playlist.length;
    setIntroAudioTrack(store, index);
  }
};

const createMetingUrl = (template: string, config: MetingConfig) =>
  template
    .replaceAll(":server", encodeURIComponent(config.server))
    .replaceAll(":type", encodeURIComponent(config.type))
    .replaceAll(":id", encodeURIComponent(config.id))
    .replaceAll(":r", String(Date.now()));

const getPlayableMetingUrl = (
  url: string,
  config: MetingConfig
): string => {
  if (!config.fallbackApis?.length) return url;

  try {
    const trackUrl = new URL(url);
    const primaryApiUrl = new URL(
      createMetingUrl(config.api, { ...config, type: "url", id: "track-id" })
    );
    const trackId = trackUrl.searchParams.get("id");

    if (
      trackId &&
      trackUrl.origin === primaryApiUrl.origin &&
      trackUrl.searchParams.get("type") === "url"
    ) {
      return createMetingUrl(config.fallbackApis[0], {
        ...config,
        type: "url",
        id: trackId,
      });
    }
  } catch {
    return url;
  }

  return url;
};

const parseMetingTracks = (
  data: unknown,
  config: MetingConfig
): IntroAudioTrack[] => {
  if (!Array.isArray(data)) {
    throw new Error("Meting API response was not a track list.");
  }

  return data.flatMap((item): IntroAudioTrack[] => {
    if (!item || typeof item !== "object") return [];

    const track = item as Record<string, unknown>;
    if (typeof track.url !== "string" || !track.url) return [];

    const artist = Array.isArray(track.artist)
      ? track.artist
          .filter((name): name is string => typeof name === "string")
          .join(" / ")
      : typeof track.artist === "string"
        ? track.artist
        : "";
    const duration =
      typeof track.duration === "number"
        ? track.duration
        : typeof track.time === "number"
          ? track.time
          : undefined;

    return [
      {
        name:
          typeof track.name === "string" && track.name
            ? track.name
            : typeof track.title === "string" && track.title
              ? track.title
              : "Unknown title",
        url: getPlayableMetingUrl(track.url, config),
        artist: artist || (typeof track.author === "string" ? track.author : ""),
        duration,
      },
    ];
  });
};

export const loadMetingPlaylist = (
  store: IntroAudioStore,
  config: MetingConfig
) => {
  const key = JSON.stringify(config);
  if (store.metingLoadKey === key && store.metingLoadPromise) {
    return store.metingLoadPromise;
  }

  store.metingLoadKey = key;
  store.metingLoadPromise = (async () => {
    let lastError: unknown;

    for (const endpoint of [config.api, ...(config.fallbackApis ?? [])]) {
      try {
        const response = await fetch(createMetingUrl(endpoint, config));
        if (!response.ok) {
          throw new Error(`Meting API returned HTTP ${response.status}.`);
        }

        const tracks = parseMetingTracks(await response.json(), config);
        if (tracks.length === 0) {
          throw new Error("Meting API returned no playable tracks.");
        }

        const currentIndex = tracks.findIndex(track => track.url === store.src);
        store.playlist = tracks;
        setIntroAudioTrack(store, currentIndex >= 0 ? currentIndex : 0);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    // eslint-disable-next-line no-console
    console.error(
      "Unable to load the Meting playlist from configured APIs.",
      lastError
    );
  })();

  return store.metingLoadPromise;
};

export const getIntroAudioStore = (config: IntroAudioConfig) => {
  const existing = window.__introAudioStore;

  if (existing) {
    configureStore(existing, config);
    bindStoreListeners(existing);
    emitIntroAudioState(existing);
    return existing;
  }

  const playlist: IntroAudioTrack[] = [
    {
      name: config.label,
      url: config.src,
      duration: config.durationHint,
      isStream: config.isStream,
    },
  ];
  const initialIndex = Math.max(
    0,
    playlist.findIndex(track => track.url === config.src)
  );
  const initialTrack = playlist[initialIndex];
  const isStream = initialTrack.isStream ?? false;
  const audio = new Audio();
  if (initialTrack.url) audio.src = initialTrack.url;
  audio.preload = isStream ? "none" : "metadata";

  const store: IntroAudioStore = {
    ...config,
    src: initialTrack.url,
    label: initialTrack.name,
    artist: initialTrack.artist ?? "",
    isStream,
    durationHint: initialTrack.duration ?? config.durationHint,
    playlist,
    currentTrackIndex: initialIndex,
    audio,
    hasStarted: false,
    listenersBound: false,
  };

  bindStoreListeners(store);
  window.__introAudioStore = store;
  emitIntroAudioState(store);

  return store;
};
