import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { SuggestedCandidate } from '@features/pomodoro/domain/pomodoro.model';
import { SuggestionHeroComponent } from './suggestion-hero.component';

const cleanArchSuggestion: SuggestedCandidate = {
  pathId: crypto.randomUUID(),
  pathTitle: 'Frontend Architecture Mastery',
  nodeId: crypto.randomUUID(),
  nodeTitle: 'Clean Architecture',
  resourceId: crypto.randomUUID(),
  score: 0.9,
  why: ['continues last session', 'energy match'],
};

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(SuggestionHeroComponent);
  fixture.componentInstance.energy = 'medium';
  return { fixture, component: fixture.componentInstance };
}

describe('SuggestionHeroComponent', () => {
  test('should emit energyChange when an energy level is clicked', () => {
    const { fixture, component } = setup();
    const energyChange = vi.fn();
    component.energyChange.subscribe(energyChange);
    fixture.detectChanges();

    component.setEnergy('high');

    expect(energyChange).toHaveBeenCalledWith('high');
  });

  test('should display the top suggestion when there is no override', () => {
    const { fixture, component } = setup();
    component.topSuggestion = cleanArchSuggestion;
    fixture.detectChanges();

    expect(component.isOverridden()).toBe(false);
    expect(component.display()).toEqual({ title: 'Clean Architecture', subtitle: 'Frontend Architecture Mastery' });
  });

  test('should prefer the override label over the suggestion once one is set', () => {
    const { fixture, component } = setup();
    component.topSuggestion = cleanArchSuggestion;
    component.overrideLabel = { title: 'Rust Book Chapter 17' };
    fixture.detectChanges();

    expect(component.isOverridden()).toBe(true);
    expect(component.display()).toEqual({ title: 'Rust Book Chapter 17' });
  });

  test('should emit clearOverrideRequested when the user asks to go back to the suggestion', () => {
    const { fixture, component } = setup();
    component.overrideLabel = { title: 'Rust Book Chapter 17' };
    fixture.detectChanges();
    const clearOverrideRequested = vi.fn();
    component.clearOverrideRequested.subscribe(clearOverrideRequested);

    component.clearOverrideRequested.emit();

    expect(clearOverrideRequested).toHaveBeenCalledOnce();
  });

  test('should toggle the alternates list', () => {
    const { component } = setup();

    expect(component.showAlternates()).toBe(false);
    component.toggleAlternates();
    expect(component.showAlternates()).toBe(true);
  });

  test('should emit alternatePicked and close the alternates list when one is picked', () => {
    const { fixture, component } = setup();
    component.showAlternates.set(true);
    const alternatePicked = vi.fn();
    component.alternatePicked.subscribe(alternatePicked);
    fixture.detectChanges();

    component.pickAlternate(cleanArchSuggestion);

    expect(alternatePicked).toHaveBeenCalledWith(cleanArchSuggestion);
    expect(component.showAlternates()).toBe(false);
  });

  test('should emit browseRequested and freeRequested from the empty state', () => {
    const { fixture, component } = setup();
    component.hasNoMaterial = true;
    fixture.detectChanges();
    const freeRequested = vi.fn();
    component.freeRequested.subscribe(freeRequested);

    component.freeRequested.emit();

    expect(freeRequested).toHaveBeenCalledOnce();
  });

  test('should emit retrySuggestions from the suggestions-error state', () => {
    const { fixture, component } = setup();
    component.suggestionsError = true;
    fixture.detectChanges();
    const retrySuggestions = vi.fn();
    component.retrySuggestions.subscribe(retrySuggestions);

    component.retrySuggestions.emit();

    expect(retrySuggestions).toHaveBeenCalledOnce();
  });

  test('should emit retryPicker from the picker-error state', () => {
    const { fixture, component } = setup();
    component.pickerError = "Could not reach the server";
    fixture.detectChanges();
    const retryPicker = vi.fn();
    component.retryPicker.subscribe(retryPicker);

    component.retryPicker.emit();

    expect(retryPicker).toHaveBeenCalledOnce();
  });
});
