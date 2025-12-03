import { LearningResourceValidator } from "../../validators";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { UUID, ValidationResult } from "domain-lib";
import { UpdateResourceRequestModel } from "../../use-cases/learning-resource";

export interface MockValidatorConfig {
  isPayloadValid?: boolean;
  payloadErrors?: Record<string, string>;
  isUpdatePayloadValid?: boolean;
  updatePayloadErrors?: Record<string, string>;
  isUrlValid?: boolean;
  urlErrors?: Record<string, string>;
  isDifficultyToggleValid?: boolean;
  difficultyToggleErrors?: Record<string, string>;
  isEnergyLevelToggleValid?: boolean;
  energyLevelToggleErrors?: Record<string, string>;
  isStatusToggleValid?: boolean;
  statusToggleErrors?: Record<string, string>;
}

export const mockValidator = (
  config: MockValidatorConfig = {}
): LearningResourceValidator => {
  const {
    isPayloadValid = true,
    payloadErrors = {},
    isUpdatePayloadValid = true,
    updatePayloadErrors = {},
    isUrlValid = true,
    urlErrors = {},
    isDifficultyToggleValid = true,
    difficultyToggleErrors = {},
    isEnergyLevelToggleValid = true,
    energyLevelToggleErrors = {},
    isStatusToggleValid = true,
    statusToggleErrors = {},
  } = config;
  return {
    async isValidAddPayload(): Promise<ValidationResult> {
      return {
        isValid: isPayloadValid,
        errors: isPayloadValid ? {} : payloadErrors,
      };
    },

    async isValidUpdatePayload(
      payload: UpdateResourceRequestModel
    ): Promise<ValidationResult> {
      if (!isUpdatePayloadValid) {
        return {
          isValid: false,
          errors: updatePayloadErrors,
        };
      }

      const errors: Record<string, string> = {};

      if (payload.title !== undefined) {
        if (payload.title.trim().length === 0) {
          errors.title = "Title cannot be empty";
        } else if (payload.title.trim().length > 500) {
          errors.title = "Title must be less than 500 characters";
        }
      }

      if (payload.url !== undefined && payload.url.trim().length > 0) {
        const urlValidation = await this.isValidUrl(payload.url);
        if (!urlValidation.isValid) {
          errors.url = "Invalid URL format";
        }
      }

      if (payload.topicIds !== undefined && payload.topicIds.length === 0) {
        errors.topicIds = "At least one topic is required";
      }

      if (payload.estimatedDurationMinutes !== undefined) {
        if (payload.estimatedDurationMinutes <= 0) {
          errors.estimatedDurationMinutes = "Duration must be greater than 0";
        } else if (payload.estimatedDurationMinutes > 10000) {
          errors.estimatedDurationMinutes =
            "Duration must be less than 10000 minutes";
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },

    async isValidUrl(): Promise<ValidationResult> {
      return {
        isValid: isUrlValid,
        errors: isUrlValid ? {} : urlErrors,
      };
    },

    async isValidDifficultyToggle(params: {
      id: UUID;
      difficulty: DifficultyType;
    }): Promise<ValidationResult> {
      if (!params.id) {
        return {
          isValid: false,
          errors: { id: "Resource ID is required" },
        };
      }

      if (!params.difficulty) {
        return {
          isValid: false,
          errors: { difficulty: "Difficulty is required" },
        };
      }

      return {
        isValid: isDifficultyToggleValid,
        errors: isDifficultyToggleValid ? {} : difficultyToggleErrors,
      };
    },

    async isValidEnergyLevelToggle(params: {
      id: UUID;
      energyLevel: EnergyLevelType;
    }): Promise<ValidationResult> {
      if (!params.id) {
        return {
          isValid: false,
          errors: { id: "Resource ID is required" },
        };
      }

      if (!params.energyLevel) {
        return {
          isValid: false,
          errors: { energyLevel: "Energy level is required" },
        };
      }

      return {
        isValid: isEnergyLevelToggleValid,
        errors: isEnergyLevelToggleValid ? {} : energyLevelToggleErrors,
      };
    },

    async isValidStatusToggle(params: {
      id: UUID;
      status: ResourceStatusType;
    }): Promise<ValidationResult> {
      if (!params.id) {
        return {
          isValid: false,
          errors: { id: "Resource ID is required" },
        };
      }

      if (!params.status) {
        return {
          isValid: false,
          errors: { status: "Status is required" },
        };
      }

      return {
        isValid: isStatusToggleValid,
        errors: isStatusToggleValid ? {} : statusToggleErrors,
      };
    },
  };
};
