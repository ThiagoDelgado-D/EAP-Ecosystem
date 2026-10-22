import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { CAPABILITY_KEY, type CapabilityKey } from '@features/auth/domain/auth.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { RECOMMENDED_ENTRY_PARAM } from '@features/pomodoro/presentation/start/recommended-entry';
import { learningResourceFixture } from '@features/pomodoro/presentation/start/recommended-entry.fixtures';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { ContinueResourcesComponent } from './continue-resources.component';

function render(resources: LearningResource[], enabledCapabilities: CapabilityKey[]): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const authStore = TestBed.inject(AuthStore);
  authStore.currentUser.set(learner('Ada'));
  authStore.updateModulePreferences({
    enabledModules: [],
    capabilities: capabilitiesEnabling(enabledCapabilities),
  });
  const fixture = TestBed.createComponent(ContinueResourcesComponent);
  fixture.componentRef.setInput('resources', resources);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function resumeLinkFor(element: HTMLElement, resource: LearningResource): HTMLAnchorElement | null {
  return element.querySelector<HTMLAnchorElement>(`a[aria-label="Resume ${resource.title}"]`);
}

describe('ContinueResourcesComponent', () => {
  const inProgressResource = learningResourceFixture('Clean Architecture talk', 20);

  test('should resume an in-progress resource in Pomodoro with that resource attached', () => {
    const element = render([inProgressResource], [CAPABILITY_KEY.POMODORO]);

    const resumeUrl = new URL(resumeLinkFor(element, inProgressResource)?.href ?? '');

    expect(resumeUrl.pathname).toBe('/pomodoro');
    expect(resumeUrl.searchParams.get(RECOMMENDED_ENTRY_PARAM.RESOURCE)).toBe(
      inProgressResource.id,
    );
  });

  test('should leave out resuming in Pomodoro while it is off', () => {
    const element = render([inProgressResource], []);

    expect(resumeLinkFor(element, inProgressResource)).toBeNull();
  });
});
