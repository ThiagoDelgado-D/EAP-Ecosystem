import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";

export class ResourceResponseDto {
  id: string;
  title: string;
  difficulty: DifficultyType;
  energyLevel: EnergyLevelType;
  status: ResourceStatusType;
  typeId: string;
  topicIds: string[];
}
