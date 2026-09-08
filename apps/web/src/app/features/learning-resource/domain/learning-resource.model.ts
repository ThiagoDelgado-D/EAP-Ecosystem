import {
  DIFFICULTY_LEVELS,
  ENERGY_LEVELS,
  RESOURCE_STATUSES,
  MENTAL_STATE_TYPES,
} from './learning-resource.constants.js';

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];
export type MentalStateType = (typeof MENTAL_STATE_TYPES)[number];

export interface LearningResource {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  notes?: string;
  difficulty: DifficultyLevel;
  energyLevel: EnergyLevel;
  mentalState?: MentalStateType;
  status: ResourceStatus;
  estimatedDuration: {
    value: number;
    isEstimated: boolean;
  };
  topicIds: string[];
  typeId: string;
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningResourceFilter {
  difficulty?: DifficultyLevel;
  energyLevel?: EnergyLevel;
  mentalState?: MentalStateType;
  status?: ResourceStatus;
  topicIds?: string[];
  typeId?: string;
}

export interface AddResourcePayload {
  title: string;
  url?: string;
  imageUrl?: string;
  resourceTypeId: string;
  topicIds: string[];
  difficulty: DifficultyLevel;
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevel;
  mentalState?: MentalStateType;
  status?: ResourceStatus;
  notes?: string;
}

export interface UpdateResourcePayload {
  title?: string;
  url?: string;
  imageUrl?: string;
  typeId?: string;
  topicIds?: string[];
  estimatedDurationMinutes?: number;
  mentalState?: MentalStateType;
  notes?: string;
}

export interface PaginatedResourcesResponse {
  resources: LearningResource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ResourceQueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  difficulty?: DifficultyLevel;
  energyLevel?: EnergyLevel;
  status?: ResourceStatus;
  mentalState?: MentalStateType;
  resourceTypeId?: string;
}
