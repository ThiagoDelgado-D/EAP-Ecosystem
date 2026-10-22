import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { CAPABILITY_KEY } from '@features/auth/domain/auth.model';
import { RECOMMENDED_ENTRY_PARAM } from '@features/pomodoro/presentation/start/recommended-entry';
import { learningResourceFixture } from '@features/pomodoro/presentation/start/recommended-entry.fixtures';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { ContinueResourcesComponent } from './continue-resources.component';

describe('ContinueResourcesComponent', () => {
  test('should resume an in-progress resource in Pomodoro with that resource attached', () => {
    const inProgressResource = learningResourceFixture('Clean Architecture talk', 20);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const authStore = TestBed.inject(AuthStore);
    authStore.currentUser.set(learner('Ada'));
    authStore.updateModulePreferences({
      enabledModules: [],
      capabilities: capabilitiesEnabling([CAPABILITY_KEY.POMODORO]),
    });
    const fixture = TestBed.createComponent(ContinueResourcesComponent);
    fixture.componentRef.setInput('resources', [inProgressResource]);
    fixture.detectChanges();

    const resumeLink = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      `a[aria-label="Resume ${inProgressResource.title}"]`,
    );
    const resumeUrl = new URL(resumeLink?.href ?? '');

    expect(resumeUrl.pathname).toBe('/pomodoro');
    expect(resumeUrl.searchParams.get(RECOMMENDED_ENTRY_PARAM.RESOURCE)).toBe(
      inProgressResource.id,
    );
  });
});
