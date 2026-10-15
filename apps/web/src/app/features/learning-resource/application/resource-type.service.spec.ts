import { TestBed } from '@angular/core/testing';
import { messageOf } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import {
  mockResourceTypeRepository,
  type MockedResourceTypeRepository,
} from './mocks/mock-resource-type.repository';
import { ResourceTypeService } from './resource-type.service';

const buildResourceType = (code: string, displayName: string): ResourceType => {
  const now = new Date();
  return { id: crypto.randomUUID(), code, displayName, createdAt: now, updatedAt: now };
};

describe('ResourceTypeService', () => {
  let service: ResourceTypeService;
  let repository: MockedResourceTypeRepository;
  let bookType: ResourceType;

  beforeEach(() => {
    bookType = buildResourceType('BOOK', 'Book');
    repository = mockResourceTypeRepository({ resourceTypes: [bookType] });
    TestBed.configureTestingModule({
      providers: [ResourceTypeService, { provide: ResourceTypeRepository, useValue: repository }],
    });
    service = TestBed.inject(ResourceTypeService);
  });

  test('loadAll lists the resource types from the repository', async () => {
    await service.loadAll();

    expect(service.resourceTypes()).toEqual([bookType]);
    expect(service.error()).toBeNull();
  });

  test('loadAll stores why the resource types failed to load', async () => {
    const offline = offlineError();
    vi.spyOn(repository, 'getAll').mockRejectedValueOnce(offline);

    await service.loadAll();

    expect(service.error()).toBe(messageOf(offline));
    expect(service.loading()).toBe(false);
  });
});
