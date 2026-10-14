import { TestBed } from '@angular/core/testing';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { pathFixture } from './mocks/learning-path.fixture';
import {
  mockLearningPathRepository,
  type MockedLearningPathRepository,
} from './mocks/mock-learning-path.repository';
import { LearningPathService } from './learning-path.service';

const DEVOPS_PATH_TITLE = 'DevOps Fundamentals (Deploy VPS)';

describe('LearningPathService', () => {
  let learningPathRepository: MockedLearningPathRepository;
  let service: LearningPathService;

  beforeEach(() => {
    learningPathRepository = mockLearningPathRepository({ paths: [pathFixture(DEVOPS_PATH_TITLE)] });
    TestBed.configureTestingModule({
      providers: [
        LearningPathService,
        { provide: LearningPathRepository, useValue: learningPathRepository },
      ],
    });
    service = TestBed.inject(LearningPathService);
  });

  test('should explain why the paths could not load', async () => {
    vi.spyOn(learningPathRepository, 'getAll').mockRejectedValueOnce(offlineError());

    await service.loadAll();

    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    expect(service.loading()).toBe(false);
  });

  test('should explain why the paths and their nodes could not load', async () => {
    vi.spyOn(learningPathRepository, 'getAllWithNodes').mockRejectedValueOnce(offlineError());

    await service.loadAllWithNodes();

    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    expect(service.loading()).toBe(false);
  });
});
