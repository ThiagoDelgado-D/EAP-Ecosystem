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
    vi.stubGlobal('localStorage', mockLocalStorage(null));
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
    vi.stubGlobal('localStorage', mockLocalStorage(null));
    const { component } = setup();
    component.toggleSoundEnabled();

    component.previewSound('digital');

    expect(instances[0].src).toBe('/sounds/digital.mp3');
    expect(instances[0].play).toHaveBeenCalled();
  });

  test('should default the volume to 60%', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));
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
    vi.stubGlobal('localStorage', mockLocalStorage(null));
    const { component } = setup();
    component.setVolumePercent(40);

    component.previewSound('kitchen');

    expect(instances[0].volume).toBe(0.4);
  });

  test('should default the view mode to full', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));
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
    vi.stubGlobal('localStorage', mockLocalStorage(null));
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

  test('should default the default duration to 25 minutes', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));
    const { component } = setup();

    expect(component.defaultDurationMin()).toBe(25);
    expect(component.isCustomDefaultDuration()).toBe(false);
  });

  test('selectDefaultDuration should update and persist a preset', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.selectDefaultDuration(50);

    expect(component.defaultDurationMin()).toBe(50);
    expect(component.isCustomDefaultDuration()).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_default_duration_min', '50');
  });

  test('onCustomDefaultDurationInput should update and persist a custom duration, clamped to the ceiling', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    const { component } = setup();

    component.onCustomDefaultDurationInput('45');

    expect(component.defaultDurationMin()).toBe(45);
    expect(component.isCustomDefaultDuration()).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_default_duration_min', '45');

    component.onCustomDefaultDurationInput('9999');

    expect(component.defaultDurationMin()).toBe(component.MAX_PLANNED_DURATION_MIN);
  });

  test('onCustomDefaultDurationInput should leave the duration unchanged while the field is emptied', () => {
    const { component } = setup();
    component.selectDefaultDuration(50);

    component.onCustomDefaultDurationInput('');

    expect(component.customDefaultDurationInput()).toBe('');
    expect(component.defaultDurationMin()).toBe(50);
  });
});
