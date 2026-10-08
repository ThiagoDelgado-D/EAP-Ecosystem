import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '@core/config/api.config';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { ResourceSort } from '@features/learning-resource/domain/learning-resource.model';
import type { PaginatedResourcesDto } from '@features/learning-resource/infrastructure/learning-resource.dto';
import { LearningResourceService } from './learning-resource.service';

const LEARNING_RESOURCES_URL = `${API_CONFIG.baseUrl}/learning-resources`;
const SHORTEST_FIRST_SORT: ResourceSort = 'estimatedDurationMinutes';
const RUST_TOPIC_ID = crypto.randomUUID();
const SYSTEMS_DESIGN_TOPIC_ID = crypto.randomUUID();
const EMPTY_PAGE: PaginatedResourcesDto = {
  resources: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

describe('LearningResourceService', () => {
  let service: LearningResourceService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LearningResourceService,
        { provide: LearningResourceRepository, useValue: {} },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LearningResourceService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  const expectListRequest = () =>
    httpController.expectOne((candidate) => candidate.url === LEARNING_RESOURCES_URL);

  test('load should send the sort as the API query rule', async () => {
    const loading = service.load({ sort: SHORTEST_FIRST_SORT });

    const request = expectListRequest();
    expect(request.request.params.get('sort')).toBe(SHORTEST_FIRST_SORT);
    request.flush(EMPTY_PAGE);
    await loading;
  });

  test('load should repeat topicIds once per selected topic', async () => {
    const loading = service.load({ topicIds: [RUST_TOPIC_ID, SYSTEMS_DESIGN_TOPIC_ID] });

    const request = expectListRequest();
    expect(request.request.params.getAll('topicIds')).toEqual([
      RUST_TOPIC_ID,
      SYSTEMS_DESIGN_TOPIC_ID,
    ]);
    request.flush(EMPTY_PAGE);
    await loading;
  });

  test('load should leave sort and topicIds out when none are chosen', async () => {
    const loading = service.load({});

    const request = expectListRequest();
    expect(request.request.params.has('sort')).toBe(false);
    expect(request.request.params.has('topicIds')).toBe(false);
    request.flush(EMPTY_PAGE);
    await loading;
  });
});
