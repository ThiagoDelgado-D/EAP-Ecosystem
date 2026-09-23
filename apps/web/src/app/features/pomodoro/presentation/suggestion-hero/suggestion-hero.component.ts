import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CANDIDATE_ENERGY_LEVEL,
  type CandidateEnergyLevel,
  type SuggestedCandidate,
} from '@features/pomodoro/domain/pomodoro.model';
import type { TargetLabel } from '@features/pomodoro/presentation/start/target-description';

@Component({
  selector: 'app-suggestion-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './suggestion-hero.component.html',
})
export class SuggestionHeroComponent {
  readonly ENERGIES: readonly CandidateEnergyLevel[] = [
    CANDIDATE_ENERGY_LEVEL.LOW,
    CANDIDATE_ENERGY_LEVEL.MEDIUM,
    CANDIDATE_ENERGY_LEVEL.HIGH,
  ];

  @Input({ required: true }) energy!: CandidateEnergyLevel;
  @Input() loading = false;
  @Input() suggestionsError = false;
  @Input() pickerError: string | null = null;
  @Input() hasNoMaterial = false;
  @Input() topSuggestion: SuggestedCandidate | null = null;
  @Input() alternates: readonly SuggestedCandidate[] = [];
  @Input() overrideLabel: TargetLabel | null = null;
  @Input() isStub = false;

  @Output() energyChange = new EventEmitter<CandidateEnergyLevel>();
  @Output() retrySuggestions = new EventEmitter<void>();
  @Output() retryPicker = new EventEmitter<void>();
  @Output() browseRequested = new EventEmitter<void>();
  @Output() freeRequested = new EventEmitter<void>();
  @Output() alternatePicked = new EventEmitter<SuggestedCandidate>();
  @Output() clearOverrideRequested = new EventEmitter<void>();

  readonly showAlternates = signal(false);

  isOverridden(): boolean {
    return this.overrideLabel !== null;
  }

  display(): TargetLabel | null {
    return this.overrideLabel ?? this.displayFromSuggestion();
  }

  private displayFromSuggestion(): TargetLabel | null {
    return this.topSuggestion ? { title: this.topSuggestion.nodeTitle, subtitle: this.topSuggestion.pathTitle } : null;
  }

  setEnergy(level: CandidateEnergyLevel): void {
    this.energyChange.emit(level);
  }

  toggleAlternates(): void {
    this.showAlternates.update((v) => !v);
  }

  pickAlternate(candidate: SuggestedCandidate): void {
    this.alternatePicked.emit(candidate);
    this.showAlternates.set(false);
  }
}
