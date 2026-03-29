export interface ResourceTypeDto {
  id: string;
  code: string;
  displayName: string;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceTypeListDto {
  resourceTypes: ResourceTypeDto[];
}
