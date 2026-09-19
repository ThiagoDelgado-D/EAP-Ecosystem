import { Component, computed, inject, signal } from '@angular/core';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { SOUND_OPTIONS, playBoundaryChime, type SoundId } from '@features/pomodoro/application/pomodoro-sound';
import {
  POMODORO_VIEW_MODE,
  readDefaultViewMode,
  readHideShortcutHints,
  writeDefaultViewMode,
  writeHideShortcutHints,
  type PomodoroViewMode,
} from '@features/pomodoro/application/pomodoro-view-preferences';

@Component({
  selector: 'app-pomodoro-settings',
  standalone: true,
  templateUrl: './pomodoro-settings.component.html',
})
export class PomodoroSettingsComponent {
  private readonly store = inject(PomodoroSessionStore);

  readonly SOUND_OPTIONS = SOUND_OPTIONS;
  readonly POMODORO_VIEW_MODE = POMODORO_VIEW_MODE;

  readonly soundEnabled = this.store.soundEnabled;
  readonly soundId = this.store.soundId;
  readonly volume = this.store.volume;
  readonly volumePercent = computed(() => Math.round(this.volume() * 100));
  readonly volumeTrackBackground = computed(
    () => `linear-gradient(to right, #7c3aed 0%, #7c3aed ${this.volumePercent()}%, #334155 ${this.volumePercent()}%, #334155 100%)`,
  );

  readonly defaultViewMode = signal<PomodoroViewMode>(readDefaultViewMode());
  private readonly hideShortcutHints = signal(readHideShortcutHints());
  readonly showShortcutHints = computed(() => !this.hideShortcutHints());

  toggleSoundEnabled(): void {
    this.store.toggleSound();
  }

  selectSound(id: SoundId): void {
    this.store.setSoundId(id);
  }

  previewSound(id: SoundId): void {
    playBoundaryChime(id, this.volume());
  }

  setVolumePercent(percent: number): void {
    this.store.setVolume(percent / 100);
  }

  selectViewMode(mode: PomodoroViewMode): void {
    this.defaultViewMode.set(mode);
    writeDefaultViewMode(mode);
  }

  toggleShortcutHints(): void {
    const nextHidden = !this.hideShortcutHints();
    this.hideShortcutHints.set(nextHidden);
    writeHideShortcutHints(nextHidden);
  }
}
