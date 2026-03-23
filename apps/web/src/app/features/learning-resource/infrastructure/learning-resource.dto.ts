export interface LearningResourceDto {
  id: string;
  title: string;
  url: string | null;
  notes: string | null;
  difficulty: string;
  energyLevel: string;
  status: string;
  estimatedDuration?: {
    value: number;
    isEstimated: boolean;
  };
  topicIds: string[];
  typeId: string;
  lastViewed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResourceListDto {
  resources: LearningResourceDto[];
}
