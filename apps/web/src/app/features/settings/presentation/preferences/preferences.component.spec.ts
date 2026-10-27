import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/theme/theme.service';
import { AuthStore } from '@features/auth/application/auth.store';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';
import { mockPreferencesRepository } from '@features/settings/application/mocks/mock-preferences.repository';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { PreferencesComponent } from './preferences.component';

const RETAKEN_GOAL_MINUTES = WEEKLY_GOAL_MINUTES.DEFAULT + WEEKLY_GOAL_MINUTES.STEP;

describe('PreferencesComponent', () => {
  test('follows a weekly goal changed elsewhere in Settings', () => {
    TestBed.configureTestingModule({
      providers: [
        PreferencesService,
        WeeklyGoalService,
        { provide: PreferencesRepository, useValue: mockPreferencesRepository() },
        { provide: ThemeService, useValue: { theme: signal('paper'), toggle: vi.fn() } },
      ],
    });
    TestBed.inject(AuthStore).currentUser.set(learner('Ada'));
    const component = TestBed.createComponent(PreferencesComponent).componentInstance;

    TestBed.inject(WeeklyGoalService).goalMinutes.set(RETAKEN_GOAL_MINUTES);

    expect(component.goalDraft()).toBe(RETAKEN_GOAL_MINUTES);
  });
});
