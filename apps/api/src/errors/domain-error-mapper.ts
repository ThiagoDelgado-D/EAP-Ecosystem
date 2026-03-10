import { HttpException } from "@nestjs/common";
import type { LearningResourceDomainError } from "@learning-resource/application";

type ErrorName = LearningResourceDomainError["name"];

const httpStatusMap: Record<ErrorName, number> = {
  INVALID_DATA_ERROR: 400,
  NOT_FOUND_ERROR: 404,
  LEARNING_RESOURCE_NOT_FOUND_ERROR: 404,
  VALIDATION_ERROR: 400,
};

export function toHttpException(error: LearningResourceDomainError): never {
  throw new HttpException(error.context ?? {}, httpStatusMap[error.name]);
}
