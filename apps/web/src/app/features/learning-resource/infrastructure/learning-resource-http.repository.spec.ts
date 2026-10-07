import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '@core/config/api.config';
import type { ResourceStatus } from '@features/learning-resource/domain/learning-resource.model';
import { LearningResourceHttpRepository } from './learning-resource-http.repository';
import type { LearningResourceDto, LearningResourceListDto } from './learning-resource.dto';

const LEARNING_RESOURCES_URL = `${API_CONFIG.baseUrl}/learning-resources`;
const IN_PROGRESS_STATUS: ResourceStatus = 'InProgress';
const IN_PROGRESS_API_STATUS = 'in_progress';
const MEDIUM_API_DIFFICULTY = 'medium';
const HIGH_API_ENERGY_LEVEL = 'high';
const RUST_BOOK_CHAPTER_TITLE = 'Rust Book Chapter 17';
const RUST_BOOK_CHAPTER_ESTIMATED_MINUTES = 45;
const RUST_BOOK_CHAPTER_CREATED_AT = new Date();
const RUST_BOOK_CHAPTER_UPDATED_AT = new Date();

describe('LearningResourceHttpRepository', () => {
  let repository: LearningResourceHttpRepository;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LearningResourceHttpRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(LearningResourceHttpRepository);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('getByFilter should query the learning-resources list endpoint with the API status value', async () => {
    const rustBookChapter: LearningResourceDto = {
      resourceId: crypto.randomUUID(),
      title: RUST_BOOK_CHAPTER_TITLE,
      difficulty: MEDIUM_API_DIFFICULTY,
      energyLevel: HIGH_API_ENERGY_LEVEL,
      status: IN_PROGRESS_API_STATUS,
      typeId: crypto.randomUUID(),
      topicIds: [],
      estimatedDurationMinutes: RUST_BOOK_CHAPTER_ESTIMATED_MINUTES,
      createdAt: RUST_BOOK_CHAPTER_CREATED_AT.toISOString(),
      updatedAt: RUST_BOOK_CHAPTER_UPDATED_AT.toISOString(),
    };
    const response: LearningResourceListDto = { resources: [rustBookChapter] };

    const resultPromise = repository.getByFilter({ status: IN_PROGRESS_STATUS });

    const request = httpController.expectOne((candidate) => candidate.url === LEARNING_RESOURCES_URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe(IN_PROGRESS_API_STATUS);
    request.flush(response);

    const result = await resultPromise;

    expect(result.map((resource) => resource.id)).toEqual([rustBookChapter.resourceId]);
    expect(result[0]!.title).toBe(RUST_BOOK_CHAPTER_TITLE);
    expect(result[0]!.status).toBe(IN_PROGRESS_STATUS);
    expect(result[0]!.createdAt).toEqual(RUST_BOOK_CHAPTER_CREATED_AT);
    expect(result[0]!.updatedAt).toEqual(RUST_BOOK_CHAPTER_UPDATED_AT);
  });
});
