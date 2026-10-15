import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ErrorNotifier } from '@core/errors/error-notifier.service';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { mockResourceTypeRepository } from '@features/learning-resource/application/mocks/mock-resource-type.repository';
import { mockTopicRepository } from '@features/learning-resource/application/mocks/mock-topic.repository';
import { mockLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { HomeComponent } from './home.component';

const buildResource = (title: string): LearningResource => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title,
    difficulty: 'Medium',
    energyLevel: 'Medium',
    status: 'Pending',
    estimatedDuration: { value: 45, isEstimated: true },
    topicIds: [],
    typeId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
};

function setup(resources: LearningResource[]) {
  const repository = mockLearningResourceRepository({ resources });
  TestBed.overrideComponent(HomeComponent, {
    set: {
      providers: [
        LearningResourceService,
        ResourceTypeService,
        TopicService,
        { provide: LearningResourceRepository, useValue: repository },
        { provide: ResourceTypeRepository, useValue: mockResourceTypeRepository() },
        { provide: TopicRepository, useValue: mockTopicRepository() },
      ],
    },
  });
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const component = TestBed.createComponent(HomeComponent).componentInstance;
  return { component, repository };
}

describe('HomeComponent', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should report why advancing a resource status failed', async () => {
    const rustBook = buildResource('Rust Book Chapter 17');
    const { component, repository } = setup([rustBook]);
    const offline = offlineError();
    vi.spyOn(repository, 'toggleStatus').mockRejectedValueOnce(offline);
    const notify = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');

    await component.cycleStatus(rustBook);

    expect(notify).toHaveBeenCalledWith(offline);
    expect(component.toggleLoadingId()).toBeNull();
  });
});
