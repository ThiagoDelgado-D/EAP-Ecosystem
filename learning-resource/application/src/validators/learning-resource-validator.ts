import { UUID, ValidationResult } from "domain-lib";
import {
  AddResourceRequestModel,
  UpdateResourceRequestModel,
} from "../use-cases/learning-resource";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";

export interface LearningResourceValidator {
  isValidAddPayload(
    payload: AddResourceRequestModel
  ): Promise<ValidationResult>;
  isValidUpdatePayload(
    payload: UpdateResourceRequestModel
  ): Promise<ValidationResult>;
  isValidUrl(url?: string): Promise<ValidationResult>;
  isValidDifficultyToggle(params: {
    id: UUID;
    difficulty: DifficultyType;
  }): Promise<ValidationResult>;
  isValidEnergyLevelToggle(params: {
    id: UUID;
    energyLevel: EnergyLevelType;
  }): Promise<ValidationResult>;
  isValidStatusToggle(params: {
    id: UUID;
    status: ResourceStatusType;
  }): Promise<ValidationResult>;
}
