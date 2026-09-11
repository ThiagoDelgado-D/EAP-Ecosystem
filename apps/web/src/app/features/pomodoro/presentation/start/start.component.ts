import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { filterLibraryResources, filterPickerNodes, filterPickerPathGroups } from '@features/pomodoro/application/picker-search';
import type { PickerPathNode } from '@features/pomodoro/application/pomodoro-picker.model';
import type { LearningPathNode } from '@features/learning-path/domain/learning-path.model';
import {
  CANDIDATE_ENERGY_LEVEL,
  SEGMENT_TARGET_KIND,
  type CandidateEnergyLevel,
  type SegmentTarget,
  type SuggestedCandidate,
} from '@features/pomodoro/domain/pomodoro.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { pathColor } from './path-color';
import { pathProgress, type PathProgress } from './path-progress';
import { describeTarget, pathsForResource, type ResourcePathMembership } from './target-description';

const DURATION_PRESETS: readonly number[] = [15, 25, 50, 90];
type BrowseTab = 'ready' | 'going' | 'paths' | 'library';

interface PendingResourcePick {
  resource: LearningResource;
  options: ResourcePathMembership[];
}

interface TargetLabel {
  title: string;
  subtitle?: string;
}

@Component({
  selector: 'app-pomodoro-start',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './start.component.html',
})
export class StartComponent {
  private readonly router = inject(Router);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly DURATION_PRESETS = DURATION_PRESETS;
  readonly ENERGIES: readonly CandidateEnergyLevel[] = [
    CANDIDATE_ENERGY_LEVEL.LOW,
    CANDIDATE_ENERGY_LEVEL.MEDIUM,
    CANDIDATE_ENERGY_LEVEL.HIGH,
  ];

  readonly mode = signal<'hero' | 'browse'>('hero');
  readonly energy = signal<CandidateEnergyLevel>(CANDIDATE_ENERGY_LEVEL.MEDIUM);
  readonly query = signal('');
  readonly activeTab = signal<BrowseTab>('ready');
  readonly openPaths = signal(new Set<string>());

  readonly selectedDuration = signal<number | null>(null);
  readonly customDurationInput = signal('');
  readonly intent = signal('');
  readonly showIntentInput = signal(false);
  readonly showAlternates = signal(false);

  readonly selectedTarget = signal<SegmentTarget | null>(null);
  readonly selectedTargetLabel = signal<TargetLabel | null>(null);
  readonly pendingResourcePick = signal<PendingResourcePick | null>(null);

  readonly topSuggestion = computed<SuggestedCandidate | null>(() => this.store.suggestions()[0] ?? null);
  readonly alternates = computed(() => this.store.suggestions().slice(1, 5));

  private readonly heroTarget = computed<SegmentTarget | null>(() => {
    const suggestion = this.topSuggestion();
    if (!suggestion) return null;
    return {
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: suggestion.pathId,
      learningPathNodeId: suggestion.nodeId,
      resourceId: suggestion.resourceId,
    };
  });

  readonly isOverridden = computed(() => this.selectedTarget() !== null);
  readonly effectiveTarget = computed<SegmentTarget | null>(() => this.selectedTarget() ?? this.heroTarget());
  readonly description = computed(() => describeTarget(this.effectiveTarget(), this.picker.allPaths()));
  readonly heroDisplay = computed<TargetLabel | null>(() => {
    if (this.isOverridden()) return this.selectedTargetLabel();
    const suggestion = this.topSuggestion();
    return suggestion ? { title: suggestion.nodeTitle, subtitle: suggestion.pathTitle } : null;
  });
  readonly canStart = computed(() => this.selectedDuration() !== null && this.effectiveTarget() !== null);
  readonly hasNoMaterial = computed(
    () => !this.picker.loading() && this.picker.allPaths().length === 0 && this.picker.library().length === 0,
  );

  private readonly filteredQuery = computed(() => this.query().trim().toLowerCase());

  readonly filteredReady = computed(() => filterPickerNodes(this.picker.readyToLearn(), this.query()));
  readonly filteredGoing = computed(() => filterPickerNodes(this.picker.inProgress(), this.query()));
  readonly filteredPathGroups = computed(() => filterPickerPathGroups(this.picker.allPaths(), this.query()));
  readonly filteredLibrary = computed(() => filterLibraryResources(this.picker.library(), this.query()));

  constructor() {
    void this.picker.load();
    void this.store.loadSuggestions(this.energy());
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (this.mode() !== 'hero' || !this.canStart() || this.store.starting()) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON' || target?.tagName === 'A') return;

    event.preventDefault();
    void this.start();
  }

  setEnergy(energy: CandidateEnergyLevel): void {
    this.energy.set(energy);
    void this.store.loadSuggestions(energy);
  }

  openBrowse(): void {
    this.mode.set('browse');
  }

  backToHero(): void {
    this.mode.set('hero');
    this.query.set('');
  }

