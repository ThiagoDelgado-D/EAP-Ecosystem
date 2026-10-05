import { signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { CaptureSheetService } from '@core/capture/capture-sheet.service';
import { ThemeService } from '@core/theme/theme.service';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from './command-palette.service';
import { commandPaletteFixtures } from './command-palette.fixtures';

describe('CommandPaletteComponent', () => {
  let fixtures: ReturnType<typeof commandPaletteFixtures>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let palette: CommandPaletteService;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;

  function press(key: string, init: KeyboardEventInit = {}): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  }

  function typeQuery(query: string): void {
    component.onQueryInput(query);
  }

  function pressInInput(key: string): void {
    component.onInputKeydown(new KeyboardEvent('keydown', { key, cancelable: true }));
  }

  async function openWithLoadedIndex(): Promise<void> {
    palette.open();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixtures = commandPaletteFixtures();
    router = { navigate: vi.fn().mockResolvedValue(true) };
    const learningResourceRepository = mockLearningResourceRepository({
      resources: [fixtures.rustBookResource, fixtures.kubernetesTalkResource],
    });
    const learningPathRepository = mockLearningPathRepository({
      paths: [fixtures.rustPath],
      nodes: fixtures.rustPathWithNodes.nodes,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: LearningResourceRepository, useValue: learningResourceRepository },
        { provide: LearningPathRepository, useValue: learningPathRepository },
        { provide: ThemeService, useValue: { theme: signal('ink'), toggle: vi.fn() } },
      ],
    });
    TestBed.inject(AuthStore).currentUser.set({
      id: crypto.randomUUID(),
      firstName: 'Ada',
      lastName: 'Learner',
      email: 'ada@example.com',
      onboardingCompleted: true,
      featureConfig: ['learning-paths'],
    });
    palette = TestBed.inject(CommandPaletteService);
    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should toggle open and closed with Ctrl+K', () => {
    press('k', { ctrlKey: true });
    expect(palette.isOpen()).toBe(true);

    press('k', { ctrlKey: true });
    expect(palette.isOpen()).toBe(false);
  });

  test('should close on Escape', async () => {
    await openWithLoadedIndex();

    press('Escape');

    expect(palette.isOpen()).toBe(false);
  });

  test('should start every opening with an empty query', async () => {
    await openWithLoadedIndex();
    typeQuery('rust');
    component.close();

    await openWithLoadedIndex();

    expect(component.query()).toBe('');
  });

  test('should search resources, paths and nodes loaded when it opens', async () => {
    await openWithLoadedIndex();

    typeQuery('rust');
    const rustSearchGroups = component.groups().map((section) => section.group);
    typeQuery('ownership');
    const ownershipSearchGroups = component.groups().map((section) => section.group);

    expect(rustSearchGroups).toEqual(['Resources', 'Paths']);
    expect(ownershipSearchGroups).toEqual(['Nodes']);
  });

  test('should open the highlighted node inside its path with the arrow keys and Enter', async () => {
    await openWithLoadedIndex();
    typeQuery('objects');

    pressInInput('Enter');

    expect(router.navigate).toHaveBeenCalledWith(['/paths', fixtures.rustPath.id], {
      queryParams: { node: fixtures.traitObjectsStubNode.id },
    });
    expect(palette.isOpen()).toBe(false);
  });

  test('should move the highlight without running past the last result', async () => {
    await openWithLoadedIndex();
    typeQuery('settings');

    pressInInput('ArrowDown');
    pressInInput('ArrowDown');

    expect(component.cursor()).toBe(0);
  });

  test('should open the capture sheet on its URL tab from the import command', async () => {
    const capture = TestBed.inject(CaptureSheetService);
    await openWithLoadedIndex();
    typeQuery('import from url');

    pressInInput('Enter');

    expect(capture.isOpen()).toBe(true);
    expect(capture.tab()).toBe('url');
  });

  test('should leave paths and nodes out for a learner without Learning Paths enabled', async () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.updateFeatureConfig([]);
    await openWithLoadedIndex();

    typeQuery('rust');

    expect(component.groups().map((section) => section.group)).toEqual(['Resources']);
  });
});
