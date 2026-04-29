import { HttpException } from "@nestjs/common";
import type { LearningResourceDomainError } from "@learning-resource/application";
import type { UserDomainError } from "@user/application";

type AppDomainError = LearningResourceDomainError | UserDomainError;
type ErrorName = AppDomainError["name"];

const httpStatusMap: Record<ErrorName, number> = {
  INVALID_DATA_ERROR: 400,
  NOT_FOUND_ERROR: 404,
  LEARNING_RESOURCE_NOT_FOUND_ERROR: 404,
  VALIDATION_ERROR: 400,
  INVALID_OR_EXPIRED_CODE_ERROR: 400,
};

export function toHttpException(error: AppDomainError): never {
  throw new HttpException(error.context ?? {}, httpStatusMap[error.name]);
}
