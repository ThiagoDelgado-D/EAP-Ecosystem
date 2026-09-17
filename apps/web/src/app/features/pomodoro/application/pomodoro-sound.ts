const SOUND_ENABLED_STORAGE_KEY = 'pomodoro_sound_enabled';

export function readSoundPreference(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_ENABLED_STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function writeSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    /* per-viewer convenience only */
  }
}

export function playBoundaryChime(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {
    // Sound is a courtesy, never a requirement — ignore playback failures.
  }
}
