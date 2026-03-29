export type DifficultyLevel = 'Low' | 'Medium' | 'High';
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type ResourceStatus = 'Pending' | 'InProgress' | 'Completed';

export interface LearningResource {
  id: string;
  title: string;
  url?: string;
  notes?: string;
  difficulty: DifficultyLevel;
  energyLevel: EnergyLevel;
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
  status?: ResourceStatus;
  topicIds?: string[];
  typeId?: string;
}
