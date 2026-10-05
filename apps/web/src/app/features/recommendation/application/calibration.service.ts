import { inject, Injectable, signal } from '@angular/core';
import type {
  EnergyLevel,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model';
import { AuthStore } from '@features/auth/application/auth.store';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import type {
  EnergyLevel as ApiEnergyLevel,
  RecommendationContext,
} from '@features/recommendation/domain/recommendation.model';

const TO_API_ENERGY_LEVEL: Record<EnergyLevel, ApiEnergyLevel> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

const FROM_API_ENERGY_LEVEL: Record<ApiEnergyLevel, EnergyLevel> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const DEFAULT_ENERGY: EnergyLevel = 'Medium';
const DEFAULT_MENTAL_STATE: MentalStateType = 'deep_focus';
const DEFAULT_AVAILABLE_MINUTES = 45;

@Injectable()
export class CalibrationService {
  private readonly repository = inject(RecommendationRepository);
  private readonly authStore = inject(AuthStore);
  private loading: Promise<void> | null = null;
  private loadedForUserId: string | null = null;
  private saveQueue: Promise<unknown> = Promise.resolve();

  readonly energy = signal<EnergyLevel>(DEFAULT_ENERGY);
  readonly mentalState = signal<MentalStateType | null>(DEFAULT_MENTAL_STATE);
  readonly availableMinutes = signal<number>(DEFAULT_AVAILABLE_MINUTES);
  readonly savedRevision = signal(0);

  load(): Promise<void> {
    const userId = this.authStore.currentUser()?.id ?? null;
    if (userId !== this.loadedForUserId) {
      this.loadedForUserId = userId;
      this.loading = null;
      this.restoreDefaults();
    }
    this.loading ??= this.hydrate().catch(() => {
      this.loading = null;
    });
    return this.loading;
  }

  setEnergy(energy: EnergyLevel): Promise<boolean> {
    this.energy.set(energy);
    return this.save();
  }

  setMentalState(state: MentalStateType | null): Promise<boolean> {
    this.mentalState.set(state);
    return this.save();
  }

  setAvailableMinutes(minutes: number): Promise<boolean> {
    this.availableMinutes.set(minutes);
    return this.save();
  }

  private async hydrate(): Promise<void> {
    const context = await this.repository.getContext();
    if (context) {
      this.apply(context);
      return;
    }
    await this.save();
  }

  private restoreDefaults(): void {
    this.energy.set(DEFAULT_ENERGY);
    this.mentalState.set(DEFAULT_MENTAL_STATE);
    this.availableMinutes.set(DEFAULT_AVAILABLE_MINUTES);
  }

  private apply(context: RecommendationContext): void {
    this.energy.set(FROM_API_ENERGY_LEVEL[context.energyLevel]);
    this.mentalState.set(context.mentalState ?? null);
    this.availableMinutes.set(context.availableMinutes ?? DEFAULT_AVAILABLE_MINUTES);
  }

  private save(): Promise<boolean> {
    const saved = this.saveQueue.then(async () => {
      try {
        await this.repository.setContext({
          energyLevel: TO_API_ENERGY_LEVEL[this.energy()],
          availableMinutes: this.availableMinutes(),
          mentalState: this.mentalState() ?? undefined,
        });
        this.savedRevision.update((revision) => revision + 1);
        return true;
      } catch {
        return false;
      }
    });
    this.saveQueue = saved;
    return saved;
  }
}
