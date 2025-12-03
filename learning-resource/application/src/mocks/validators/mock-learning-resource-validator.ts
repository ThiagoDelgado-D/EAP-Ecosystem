import { UUID } from "domain-lib";
import { LearningResourceValidator } from "../../validators/learning-resource-validator";
import { DifficultyType } from "@learning-resource/domain";
import { ValidationResult } from "domain-lib";

export interface MockValidatorConfig {
  isPayloadValid?: boolean;
  payloadErrors?: Record<string, string>;
  isUrlValid?: boolean;
  urlErrors?: Record<string, string>;
  isDifficultyToggleValid?: boolean;
  difficultyToggleErrors?: Record<string, string>;
}

export const mockValidator = (
  config: MockValidatorConfig = {}
): LearningResourceValidator => {
  const {
    isPayloadValid = true,
    payloadErrors = {},
    isUrlValid = true,
    urlErrors = {},
    isDifficultyToggleValid = true,
    difficultyToggleErrors = {},
  } = config;
  return {
    async isValidAddPayload() {
      return {
        isValid: isPayloadValid,
        errors: isPayloadValid ? {} : payloadErrors,
      };
    },

    async isValidUrl() {
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
  };
};
