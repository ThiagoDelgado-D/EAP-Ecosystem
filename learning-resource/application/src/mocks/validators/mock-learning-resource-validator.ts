import { LearningResourceValidator } from "../../validators";
import { DifficultyType, EnergyLevelType } from "@learning-resource/domain";
import { UUID, ValidationResult } from "domain-lib";

export interface MockValidatorConfig {
  isPayloadValid?: boolean;
  payloadErrors?: Record<string, string>;
  isUrlValid?: boolean;
  urlErrors?: Record<string, string>;
  isDifficultyToggleValid?: boolean;
  difficultyToggleErrors?: Record<string, string>;
  isEnergyLevelToggleValid?: boolean;
  energyLevelToggleErrors?: Record<string, string>;
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
    isEnergyLevelToggleValid = true,
    energyLevelToggleErrors = {},
  } = config;
  return {
    async isValidAddPayload(): Promise<ValidationResult> {
      return {
        isValid: isPayloadValid,
        errors: isPayloadValid ? {} : payloadErrors,
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
  };
};
