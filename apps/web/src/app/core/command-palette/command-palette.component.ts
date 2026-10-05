import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { CaptureSheetService } from '@core/capture/capture-sheet.service';
import { ThemeService } from '@core/theme/theme.service';
import { CommandPaletteService } from './command-palette.service';
import {
  buildSearchItems,
  filterCommands,
  groupCommands,
  type CommandItem,
  type CommandSearchIndex,
} from './command-items';

const EMPTY_INDEX: CommandSearchIndex = { resources: [], paths: [] };

@Component({
  selector: 'app-command-palette',
  standalone: true,
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent {
  private readonly palette = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly resourceRepository = inject(LearningResourceRepository);
  private readonly pathRepository = inject(LearningPathRepository);
  private readonly capture = inject(CaptureSheetService);
  private readonly themeService = inject(ThemeService);
  private readonly injector = inject(Injector);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly resultList = viewChild<ElementRef<HTMLElement>>('resultList');
  private focusBeforeOpen: HTMLElement | null = null;

  readonly isOpen = this.palette.isOpen;
  readonly query = signal('');
  readonly cursor = signal(0);
  readonly index = signal<CommandSearchIndex>(EMPTY_INDEX);

  private readonly pathsEnabled = computed(() => this.authStore.featureSet().has('learning-paths'));

  private readonly baseItems = computed<CommandItem[]>(() => {
    const paperTheme = this.themeService.theme() === 'paper';
    const navigation: CommandItem[] = [
      { id: 'go-dashboard', label: 'Go to Dashboard', group: 'Navigate', icon: 'dashboard', run: () => this.go('/dashboard') },
      { id: 'go-resources', label: 'Go to Resources', group: 'Navigate', icon: 'library', run: () => this.go('/resources') },
      ...(this.pathsEnabled()
        ? [{ id: 'go-paths', label: 'Go to Learning Paths', group: 'Navigate', icon: 'route', run: () => this.go('/paths') } satisfies CommandItem]
        : []),
      { id: 'go-pomodoro', label: 'Go to Pomodoro', group: 'Navigate', icon: 'timer', run: () => this.go('/pomodoro') },
      { id: 'go-summary', label: 'Go to Weekly Summary', group: 'Navigate', icon: 'chart', run: () => this.go('/pomodoro/summary') },
      { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', icon: 'settings', run: () => this.go('/settings') },
    ];
    const actions: CommandItem[] = [
      {
        id: 'capture-manual',
        label: 'Capture resource',
        detail: 'Manually, from a URL, by voice or from a file',
        group: 'Actions',
        icon: 'plus',
        run: () => this.capture.open('manual'),
      },
      { id: 'capture-url', label: 'Import from URL', group: 'Actions', icon: 'link', run: () => this.capture.open('url') },
      { id: 'capture-voice', label: 'Voice capture', group: 'Actions', icon: 'mic', run: () => this.capture.open('voice') },
      { id: 'capture-file', label: 'Import from file', group: 'Actions', icon: 'file', run: () => this.capture.open('file') },
      { id: 'start-focus', label: 'Start a focus session', group: 'Actions', icon: 'timer', run: () => this.go('/pomodoro') },
      {
        id: 'toggle-theme',
        label: paperTheme ? 'Switch to ink theme' : 'Switch to paper theme',
        group: 'Actions',
        icon: paperTheme ? 'moon' : 'sun',
        run: () => this.themeService.toggle(),
      },
    ];
    return [...navigation, ...actions];
  });

  readonly items = computed(() => {
    const searchItems = buildSearchItems(this.index(), this.query(), {
      openResource: (resourceId) => this.go('/resources', resourceId),
      openPath: (pathId) => this.go('/paths', pathId),
      openNode: (pathId, nodeId) => void this.router.navigate(['/paths', pathId], { queryParams: { node: nodeId } }),
    });
    return filterCommands([...searchItems, ...this.baseItems()], this.query());
  });

  readonly groups = computed(() => {
    let position = 0;
    return groupCommands(this.items()).map(({ group, items }) => ({
      group,
      entries: items.map((item) => ({ item, position: position++ })),
    }));
  });

  readonly activeItemId = computed(() => this.items()[this.cursor()]?.id ?? null);

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      untracked(() => this.onOpened());
    });
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) this.close();
      else this.palette.open();
      return;
    }
    if (event.key === 'Escape' && this.isOpen()) this.close();
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.cursor.set(0);
  }

  onInputKeydown(event: KeyboardEvent): void {
    const lastPosition = this.items().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveCursor(Math.min(lastPosition, this.cursor() + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveCursor(Math.max(0, this.cursor() - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const activeItem = this.items()[this.cursor()];
      if (activeItem) this.runItem(activeItem);
    }
  }

  highlight(position: number): void {
    this.cursor.set(position);
  }

  runItem(item: CommandItem): void {
    this.close();
    item.run();
  }

  close(): void {
    this.palette.close();
    this.focusBeforeOpen?.focus();
    this.focusBeforeOpen = null;
  }

  private onOpened(): void {
    this.focusBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.query.set('');
    this.cursor.set(0);
    afterNextRender(() => this.searchInput()?.nativeElement.focus(), { injector: this.injector });
    void this.loadIndex();
  }

  private async loadIndex(): Promise<void> {
    try {
      const [resources, paths] = await Promise.all([
        this.resourceRepository.getAll(),
        this.pathsEnabled() ? this.pathRepository.getAllWithNodes() : Promise.resolve([]),
      ]);
      this.index.set({ resources, paths });
    } catch {
      this.index.set(EMPTY_INDEX);
    }
  }

  private moveCursor(position: number): void {
    this.cursor.set(position);
    const activeOption = this.resultList()?.nativeElement.querySelector<HTMLElement>(`[data-position="${position}"]`);
    activeOption?.scrollIntoView?.({ block: 'nearest' });
  }

  private go(...commands: string[]): void {
    void this.router.navigate(commands);
  }
}
