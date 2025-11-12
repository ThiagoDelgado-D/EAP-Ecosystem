import { AddResourceRequestModel } from "../use-cases/learning-resource/add-resource";
import { UpdateResourceRequestModel } from "../use-cases/learning-resource/update-resource";

export interface LearningResourceValidator {
  isValidAddPayload(payload: AddResourceRequestModel): Promise<boolean>;
  isValidUpdatePayload(payload: UpdateResourceRequestModel): Promise<boolean>;
  isValidUrl(url?: string): Promise<boolean>;
}
