import { TestBed } from '@angular/core/testing';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { nodeFixture, pathFixture } from './mocks/learning-path.fixture';
import {
  mockLearningPathRepository,
  type MockedLearningPathRepository,
} from './mocks/mock-learning-path.repository';
import { LearningPathDetailService } from './learning-path-detail.service';

describe('LearningPathDetailService', () => {
  const devOpsPath = pathFixture('DevOps Fundamentals (Deploy VPS)');
  const whatAVpsIs = nodeFixture(devOpsPath.id, 'What a VPS is', 0);
  const connectingOverSsh = nodeFixture(devOpsPath.id, 'Connecting over SSH', 1);
  const servingWithNginx = nodeFixture(devOpsPath.id, 'Serving the app with Nginx', 2);

  let learningPathRepository: MockedLearningPathRepository;
  let service: LearningPathDetailService;

  beforeEach(async () => {
    learningPathRepository = mockLearningPathRepository({
      paths: [devOpsPath],
      nodes: [whatAVpsIs, connectingOverSsh, servingWithNginx],
    });
    TestBed.configureTestingModule({
      providers: [
        LearningPathDetailService,
        { provide: LearningPathRepository, useValue: learningPathRepository },
      ],
    });
    service = TestBed.inject(LearningPathDetailService);
    await service.load(devOpsPath.id);
  });

  test('should explain why the path could not load', async () => {
    vi.spyOn(learningPathRepository, 'getById').mockRejectedValueOnce(offlineError());

    await service.load(devOpsPath.id);

    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });



});
