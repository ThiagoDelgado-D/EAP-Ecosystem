const SOUND_ENABLED_STORAGE_KEY = 'pomodoro_sound_enabled';
const SOUND_ID_STORAGE_KEY = 'pomodoro_sound_id';
const VOLUME_STORAGE_KEY = 'pomodoro_sound_volume';
const DEFAULT_VOLUME = 0.6;

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

export const SOUND_ID = {
  CHIME: 'chime',
  DIGITAL: 'digital',
  KITCHEN: 'kitchen',
  WOOD: 'wood',
  BELL_LONG: 'bell-long',
  BELLS: 'bells',
  NOTIFICATION: 'notification',
  NOTIFICATION_ALT: 'notification-alt',
  DING: 'ding',
} as const;

export type SoundId = (typeof SOUND_ID)[keyof typeof SOUND_ID];

export const SOUND_OPTIONS: ReadonlyArray<{
  id: SoundId;
  label: string;
  description: string;
  url: string;
}> = [
  {
    id: SOUND_ID.CHIME,
    label: 'Chime',
    description: 'A clear bell chime — the default.',
    url: '/sounds/universfield-clear-bell-chime-487898.mp3',
  },
  {
    id: SOUND_ID.DIGITAL,
    label: 'Digital',
    description: 'A digital alarm clock beep.',
    url: '/sounds/digital.mp3',
  },
  {
    id: SOUND_ID.KITCHEN,
    label: 'Kitchen',
    description: 'A toaster-oven style ding.',
    url: '/sounds/kitchen.mp3',
  },
  {
    id: SOUND_ID.WOOD,
    label: 'Wood',
    description: 'A short wood-block knock.',
    url: '/sounds/wood.mp3',
  },
  {
    id: SOUND_ID.BELL_LONG,
    label: 'Bell',
    description: 'A longer notification bell.',
    url: '/sounds/dragon-studio-notification-bell-sound-376888.mp3',
  },
  {
    id: SOUND_ID.BELLS,
    label: 'Bells',
    description: 'A pair of layered bell tones.',
    url: '/sounds/freesound_community-bells-2-31725.mp3',
  },
  {
    id: SOUND_ID.NOTIFICATION,
    label: 'Notification',
    description: 'A short notification ping.',
    url: '/sounds/universfield-new-notification-051-494246.mp3',
  },
  {
    id: SOUND_ID.NOTIFICATION_ALT,
    label: 'Notification (alt)',
    description: 'An alternate notification ping.',
    url: '/sounds/universfield-new-notification-09-352705.mp3',
  },
  {
    id: SOUND_ID.DING,
    label: 'Ding',
    description: 'A quick, light ding.',
    url: '/sounds/freesound_community-ding-101492.mp3',
  },
];

const SOUND_URL_BY_ID = new Map(SOUND_OPTIONS.map((option) => [option.id, option.url]));

export function readSoundId(): SoundId {
  try {
    const raw = localStorage.getItem(SOUND_ID_STORAGE_KEY);
    const known = SOUND_OPTIONS.some((option) => option.id === raw);
    return known ? (raw as SoundId) : SOUND_ID.CHIME;
  } catch {
    return SOUND_ID.CHIME;
  }
}

export function writeSoundId(id: SoundId): void {
  try {
    localStorage.setItem(SOUND_ID_STORAGE_KEY, id);
  } catch {
    /* per-viewer convenience only */
  }
}

export function readVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function writeVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(Math.min(1, Math.max(0, volume))));
  } catch {
    /* per-viewer convenience only */
  }
}

export function playBoundaryChime(
  soundId: SoundId = readSoundId(),
  volume: number = readVolume(),
): void {
  try {
    const url = SOUND_URL_BY_ID.get(soundId) ?? SOUND_URL_BY_ID.get(SOUND_ID.CHIME)!;
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume));
    void audio.play()?.catch(() => {});
  } catch {
    // Sound is a courtesy, never a requirement — ignore playback failures.
  }
}
