import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import { STATUS_BADGE_OPTIONS } from '@shared/components/enum-badge/enum-badge-options';
import { pathColor } from '../start/path-color';

@Component({
  selector: 'app-library-resource-row',
  standalone: true,
  imports: [EnumBadgeComponent],
  providers: [
    ResourceTypeService,
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    TopicService,
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
  templateUrl: './library-resource-row.component.html',
})
export class LibraryResourceRowComponent {
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);

  @Input({ required: true }) resource!: LearningResource;
  @Input() selected = false;
  @Input() pathCount = 0;
  @Output() rowClick = new EventEmitter<void>();

  readonly statusOptions = STATUS_BADGE_OPTIONS;

  typeColor(): string {
    return pathColor(this.resource.typeId);
  }

  constructor() {
    void this.resourceTypeService.loadAll();
    void this.topicService.loadAll();
  }

  subtitle(): string {
    const parts = [
      this.typeLabel(),
      this.topicLabel(),
      `${this.resource.estimatedDuration.value} min`,
      this.pathCount > 0 ? `in ${this.pathCount} path${this.pathCount === 1 ? '' : 's'}` : '',
    ];
    return parts.filter(Boolean).join(' · ');
  }

  private typeLabel(): string {
    return this.resourceTypeService.resourceTypes().find((t) => t.id === this.resource.typeId)?.displayName ?? '';
  }

  private topicLabel(): string {
    const topic = this.topicService.topics().find((t) => this.resource.topicIds.includes(t.id));
    return topic?.name ?? '';
  }
}
