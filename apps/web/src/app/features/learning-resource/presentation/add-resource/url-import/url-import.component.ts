import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UrlPreviewService } from '@features/learning-resource/application/url-preview.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import type {
  DifficultyLevel,
  EnergyLevel,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';

type ViewState = 'idle' | 'loading' | 'error' | 'success';

@Component({
  selector: 'app-url-import',
  standalone: true,
  imports: [FormsModule],
  providers: [
    ResourceTypeService,
    UrlPreviewService,
    LearningResourceService,
    TopicService,
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
  templateUrl: './url-import.component.html',
})
export class UrlImportComponent implements OnInit, OnDestroy {
  private readonly previewService = inject(UrlPreviewService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly learningResourceService = inject(LearningResourceService);
  private readonly topicService = inject(TopicService);
  private readonly router = inject(Router);
  private typeInitInterval: number | undefined;

  readonly previewData = this.previewService.previewData.asReadonly();
  readonly loadingPreview = this.previewService.loading.asReadonly();
  readonly previewError = this.previewService.error.asReadonly();
  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  readonly topics = this.topicService.topics.asReadonly();

  viewState = signal<ViewState>('idle');
  urlInput = '';
  progress = signal(0);
  editableTitle = '';
  editableTypeId = '';
  selectedTopicIds = signal<string[]>([]);
  saveError = signal<string | null>(null);

  readonly supportedDomains = [
    { name: 'Medium', url: 'medium.com', icon: '📝' },
    { name: 'GitHub', url: 'github.com', icon: '🐙' },
    { name: 'freeCodeCamp', url: 'freecodecamp.org', icon: '🎓' },
    { name: 'Swagger', url: 'swagger.io', icon: '📄' },
    { name: 'Lexington Soft', url: 'lexingtonsoft.com', icon: '🏢' },
    { name: 'Melsatar Blog', url: 'melsatar.blog', icon: '📖' },
    { name: 'YouTube', url: 'youtube.com', icon: '▶️' },
    { name: 'Vimeo', url: 'vimeo.com', icon: '🎬' },
  ];

  private progressInterval: number | undefined;

  ngOnInit(): void {
    this.resourceTypeService.loadAll();
    this.topicService.loadAll();

    this.typeInitInterval = setInterval(() => {
      const types = this.resourceTypeService.resourceTypes();
      if (types.length > 0 && !this.editableTypeId) {
        this.editableTypeId = types[0].id;
        clearInterval(this.typeInitInterval);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.typeInitInterval);
    this.stopProgressSimulation();
  }

  async fetchMetadata(): Promise<void> {
    const url = this.urlInput.trim();
    if (!url) return;

    this.viewState.set('loading');
    this.startProgressSimulation();

    const result = await this.previewService.preview(url);
    this.stopProgressSimulation();

    if (result) {
      this.editableTitle = result.title || '';
      this.editableTypeId = result.resourceTypeId || this.editableTypeId;
      this.viewState.set('success');
    } else {
      this.viewState.set('error');
    }
  }

  toggleTopic(topicId: string): void {
    const current = this.selectedTopicIds();
    if (current.includes(topicId)) {
      this.selectedTopicIds.set(current.filter((id) => id !== topicId));
    } else {
      this.selectedTopicIds.set([...current, topicId]);
    }
  }

  private startProgressSimulation(): void {
    this.progress.set(0);
    this.progressInterval = setInterval(() => {
      const current = this.progress();
      if (current < 95) {
        const next = current + Math.floor(Math.random() * 10) + 1;
        this.progress.set(Math.min(next, 95));
      }
    }, 200);
  }
  private stopProgressSimulation(): void {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progress.set(100);
  }

  async saveResource(): Promise<void> {
    const preview = this.previewService.previewData();
    if (!preview) return;

    if (this.selectedTopicIds().length === 0) {
      this.previewService.error.set('Please select at least one topic');
      this.viewState.set('error');
      return;
    }

    let typeId = this.editableTypeId;
    if (!typeId) {
      const types = this.resourceTypeService.resourceTypes();
      if (types.length === 0) {
        this.previewService.error.set('No resource type available');
        this.viewState.set('error');
        return;
      }
      typeId = types[0].id;
    }

    const payload = {
      title: this.editableTitle || preview.title || 'Untitled',
      url: this.urlInput.trim(),
      imageUrl: preview.imageUrl,
      resourceTypeId: typeId,
      topicIds: this.selectedTopicIds(),
      difficulty: 'Medium' as DifficultyLevel,
      energyLevel: 'Medium' as EnergyLevel,
      status: 'Pending' as ResourceStatus,
      estimatedDurationMinutes: 30,
      notes: '',
    };

    try {
      await this.learningResourceService.addResource(payload);
      this.router.navigate(['/resources']);
    } catch (error) {
      console.error(error);
      this.previewService.error.set('Failed to save resource');
      this.saveError.set('Failed to save resource. Please try again.');
    }
  }

  retry(): void {
    this.previewService.reset();
    this.fetchMetadata();
  }

  goToManual(): void {
    this.router.navigate(['/add/guided']);
  }

  discard(): void {
    this.previewService.reset();
    this.viewState.set('idle');
    this.urlInput = '';
    this.editableTitle = '';
    this.editableTypeId = '';
    this.selectedTopicIds.set([]);
    this.saveError.set(null);
  }

  goBack(): void {
    this.router.navigate(['/add']);
  }
}
