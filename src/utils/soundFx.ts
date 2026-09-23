/**
 * soundFx.ts
 *
 * Centralized, zero-dependency Web Audio API synthesizer for tactile UI micro-sounds.
 * Provides organic, mechanical micro-switch, wood cog, and celesta bell audio synthesis.
 *
 * Capabilities:
 * - 100% synthesized in real-time (0 KB external audio files).
 * - Mobile Haptic Feedback (navigator.vibrate) synced to sound events.
 * - 8-Bit NES Chiptune fanfare for the Konami Code easter egg.
 * - Global Mute/Unmute state persistence in localStorage with reactive event broadcasting.
 */

const STORAGE_KEY = "ui-sound-fx";
const CHANGE_EVENT = "soundfx:change";

// Harmonic frequencies mapped to each accent color for tactile chromatic feedback
const ACCENT_PITCH_MAP: Record<string, number> = {
  blue: 900,
  green: 1050,
  purple: 1200,
  amber: 1350,
  rose: 1500,
  arcade: 1650,
};

class SoundFxEngine {
  private ctx: AudioContext | null = null;

  /**
   * Lazy-initializes and resumes the shared AudioContext safely on user gesture.
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Safe mobile haptic feedback trigger (respects Mute FX).
   */
  public vibrate(pattern: number | number[] = 10): void {
    if (typeof window === "undefined" || !this.isEnabled()) return;
    try {
      if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  /**
   * Check if sound effects are currently enabled.
   */
  public isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "false";
  }

  /**
   * Enable or disable sound effects globally and broadcast event.
   */
  public setEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: { enabled } })
    );
  }

  /**
   * Toggle sound effects on/off, play confirmation feedback, and return new state.
   */
  public toggle(): boolean {
    const newState = !this.isEnabled();
    this.setEnabled(newState);
    this.playMuteAlert(newState);
    return newState;
  }

  /**
   * Toggle Switch Sound: Analog mechanical toggle switch click (650Hz -> 320Hz).
   */
  public playSwitch(): void {
    if (!this.isEnabled()) return;
    this.vibrate(10);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.018);

      gain.gain.setValueAtTime(0.065, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.026);
    } catch {}
  }

  /**
   * Swatch / Chip Pop Sound: Woody organic bubble pop (downward pitch bend).
   */
  public playPop(accentOrFreq: string | number = "blue"): void {
    if (!this.isEnabled()) return;
    this.vibrate(12);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const pitch =
        typeof accentOrFreq === "number"
          ? accentOrFreq
          : ACCENT_PITCH_MAP[accentOrFreq.toLowerCase()] || 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, ctx.currentTime + 0.008);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, ctx.currentTime + 0.024);

      gain.gain.setValueAtTime(0.075, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.024);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }

  /**
   * Navigation / Modal Micro-Tap: Mouse micro-switch / key tap (1200Hz -> 500Hz).
   */
  public playTap(pitch = 1200): void {
    if (!this.isEnabled()) return;
    this.vibrate(8);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, ctx.currentTime + 0.012);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {}
  }

  /**
   * Drum / Item Tick: Wood / mechanical gear cog tick.
   */
  public playTick(pitch = 950): void {
    if (!this.isEnabled()) return;
    this.vibrate(6);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, ctx.currentTime + 0.018);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {}
  }

  /**
   * Terminal Keypress Click: Cherry MX Blue key clack with pitch jitter.
   */
  public playKeyClick(): void {
    if (!this.isEnabled()) return;
    this.vibrate(5);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200 + Math.random() * 300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.018);
    } catch {}
  }

  /**
   * Command Execution Tone: Metallic bell chime (D5 -> A5).
   */
  public playExecute(): void {
    if (!this.isEnabled()) return;
    this.vibrate(15);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.04); // A5

      gain.gain.setValueAtTime(0.065, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  /**
   * Winning Article Triumph Chime: Acoustic celesta / music box victory arpeggio.
   */
  public playChime(notes: number[] = [523.25, 659.25, 783.99, 1046.5]): void {
    if (!this.isEnabled()) return;
    this.vibrate([20, 30, 20, 30, 40]);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + i * 0.04 + 0.6
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.75);
      });
    } catch {}
  }

  /**
   * Retro 8-bit NES Chiptune Fanfare (Konami Code Easter Egg).
   */
  public play8BitFanfare(): void {
    if (!this.isEnabled()) return;
    this.vibrate([30, 40, 30, 40, 50, 40, 90]);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const melody = [
        { freq: 523.25, start: 0.0, dur: 0.08 }, // C5
        { freq: 659.25, start: 0.08, dur: 0.08 }, // E5
        { freq: 783.99, start: 0.16, dur: 0.08 }, // G5
        { freq: 1046.5, start: 0.24, dur: 0.12 }, // C6
        { freq: 783.99, start: 0.36, dur: 0.08 }, // G5
        { freq: 1046.5, start: 0.44, dur: 0.45 }, // C6 long
      ];

      melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

        if (note.dur > 0.2) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(14, ctx.currentTime + note.start);
          lfoGain.gain.setValueAtTime(15, ctx.currentTime + note.start);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(ctx.currentTime + note.start);
          lfo.stop(ctx.currentTime + note.start + note.dur);
        }

        gain.gain.setValueAtTime(0.08, ctx.currentTime + note.start);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + note.start + note.dur
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + note.start);
        osc.stop(ctx.currentTime + note.start + note.dur + 0.02);
      });
    } catch {}
  }

  /**
   * Pentatonic Pad Synthesizer: Warm acoustic celesta / marimba tone with organic resonant decay.
   *
   * @param padIndex Index from 0 to 15.
   */
  public playPentatonicPad(padIndex: number): void {
    if (!this.isEnabled()) return;
    this.vibrate(8);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const PENTATONIC_FREQS = [
        261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
        523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
        1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00, // C6, D6, E6, G6, A6, C7
      ];
      const freq = PENTATONIC_FREQS[padIndex % PENTATONIC_FREQS.length] || 440;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  /**
   * Quiz Correct Answer Feedback: Upward harmonic major triad chord.
   */
  public playQuizSuccess(): void {
    if (!this.isEnabled()) return;
    this.vibrate([15, 30, 45]);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  /**
   * Quiz Incorrect Answer Feedback: Low descending buzzer tone.
   */
  public playQuizError(): void {
    if (!this.isEnabled()) return;
    this.vibrate([40, 20, 40]);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  /**
   * Mute Alert Feedback: Mechanical latch snap lock/unlock.
   */
  private playMuteAlert(isNowEnabled: boolean): void {
    this.vibrate(isNowEnabled ? [15, 20, 25] : [20]);

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      if (isNowEnabled) {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.06);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05);
      }
      gain.gain.setValueAtTime(0.055, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }
}

// Global Singleton Instance
export const soundFx = new SoundFxEngine();
