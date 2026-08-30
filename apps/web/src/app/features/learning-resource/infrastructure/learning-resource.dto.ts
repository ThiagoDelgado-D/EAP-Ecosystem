export interface LearningResourceDto {
  id: string;
  title: string;
  difficulty: string;
  energyLevel: string;
  status: string;
  typeId: string;
  topicIds: string[];
}

export interface LearningResourceByIdDto {
  resourceId: string;
  title: string;
  url?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  difficulty: string;
  energyLevel?: string;
  mentalState?: string | null;
  status?: string;
  estimatedDurationMinutes: number;
  topicIds: string[];
  typeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedLearningResourceDto {
  id: string;
  title: string;
  url?: string | null;
  imageUrl?: string | null;
  typeId: string;
  topicIds: string[];
  difficulty: string;
  estimatedDuration: { value: number; isEstimated: boolean };
  energyLevel: string;
  mentalState?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResourceListDto {
  resources: LearningResourceDto[];
}

export interface PaginatedResourcesDto {
  resources: LearningResourceDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
