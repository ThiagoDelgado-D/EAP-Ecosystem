import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";

export class ResourceDetailResponseDto {
  resourceId: string;
  title: string;
  url?: string;
  topicIds: string[];
  difficulty: DifficultyType;
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevelType;
  status?: ResourceStatusType;
  notes?: string;
}
