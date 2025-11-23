import { LearningResourceValidator } from "../../validators/learning-resource-validator";

export const mockValidator = (
  validAddPayload: boolean = true,
  isValidUrl: boolean = true
) => {
  const validator: LearningResourceValidator = {
    async isValidAddPayload(): Promise<boolean> {
      return validAddPayload;
    },
    async isValidUrl(): Promise<boolean> {
      return isValidUrl;
    },
  };

  return validator;
};
