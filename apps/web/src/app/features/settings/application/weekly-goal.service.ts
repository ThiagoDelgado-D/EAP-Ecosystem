import { inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '@features/auth/application/auth.store';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';

@Injectable()
export class WeeklyGoalService {
  private readonly repository = inject(PreferencesRepository);
  private readonly authStore = inject(AuthStore);
  private loading: Promise<void> | null = null;
  private loadedForUserId: string | null = null;

  readonly goalMinutes = signal<number>(WEEKLY_GOAL_MINUTES.DEFAULT);

  load(): Promise<void> {
    const userId = this.authStore.currentUser()?.id ?? null;
    if (userId !== this.loadedForUserId) {
      this.loadedForUserId = userId;
      this.loading = null;
      this.goalMinutes.set(WEEKLY_GOAL_MINUTES.DEFAULT);
    }
    this.loading ??= this.hydrate().catch(() => {
      this.loading = null;
    });
    return this.loading;
  }

  async setGoalMinutes(minutes: number): Promise<boolean> {
    const previous = this.goalMinutes();
    this.goalMinutes.set(minutes);
    try {
      const appearance = await this.repository.updateAppearance({ weeklyGoalMinutes: minutes });
      this.goalMinutes.set(appearance.weeklyGoalMinutes);
      return true;
    } catch {
      this.goalMinutes.set(previous);
      return false;
    }
  }

  private async hydrate(): Promise<void> {
    const appearance = await this.repository.getAppearance();
    this.goalMinutes.set(appearance.weeklyGoalMinutes);
  }
}
