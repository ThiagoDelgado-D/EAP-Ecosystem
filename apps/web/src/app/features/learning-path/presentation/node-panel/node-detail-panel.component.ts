import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@core/toast/toast.service';
import { LearningPathDetailService } from '@features/learning-path/application/learning-path-detail.service';
import {
  NODE_PROGRESS,
  type LearningPathNode,
  type NodeProgress,
} from '@features/learning-path/domain/learning-path.model';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type {
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
} from '@features/learning-resource/domain/learning-resource.model';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';

interface CreateForm {
  title: string;
  url: string;
  resourceTypeId: string;
  topicIds: string[];
  difficulty: DifficultyLevel;
  energyLevel: EnergyLevel;
}

const DIFFICULTIES: DifficultyLevel[] = ['Low', 'Medium', 'High'];
const ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS: Array<{ value: NodeProgress; label: string }> = [
  { value: NODE_PROGRESS.PENDING, label: 'Pending' },
  { value: NODE_PROGRESS.IN_PROGRESS, label: 'In progress' },
  { value: NODE_PROGRESS.DONE, label: 'Done' },
];

@Component({
  selector: 'app-node-detail-panel',
  standalone: true,
  imports: [FormsModule],
  providers: [
    LearningResourceService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    ResourceTypeService,
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    TopicService,
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
  templateUrl: './node-detail-panel.component.html',
})
export class NodeDetailPanelComponent {
  readonly node = input.required<LearningPathNode>();
  readonly pathId = input.required<string>();
  readonly closed = output<void>();

  private readonly detailService = inject(LearningPathDetailService);
  private readonly toastService = inject(ToastService);

  readonly resourceService = inject(LearningResourceService);
  readonly resourceTypeService = inject(ResourceTypeService);
  readonly topicService = inject(TopicService);

  readonly NODE_PROGRESS = NODE_PROGRESS;
  readonly DIFFICULTIES = DIFFICULTIES;
  readonly ENERGY_LEVELS = ENERGY_LEVELS;
  readonly STATUS_OPTIONS = STATUS_OPTIONS;

  readonly isStub = computed(() => !this.node().learningResourceId);

  readonly tab = signal<'link' | 'create'>('link');
  readonly query = signal('');
  readonly picked = signal<string | null>(null);
  readonly linking = signal(false);
  readonly unlinking = signal(false);

  readonly linkedResource = signal<LearningResource | null>(null);
  readonly loadingResource = signal(false);

  readonly form = signal<CreateForm>({
    title: '',
    url: '',
    resourceTypeId: '',
    topicIds: [],
    difficulty: 'Medium',
    energyLevel: 'Medium',
  });
  readonly creating = signal(false);

  readonly filteredResources = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.resourceService.resources();
    if (!q) return all;
    return all.filter((r) => r.title.toLowerCase().includes(q));
  });

  constructor() {
    effect(() => {
      const node = this.node();
      this.tab.set('link');
      this.picked.set(null);
      this.query.set('');
      this.form.update((f) => ({ ...f, title: node.title }));

      if (node.learningResourceId) {
        void this.loadLinkedResource(node.learningResourceId);
      } else {
        this.linkedResource.set(null);
        void this.resourceTypeService.loadAll();
        void this.topicService.loadAll();
        void this.resourceService.load({ pageSize: 50 });
      }
    });
  }

  private async loadLinkedResource(id: string): Promise<void> {
    this.loadingResource.set(true);
    try {
      this.linkedResource.set(await this.resourceService.getById(id));
    } catch {
      this.linkedResource.set(null);
    } finally {
      this.loadingResource.set(false);
    }
  }

  selectTab(tab: 'link' | 'create'): void {
    this.tab.set(tab);
  }

  pick(id: string): void {
    this.picked.set(id);
  }

  patchForm(patch: Partial<CreateForm>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  toggleTopic(id: string): void {
    this.form.update((f) => ({
      ...f,
      topicIds: f.topicIds.includes(id)
        ? f.topicIds.filter((t) => t !== id)
        : [...f.topicIds, id],
    }));
  }

  async confirmLink(): Promise<void> {
    const id = this.picked();
    if (!id || this.linking()) return;
    this.linking.set(true);
    try {
      await this.detailService.linkNode(this.pathId(), this.node().id, id);
      this.toastService.show('Recurso vinculado', 'success');
      this.closed.emit();
    } catch {
      this.toastService.show('No se pudo vincular el recurso', 'error');
    } finally {
      this.linking.set(false);
    }
  }

  async confirmCreate(): Promise<void> {
    const f = this.form();
    if (!f.title.trim() || !f.resourceTypeId || f.topicIds.length === 0 || this.creating()) return;
    this.creating.set(true);
    try {
      const created = await this.resourceService.addResource({
        title: f.title.trim(),
        url: f.url.trim() || undefined,
        resourceTypeId: f.resourceTypeId,
        topicIds: f.topicIds,
        difficulty: f.difficulty,
        estimatedDurationMinutes: 30,
        energyLevel: f.energyLevel,
      });
      await this.detailService.linkNode(this.pathId(), this.node().id, created.id);
      this.toastService.show('Recurso creado y vinculado', 'success');
      this.closed.emit();
    } catch {
      this.toastService.show('No se pudo crear el recurso', 'error');
    } finally {
      this.creating.set(false);
    }
  }

  async unlink(): Promise<void> {
    if (this.unlinking()) return;
    this.unlinking.set(true);
    try {
      await this.detailService.unlinkNode(this.pathId(), this.node().id);
      this.toastService.show('Recurso desvinculado', 'success');
    } catch {
      this.toastService.show('No se pudo desvincular el recurso', 'error');
    } finally {
      this.unlinking.set(false);
    }
  }

  async advanceStatus(): Promise<void> {
    const node = this.node();
    const cycle: NodeProgress[] = [NODE_PROGRESS.PENDING, NODE_PROGRESS.IN_PROGRESS, NODE_PROGRESS.DONE];
    const next = cycle[(cycle.indexOf(node.progress) + 1) % cycle.length];
    try {
      await this.detailService.updateNodeProgress(this.pathId(), node.id, next);
    } catch {
      this.toastService.show('No se pudo actualizar el progreso', 'error');
    }
  }

  setStatus(progress: NodeProgress): void {
    if (this.node().progress === progress) return;
    void this.detailService
      .updateNodeProgress(this.pathId(), this.node().id, progress)
      .catch(() => this.toastService.show('No se pudo actualizar el progreso', 'error'));
  }
}
