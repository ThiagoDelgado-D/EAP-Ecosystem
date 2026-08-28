import { HttpException } from "@nestjs/common";
import type {
  LearningResourceDomainError,
  LearningPathDomainError,
  LearningPathNodeDomainError,
  LearningPathEdgeDomainError,
} from "@learning-resource/application";
import type { UserDomainError } from "@user/application";

type AppDomainError =
  | LearningResourceDomainError
  | UserDomainError
  | LearningPathDomainError
  | LearningPathNodeDomainError
  | LearningPathEdgeDomainError;
type ErrorName = AppDomainError["name"];

const httpStatusMap: Record<ErrorName, number> = {
  INVALID_DATA_ERROR: 400,
  NOT_FOUND_ERROR: 404,
  LEARNING_RESOURCE_NOT_FOUND_ERROR: 404,
  VALIDATION_ERROR: 400,
  INVALID_OR_EXPIRED_CODE_ERROR: 400,
  USER_NOT_FOUND_ERROR: 404,
  SESSION_NOT_FOUND_ERROR: 404,
  FORBIDDEN_ERROR: 403,
  LEARNING_PATH_NOT_FOUND_ERROR: 404,
  LEARNING_PATH_FORBIDDEN_ERROR: 403,
  LEARNING_PATH_NODE_NOT_FOUND_ERROR: 404,
  LEARNING_PATH_EDGE_NOT_FOUND_ERROR: 404,
  DUPLICATE_LEARNING_PATH_EDGE_ERROR: 409,
};

export function toHttpException(error: AppDomainError): never {
  throw new HttpException(error.context ?? {}, httpStatusMap[error.name]);
}
