import { UUID, ValidationResult } from "domain-lib";
import { AddResourceRequestModel } from "../use-cases/learning-resource/add-resource";
import { DifficultyType } from "@learning-resource/domain";

export interface LearningResourceValidator {
  isValidAddPayload(
    payload: AddResourceRequestModel
  ): Promise<ValidationResult>;
  isValidUrl(url?: string): Promise<ValidationResult>;
  isValidDifficultyToggle(params: {
    id: UUID;
    difficulty: DifficultyType;
  }): Promise<ValidationResult>;
}
