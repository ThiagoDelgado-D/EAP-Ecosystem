import { Component, computed, inject, signal } from '@angular/core';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { SOUND_OPTIONS, playBoundaryChime, type SoundId } from '@features/pomodoro/application/pomodoro-sound';
import {
  POMODORO_VIEW_MODE,
  readDefaultDurationMin,
  readDefaultViewMode,
  readHideShortcutHints,
  writeDefaultDurationMin,
  writeDefaultViewMode,
  writeHideShortcutHints,
  type PomodoroViewMode,
} from '@features/pomodoro/application/pomodoro-view-preferences';
import { DURATION_PRESETS, MAX_PLANNED_DURATION_MIN } from '@features/pomodoro/domain/pomodoro.model';

@Component({
  selector: 'app-pomodoro-settings',
  standalone: true,
  templateUrl: './pomodoro-settings.component.html',
})
export class PomodoroSettingsComponent {
  private readonly store = inject(PomodoroSessionStore);

  readonly SOUND_OPTIONS = SOUND_OPTIONS;
  readonly POMODORO_VIEW_MODE = POMODORO_VIEW_MODE;
  readonly DURATION_PRESETS = DURATION_PRESETS;
  readonly MAX_PLANNED_DURATION_MIN = MAX_PLANNED_DURATION_MIN;
  readonly maxDurationDigits = String(MAX_PLANNED_DURATION_MIN).length;

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

  readonly defaultDurationMin = signal(readDefaultDurationMin());
  readonly customDefaultDurationInput = signal('');
  readonly isCustomDefaultDuration = computed(() => !DURATION_PRESETS.includes(this.defaultDurationMin()));

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

  selectDefaultDuration(minutes: number): void {
    this.defaultDurationMin.set(minutes);
    this.customDefaultDurationInput.set('');
    writeDefaultDurationMin(minutes);
  }

  onCustomDefaultDurationInput(value: string): void {
    const digits = value.replace(/\D/g, '');
    this.customDefaultDurationInput.set(digits);
    if (digits === '') return;
    const minutes = Math.min(MAX_PLANNED_DURATION_MIN, Math.round(Number(digits)));
    this.defaultDurationMin.set(minutes);
    writeDefaultDurationMin(minutes);
  }
}
