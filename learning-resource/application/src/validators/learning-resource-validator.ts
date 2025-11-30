import { ValidationResult } from "domain-lib";
import { AddResourceRequestModel } from "../use-cases/learning-resource/add-resource";

export interface LearningResourceValidator {
  isValidAddPayload(
    payload: AddResourceRequestModel
  ): Promise<ValidationResult>;
  isValidUrl(url?: string): Promise<ValidationResult>;
}