  selectTab(tab: BrowseTab): void {
    this.activeTab.set(tab);
  }

  clearQuery(): void {
    this.query.set('');
  }

  togglePath(pathId: string): void {
    this.openPaths.update((current) => {
      const next = new Set(current);
      if (next.has(pathId)) next.delete(pathId);
      else next.add(pathId);
      return next;
    });
  }

  isPathOpen(pathId: string): boolean {
    return !!this.filteredQuery() || this.openPaths().has(pathId);
  }

  pathColor(pathId: string): string {
    return pathColor(pathId);
  }

  pathProgress(nodes: LearningPathNode[]): PathProgress {
    return pathProgress(nodes);
  }

  progressForPath(pathId: string): PathProgress {
    const group = this.picker.allPaths().find((g) => g.path.id === pathId);
    return pathProgress(group?.nodes ?? []);
  }

  expandAllPaths(): void {
    this.openPaths.set(new Set(this.picker.allPaths().map((g) => g.path.id)));
  }

  collapseAllPaths(): void {
    this.openPaths.set(new Set());
  }

  pickDuration(minutes: number): void {
    this.selectedDuration.set(minutes);
    this.customDurationInput.set('');
  }

  applyCustomDuration(): void {
    const minutes = Number(this.customDurationInput());
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    this.selectedDuration.set(Math.round(minutes));
  }

  toggleIntentInput(): void {
    this.showIntentInput.set(true);
  }

  toggleAlternates(): void {
    this.showAlternates.update((v) => !v);
  }

  isNodeSelected(nodeId: string): boolean {
    const target = this.effectiveTarget();
    return target?.kind === SEGMENT_TARGET_KIND.NODE && target.learningPathNodeId === nodeId;
  }

  isResourceSelected(resourceId: string): boolean {
    const target = this.effectiveTarget();
    return target?.kind === SEGMENT_TARGET_KIND.RESOURCE && target.resourceId === resourceId;
  }

  pickNode({ path, node }: PickerPathNode): void {
    this.pendingResourcePick.set(null);
    this.selectedTarget.set({
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: path.id,
      learningPathNodeId: node.id,
      resourceId: node.learningResourceId ?? undefined,
    });
    this.selectedTargetLabel.set({ title: node.title, subtitle: path.title });
  }

  pickResource(resource: LearningResource): void {
    const options = pathsForResource(this.picker.allPaths(), resource.id);
    if (options.length > 1) {
      this.pendingResourcePick.set({ resource, options });
      return;
    }
    this.pendingResourcePick.set(null);
    if (options.length === 1) {
      const { path, node } = options[0];
      this.selectedTarget.set({
        kind: SEGMENT_TARGET_KIND.NODE,
        learningPathId: path.id,
        learningPathNodeId: node.id,
        resourceId: resource.id,
      });
      this.selectedTargetLabel.set({ title: node.title, subtitle: path.title });
      return;
    }
    this.selectedTarget.set({ kind: SEGMENT_TARGET_KIND.RESOURCE, resourceId: resource.id });
    this.selectedTargetLabel.set({ title: resource.title });
  }

  pickPendingPath(option: ResourcePathMembership): void {
    this.selectedTarget.set({
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: option.path.id,
      learningPathNodeId: option.node.id,
      resourceId: this.pendingResourcePick()?.resource.id,
    });
    this.selectedTargetLabel.set({ title: option.node.title, subtitle: option.path.title });
    this.pendingResourcePick.set(null);
  }

  pickPendingNone(): void {
    const pending = this.pendingResourcePick();
    if (!pending) return;
    this.selectedTarget.set({ kind: SEGMENT_TARGET_KIND.RESOURCE, resourceId: pending.resource.id });
    this.selectedTargetLabel.set({ title: pending.resource.title });
    this.pendingResourcePick.set(null);
  }

  pickFree(): void {
    this.pendingResourcePick.set(null);
    this.selectedTarget.set({ kind: SEGMENT_TARGET_KIND.FREE });
    this.selectedTargetLabel.set({ title: 'Free focus', subtitle: 'No material attached' });
  }

  pickAlternate(candidate: SuggestedCandidate): void {
    this.selectedTarget.set({
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: candidate.pathId,
      learningPathNodeId: candidate.nodeId,
      resourceId: candidate.resourceId,
    });
    this.selectedTargetLabel.set({ title: candidate.nodeTitle, subtitle: candidate.pathTitle });
    this.showAlternates.set(false);
  }

  clearOverride(): void {
    this.selectedTarget.set(null);
    this.selectedTargetLabel.set(null);
  }

  async start(): Promise<void> {
    const plannedMin = this.selectedDuration();
    const target = this.effectiveTarget();
    if (plannedMin === null || target === null) return;

    const session = await this.store.start({ plannedMin, target, intent: this.intent().trim() || undefined });
    if (session) void this.router.navigateByUrl('/pomodoro/active');
  }

  async startFree(): Promise<void> {
    this.pickFree();
    await this.start();
  }
}
