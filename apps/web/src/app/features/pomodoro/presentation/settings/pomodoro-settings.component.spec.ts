import { TestBed } from '@angular/core/testing';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { mockAudio } from '@features/pomodoro/application/mocks/mock-audio-element';
import { mockLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { PomodoroSettingsComponent } from './pomodoro-settings.component';

function setup() {
  const repository = mockPomodoroRepository();

  TestBed.configureTestingModule({
    providers: [PomodoroSessionStore, { provide: PomodoroRepository, useValue: repository }],
  });

  const component = TestBed.createComponent(PomodoroSettingsComponent).componentInstance;
  return { component };
}

describe('PomodoroSettingsComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to sound enabled with the chime selected', () => {
    const { component } = setup();

    expect(component.soundEnabled()).toBe(true);
    expect(component.soundId()).toBe('chime');
  });

  test('toggleSoundEnabled should flip and persist the preference', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.toggleSoundEnabled();

    expect(component.soundEnabled()).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_enabled', 'false');
  });

  test('selectSound should update and persist the chosen sound', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.selectSound('kitchen');

    expect(component.soundId()).toBe('kitchen');
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_id', 'kitchen');
  });

  test('previewSound should play the requested sound regardless of the enabled toggle', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);
    const { component } = setup();
    component.toggleSoundEnabled();

    component.previewSound('digital');

    expect(instances[0].src).toBe('/sounds/digital.mp3');
    expect(instances[0].play).toHaveBeenCalled();
  });

  test('should default the volume to 60%', () => {
    const { component } = setup();

    expect(component.volumePercent()).toBe(60);
  });

  test('setVolumePercent should update the volume and persist it as a 0-1 fraction', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.setVolumePercent(25);

    expect(component.volumePercent()).toBe(25);
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_volume', '0.25');
  });

  test('previewSound should play at the currently selected volume', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);
    const { component } = setup();
    component.setVolumePercent(40);

    component.previewSound('kitchen');

    expect(instances[0].volume).toBe(0.4);
  });

  test('should default the view mode to full', () => {
    const { component } = setup();

    expect(component.defaultViewMode()).toBe('full');
  });

  test('selectViewMode should update and persist the chosen default view', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.selectViewMode('mini');

    expect(component.defaultViewMode()).toBe('mini');
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_default_view_mode', 'mini');
  });

  test('should default to showing the keyboard shortcut hints', () => {
    const { component } = setup();

    expect(component.showShortcutHints()).toBe(true);
  });

  test('toggleShortcutHints should flip and persist the preference', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.toggleShortcutHints();

    expect(component.showShortcutHints()).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_hide_shortcut_hints', 'true');
  });
});
