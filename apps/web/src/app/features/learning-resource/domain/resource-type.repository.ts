import type { ResourceType } from './resource-type.model';

export abstract class ResourceTypeRepository {
  abstract getAll(): Promise<ResourceType[]>;
}
