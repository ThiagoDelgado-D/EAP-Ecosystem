import { TestBed } from '@angular/core/testing';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import { mockLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import type { Session, SuggestedCandidate } from '@features/pomodoro/domain/pomodoro.model';
import { StartComponent } from './start.component';

function setup(suggestions: SuggestedCandidate[] = []) {
  const navigateByUrl = vi.fn();
  const { providers, pomodoroRepository } = createPomodoroComponentTestProviders(navigateByUrl);
  pomodoroRepository.suggestions = suggestions;

  TestBed.configureTestingModule({ providers });

  const overlayHost = TestBed.inject(PomodoroOverlayHostService);
  const component = TestBed.createComponent(StartComponent).componentInstance;
  return { component, pomodoroRepository, overlayHost, navigateByUrl };
}

const cleanArchSuggestion: SuggestedCandidate = {
  pathId: crypto.randomUUID(),
  pathTitle: 'Frontend Architecture Mastery',
  nodeId: crypto.randomUUID(),
  nodeTitle: 'Clean Architecture',
  resourceId: crypto.randomUUID(),
  score: 0.9,
  why: ['continues last session'],
};

describe('StartComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default the duration to the stored default-duration preference', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('50'));
    const { component } = setup();

    expect(component.selectedDuration()).toBe(50);
    expect(component.durationClock()).toBe('50:00');
  });

  test('should default to showing the keyboard shortcut hint', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));
    const { component } = setup();

    expect(component.hideShortcutHints()).toBe(false);
  });

  test('should read the hide-shortcut-hints preference from Settings', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('true'));
    const { component } = setup();

    expect(component.hideShortcutHints()).toBe(true);
  });

  test('should default to free focus, ready to start, without attaching anything', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));
    const { component } = setup();

    expect(component.hasAttachedMaterial()).toBe(false);
    expect(component.effectiveTarget()).toEqual({ kind: 'free' });
    expect(component.canStart()).toBe(true);
  });

  test('pickDuration should set the duration and clear any pending custom input', () => {
    const { component } = setup();
    component.customDurationInput.set('37');

    component.pickDuration(50);

    expect(component.selectedDuration()).toBe(50);
    expect(component.customDurationInput()).toBe('');
    expect(component.isCustomDurationActive()).toBe(false);
  });

  test('onCustomDurationInput should set a custom duration, clamped to the ceiling', () => {
    const { component } = setup();

    component.onCustomDurationInput('45');
    expect(component.selectedDuration()).toBe(45);
    expect(component.isCustomDurationActive()).toBe(true);

    component.onCustomDurationInput('9999');
    expect(component.selectedDuration()).toBe(component.MAX_PLANNED_DURATION_MIN);
  });

  test('onCustomDurationInput should leave the duration unchanged while the field is emptied', () => {
    const { component } = setup();
    component.pickDuration(50);

    component.onCustomDurationInput('');

    expect(component.customDurationInput()).toBe('');
    expect(component.selectedDuration()).toBe(50);
  });

  test('clearAttachedMaterial should reset back to free focus', () => {
    const { component } = setup();
    component.selectedTarget.set({ kind: 'resource', resourceId: crypto.randomUUID() });
    component.selectedTargetLabel.set({ title: 'Rust Book Chapter 17' });

    component.clearAttachedMaterial();

    expect(component.hasAttachedMaterial()).toBe(false);
    expect(component.selectedTargetLabel()).toBeNull();
    expect(component.effectiveTarget()).toEqual({ kind: 'free' });
  });

  test('should start a free-focus session with the default duration in a single tap', async () => {
    const { component, navigateByUrl } = setup();

    await component.start();

    expect(component.store.activeSession()?.plannedMin).toBe(25);
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should start with the attached material and the chosen intent', async () => {
    const { component } = setup();
    const resourceId = crypto.randomUUID();
    component.selectedTarget.set({ kind: 'resource', resourceId });
    component.intent.set('Finish the current chapter');

    await component.start();

    expect(component.store.activeSession()?.intent).toBe('Finish the current chapter');
  });

  test('should label the primary start action free focus by default, or the attached material once one is picked', () => {
    const { component } = setup();

    expect(component.primaryStartLabel()).toBe('Start free focus');

    component.selectedTarget.set({ kind: 'resource', resourceId: crypto.randomUUID() });
    component.selectedTargetLabel.set({ title: 'Rust Book Chapter 17' });

    expect(component.primaryStartLabel()).toBe('Rust Book Chapter 17');
  });

  test('should offer a quick-start suggestion only while still in free focus', async () => {
    const { component } = setup([cleanArchSuggestion]);
    await Promise.resolve();

    expect(component.topSuggestion()).toEqual(cleanArchSuggestion);
    expect(component.canSuggestQuickStart()).toBe(true);

    component.selectedTarget.set({ kind: 'resource', resourceId: crypto.randomUUID() });

    expect(component.canSuggestQuickStart()).toBe(false);
  });

  test('should not offer a quick-start suggestion when none is available', async () => {
    const { component } = setup([]);
    await Promise.resolve();

    expect(component.canSuggestQuickStart()).toBe(false);
  });

  test('toggleStartMenu should open and close the start menu, stopping the click from bubbling', () => {
    const { component } = setup();
    const event = new MouseEvent('click');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    component.toggleStartMenu(event);
    expect(component.startMenuOpen()).toBe(true);
    expect(stopPropagation).toHaveBeenCalledOnce();

    component.toggleStartMenu(event);
    expect(component.startMenuOpen()).toBe(false);
  });

  test('closeMoreMenu should also close the start menu on any outside click', () => {
    const { component } = setup();
    component.startMenuOpen.set(true);

    component.closeMoreMenu();

    expect(component.startMenuOpen()).toBe(false);
  });

  test('choosePrimaryStart should close the start menu and start with whatever is currently selected', async () => {
    const { component, navigateByUrl } = setup();
    component.startMenuOpen.set(true);

    await component.choosePrimaryStart();

    expect(component.startMenuOpen()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('chooseStartSuggested should attach the top suggestion, close the menu, and start with it', async () => {
    const { component, navigateByUrl } = setup([cleanArchSuggestion]);
    await Promise.resolve();
    component.startMenuOpen.set(true);

    await component.chooseStartSuggested();

    expect(component.startMenuOpen()).toBe(false);
    expect(component.selectedTarget()).toEqual({
      kind: 'node',
      learningPathId: cleanArchSuggestion.pathId,
      learningPathNodeId: cleanArchSuggestion.nodeId,
      resourceId: cleanArchSuggestion.resourceId,
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('chooseStartSuggested should do nothing when there is no suggestion to start with', async () => {
    const { component, navigateByUrl } = setup([]);
    await Promise.resolve();

    await component.chooseStartSuggested();

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  test('should navigate straight to the dashboard when the default view is mini', async () => {
    vi.stubGlobal('localStorage', mockLocalStorage('mini'));
    const { component, navigateByUrl, overlayHost } = setup();

    await component.start();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(navigateByUrl).not.toHaveBeenCalledWith('/pomodoro/active');
    expect(overlayHost.isShown('pomodoro-zen')).toBe(false);
  });

  test('should land on the active screen and open the zen overlay when the default view is zen', async () => {
    vi.stubGlobal('localStorage', mockLocalStorage('zen'));
    const { component, navigateByUrl, overlayHost } = setup();

    await component.start();

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
    expect(overlayHost.isShown('pomodoro-zen')).toBe(true);
  });

  function enterKeydown(target: EventTarget = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  test('should start the session when Enter is pressed', async () => {
    const { component, navigateByUrl } = setup();

    component.onKeydown(enterKeydown());
    await new Promise((resolve) => setTimeout(resolve));

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should ignore Enter while already starting', async () => {
    const { component, navigateByUrl, pomodoroRepository } = setup();
    let resolveStart!: (session: Session) => void;
    pomodoroRepository.startSession = vi.fn(
      () => new Promise<Session>((resolve) => (resolveStart = resolve)),
    );
    void component.start();

    component.onKeydown(enterKeydown());
    resolveStart({ id: crypto.randomUUID(), userId: 'u1', startedAt: new Date(), plannedMin: 25 });
    await new Promise((resolve) => setTimeout(resolve));

    expect(navigateByUrl).toHaveBeenCalledTimes(1);
  });

  test('should offer both attach and intention entries when nothing is attached yet', () => {
    const { component } = setup();

    expect(component.hasMoreActions()).toBe(true);
  });

  test('should drop the menu entirely once material is attached and an intention is already set', () => {
    const { component } = setup();
    component.selectedTarget.set({ kind: 'resource', resourceId: crypto.randomUUID() });
    component.chooseAddIntention();
    component.intent.set('Finish the current chapter');

    expect(component.hasMoreActions()).toBe(false);
  });

  test('toggleMoreMenu should open and close the menu, stopping the click from bubbling', () => {
    const { component } = setup();
    const event = new MouseEvent('click');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    component.toggleMoreMenu(event);
    expect(component.moreMenuOpen()).toBe(true);
    expect(stopPropagation).toHaveBeenCalledOnce();

    component.toggleMoreMenu(event);
    expect(component.moreMenuOpen()).toBe(false);
  });

  test('closeMoreMenu should close the menu on any outside click', () => {
    const { component } = setup();
    component.moreMenuOpen.set(true);

    component.closeMoreMenu();

    expect(component.moreMenuOpen()).toBe(false);
  });

  test('chooseAddIntention should reveal the intention input and close the menu', () => {
    const { component } = setup();
    component.moreMenuOpen.set(true);

    component.chooseAddIntention();

    expect(component.showIntentInput()).toBe(true);
    expect(component.moreMenuOpen()).toBe(false);
  });

  test('chooseAttachMaterial should close the menu before opening the attach dialog', async () => {
    const { component } = setup();
    component.moreMenuOpen.set(true);
    const openAttachDialog = vi.spyOn(component, 'openAttachDialog').mockResolvedValue();

    await component.chooseAttachMaterial();

    expect(component.moreMenuOpen()).toBe(false);
    expect(openAttachDialog).toHaveBeenCalledOnce();
  });

  test('should ignore Enter pressed on a button, input, or link to avoid double-triggering its own click', () => {
    const { component, navigateByUrl } = setup();

    component.onKeydown(enterKeydown(document.createElement('button')));
    component.onKeydown(enterKeydown(document.createElement('input')));
    component.onKeydown(enterKeydown(document.createElement('a')));

    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
