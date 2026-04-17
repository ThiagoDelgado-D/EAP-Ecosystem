// Shape returned by GET /learning-resources (list endpoint)
export interface LearningResourceDto {
  id: string;
  title: string;
  difficulty: string;
  energyLevel: string;
  status: string;
  typeId: string;
  topicIds: string[];
}

// Shape returned by GET /learning-resources/:id
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

export interface LearningResourceListDto {
  resources: LearningResourceDto[];
}
