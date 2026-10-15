import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '@core/errors/api-error.interceptor';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { UrlPreviewService } from '@features/learning-resource/application/url-preview.service';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { vi } from 'vitest';
import { mockLearningResourceRepository } from './mock-learning-resource.repository';
import { mockResourceTypeRepository } from './mock-resource-type.repository';
import { mockTopicRepository } from './mock-topic.repository';

const ARTICLE_TYPE_CODE = 'ARTICLE';
const ARTICLE_TYPE_NAME = 'Article';

export function setupCaptureWithFailingSave<T>(component: Type<T>) {
  const now = new Date();
  const articleType: ResourceType = {
    id: crypto.randomUUID(),
    code: ARTICLE_TYPE_CODE,
    displayName: ARTICLE_TYPE_NAME,
    createdAt: now,
    updatedAt: now,
  };
  const resourceRepository = mockLearningResourceRepository();
  const offline = offlineError();
  vi.spyOn(resourceRepository, 'addResourceLearning').mockRejectedValue(offline);

  TestBed.overrideComponent(component, {
    set: {
      providers: [
        LearningResourceService,
        ResourceTypeService,
        TopicService,
        UrlPreviewService,
        { provide: LearningResourceRepository, useValue: resourceRepository },
        { provide: ResourceTypeRepository, useValue: mockResourceTypeRepository({ resourceTypes: [articleType] }) },
        { provide: TopicRepository, useValue: mockTopicRepository() },
      ],
    },
  });
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([apiErrorInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });

  const fixture = TestBed.createComponent(component);
  return { fixture, instance: fixture.componentInstance, offline, articleType, resourceRepository };
}
