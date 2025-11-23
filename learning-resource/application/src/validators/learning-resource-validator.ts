import { AddResourceRequestModel } from "../use-cases/learning-resource/add-resource";

export interface LearningResourceValidator {
  isValidAddPayload(payload: AddResourceRequestModel): Promise<boolean>;
  isValidUrl(url?: string): Promise<boolean>;
}
