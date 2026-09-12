import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { describeTargetLabel, type TargetLabel } from '@features/pomodoro/presentation/start/target-description';
import { filterLibraryResources } from '@features/pomodoro/application/picker-search';
import { formatMinutes, segmentToTarget, segmentTotals, targetKey } from '@features/pomodoro/presentation/active/segment-display';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type { NodeProgress } from '@features/learning-path/domain/learning-path.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { LearningResource, ResourceStatus } from '@features/learning-resource/domain/learning-resource.model';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { RESOURCE_STATUS_LABELS } from '@features/learning-resource/domain/learning-resource.constants';
import { NODE_PROGRESS_LABELS } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';

interface TouchedTarget {
  key: string;
  target: SegmentTarget;
  label: TargetLabel;
  totalSecs: number;
  isStub: boolean;
  pathId?: string;
  nodeId?: string;
  resourceId?: string;
}

interface PendingNodeProgress {
  pathId: string;
  progress: NodeProgress;
}

const NODE_PROGRESS_OPTIONS: readonly NodeProgress[] = ['pending', 'in_progress', 'done'];
const RESOURCE_STATUS_OPTIONS: readonly ResourceStatus[] = ['Pending', 'InProgress', 'Completed'];

@Component({
  selector: 'app-pomodoro-end',
  standalone: true,
  imports: [FormsModule, DatePipe],
  providers: [
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
  templateUrl: './end.component.html',
})
export class EndComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly learningPathRepository = inject(LearningPathRepository);
  private readonly learningResourceRepository = inject(LearningResourceRepository);
  private readonly resourceTypeRepository = inject(ResourceTypeRepository);
  private readonly topicRepository = inject(TopicRepository);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly NODE_PROGRESS_OPTIONS = NODE_PROGRESS_OPTIONS;
  readonly RESOURCE_STATUS_OPTIONS = RESOURCE_STATUS_OPTIONS;
  readonly NODE_PROGRESS_LABELS = NODE_PROGRESS_LABELS;
  readonly RESOURCE_STATUS_LABELS = RESOURCE_STATUS_LABELS;
  readonly formatMinutes = formatMinutes;

  readonly session = this.store.activeSession;
  private readonly startedAt = signal<Date | null>(null);
  private readonly endedAt = signal<Date | null>(null);
  readonly resourceTypes = signal<ResourceType[]>([]);
  readonly topics = signal<Topic[]>([]);
  readonly saving = signal(false);
  readonly attaching = signal(false);

  readonly openAdjust = signal<Set<string>>(new Set());
  readonly pendingNodeProgress = signal<Record<string, PendingNodeProgress>>({});
  readonly pendingResourceStatus = signal<Record<string, ResourceStatus>>({});
  readonly promotedResource = signal<Record<string, LearningResource>>({});
  readonly promoteTab = signal<Record<string, 'link' | 'create'>>({});
  readonly promoteQuery = signal<Partial<Record<string, string>>>({});
  readonly promoteSelectedResourceId = signal<Partial<Record<string, string>>>({});
  readonly createTitle = signal<Partial<Record<string, string>>>({});
  readonly createUrl = signal<Partial<Record<string, string>>>({});
  readonly createTypeId = signal<Partial<Record<string, string>>>({});
  readonly createTopicIds = signal<Partial<Record<string, string[]>>>({});

  readonly elapsedSec = computed(() => {
    const started = this.startedAt();
    const ended = this.endedAt();
    if (!started) return 0;
    return Math.max(0, Math.floor(((ended ?? new Date()).getTime() - started.getTime()) / 1000));
  });

  readonly elapsedLabel = computed(() => formatMinutes(this.elapsedSec()));

  readonly totals = computed(() => segmentTotals(this.store.segments(), this.elapsedSec()));

  readonly touchedKeysInOrder = computed<string[]>(() => {
    const seen: string[] = [];
    for (const segment of this.store.segments()) {
      const key = targetKey(segmentToTarget(segment));
      if (!seen.includes(key)) seen.push(key);
    }
    return seen;
  });

  readonly freeOnly = computed(() => {
    const keys = this.touchedKeysInOrder();
    return keys.length === 1 && keys[0] === 'free';
  });

  readonly touchedTargets = computed<TouchedTarget[]>(() => {
    const groups = this.picker.allPaths();
    const library = this.picker.library();
    return this.touchedKeysInOrder()
      .filter((key) => key !== 'free')
      .map((key) => {
        const total = this.totals().find((t) => targetKey(t.target) === key);
        const target = total?.target as SegmentTarget;
        const label = describeTargetLabel(target, groups, library);
        const isStub = target.kind === 'node' && !target.resourceId;
        return {
          key,
          target,
          label,
          totalSecs: total?.secs ?? 0,
          isStub,
          pathId: target.kind === 'node' ? target.learningPathId : undefined,
          nodeId: target.kind === 'node' ? target.learningPathNodeId : undefined,
          resourceId: target.kind === 'resource' ? target.resourceId : target.kind === 'node' ? target.resourceId : undefined,
        };
      });
  });

  readonly pendingCount = computed(
    () => Object.keys(this.pendingNodeProgress()).length + Object.keys(this.pendingResourceStatus()).length,
  );

  constructor() {
    const session = this.session();
    this.startedAt.set(session?.startedAt ?? new Date());
    void this.picker.load();
    void this.resourceTypeRepository.getAll().then((types) => this.resourceTypes.set(types));
    void this.topicRepository.getAll().then((topics) => this.topics.set(topics));
  }

  endedAtOrNow(): Date {
    return this.endedAt() ?? new Date();
  }

  targetTitle(target: SegmentTarget): string {
    return describeTargetLabel(target, this.picker.allPaths(), this.picker.library()).title;
  }

  effectiveResourceId(touched: TouchedTarget): string | undefined {
    if (touched.nodeId) return this.promotedResource()[touched.nodeId]?.id ?? touched.resourceId;
    return touched.resourceId;
  }

  storedNodeProgress(touched: TouchedTarget): NodeProgress {
    const group = this.picker.allPaths().find((g) => g.path.id === touched.pathId);
    return group?.nodes.find((n) => n.id === touched.nodeId)?.progress ?? 'pending';
  }

  storedResourceStatus(resourceId: string): ResourceStatus {
    return this.picker.library().find((r) => r.id === resourceId)?.status ?? 'Pending';
  }

  currentNodeProgress(touched: TouchedTarget, storedProgress: NodeProgress): NodeProgress {
    if (!touched.nodeId) return storedProgress;
    return this.pendingNodeProgress()[touched.nodeId]?.progress ?? storedProgress;
  }

  currentResourceStatus(resourceId: string, storedStatus: ResourceStatus): ResourceStatus {
    return this.pendingResourceStatus()[resourceId] ?? storedStatus;
  }

  setNodeProgress(touched: TouchedTarget, progress: NodeProgress): void {
    if (!touched.nodeId || !touched.pathId) return;
    this.pendingNodeProgress.update((current) => ({
      ...current,
      [touched.nodeId!]: { pathId: touched.pathId!, progress },
    }));
  }

  setResourceStatus(resourceId: string, status: ResourceStatus): void {
    this.pendingResourceStatus.update((current) => ({ ...current, [resourceId]: status }));
  }

  toggleAdjust(key: string): void {
    this.openAdjust.update((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  isAdjustOpen(key: string): boolean {
    return this.openAdjust().has(key);
  }

  selectPromoteTab(key: string, tab: 'link' | 'create'): void {
    this.promoteTab.update((current) => ({ ...current, [key]: tab }));
  }

  currentPromoteTab(key: string): 'link' | 'create' {
    return this.promoteTab()[key] ?? 'link';
  }

  setPromoteQuery(key: string, value: string): void {
    this.promoteQuery.update((current) => ({ ...current, [key]: value }));
  }

  filteredLibraryFor(key: string): LearningResource[] {
    return filterLibraryResources(this.picker.library(), this.promoteQuery()[key] ?? '');
  }

  selectPromoteResource(key: string, resourceId: string): void {
    this.promoteSelectedResourceId.update((current) => ({ ...current, [key]: resourceId }));
  }

  async linkExistingResource(touched: TouchedTarget): Promise<void> {
    const resourceId = this.promoteSelectedResourceId()[touched.key];
    if (!resourceId || !touched.pathId || !touched.nodeId) return;
    await this.learningPathRepository.updateNode(touched.pathId, touched.nodeId, { learningResourceId: resourceId });
    const resource = this.picker.library().find((r) => r.id === resourceId);
    if (resource) this.promotedResource.update((current) => ({ ...current, [touched.nodeId!]: resource }));
  }

  setCreateTitle(key: string, value: string): void {
    this.createTitle.update((current) => ({ ...current, [key]: value }));
  }

  setCreateUrl(key: string, value: string): void {
    this.createUrl.update((current) => ({ ...current, [key]: value }));
  }

  setCreateTypeId(key: string, value: string): void {
    this.createTypeId.update((current) => ({ ...current, [key]: value }));
  }

  createTopicIdsFor(key: string): string[] {
    return this.createTopicIds()[key] ?? [];
  }

  isCreateTopicSelected(key: string, topicId: string): boolean {
    return this.createTopicIdsFor(key).includes(topicId);
  }

  toggleCreateTopic(key: string, topicId: string): void {
    this.createTopicIds.update((current) => {
      const selected = current[key] ?? [];
      const next = selected.includes(topicId)
        ? selected.filter((id) => id !== topicId)
        : [...selected, topicId];
      return { ...current, [key]: next };
    });
  }

  async createAndLinkResource(touched: TouchedTarget): Promise<void> {
    const title = (this.createTitle()[touched.key] ?? touched.label.title).trim();
    const typeId = this.createTypeId()[touched.key] ?? this.resourceTypes()[0]?.id;
    const topicIds = this.createTopicIdsFor(touched.key);
    if (!title || !typeId || !touched.pathId || !touched.nodeId || topicIds.length === 0) return;

    const estimatedDurationMinutes = Math.max(1, Math.round(touched.totalSecs / 60));
    const created = await this.learningResourceRepository.addResourceLearning({
      title,
      url: this.createUrl()[touched.key] || undefined,
      resourceTypeId: typeId,
      topicIds,
      difficulty: 'Medium',
      estimatedDurationMinutes,
      energyLevel: 'Medium',
      status: 'InProgress',
    });
    await this.learningPathRepository.updateNode(touched.pathId, touched.nodeId, { learningResourceId: created.id });
    this.promotedResource.update((current) => ({ ...current, [touched.nodeId!]: created }));
  }

  async openAttachDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (!target) return;
    this.attaching.set(true);
    try {
      await this.store.attachOpenSegment(target);
    } finally {
      this.attaching.set(false);
    }
  }

  async discard(): Promise<void> {
    await this.finish();
  }

  async saveAndClose(): Promise<void> {
    this.saving.set(true);
    try {
      const nodeUpdates = Object.entries(this.pendingNodeProgress());
      const resourceUpdates = Object.entries(this.pendingResourceStatus());
      await Promise.all([
        ...nodeUpdates.map(([nodeId, { pathId, progress }]) =>
          this.learningPathRepository.updateNodeProgress(pathId, nodeId, progress),
        ),
        ...resourceUpdates.map(([resourceId, status]) => this.learningResourceRepository.toggleStatus(resourceId, status)),
      ]);
      await this.finish();
    } finally {
      this.saving.set(false);
    }
  }

  private async finish(): Promise<void> {
    this.endedAt.set(new Date());
    await this.store.end();
    void this.router.navigateByUrl('/pomodoro');
  }
}
