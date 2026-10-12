import type { UserDomainError } from '@user/application';
import type {
  LearningResourceDomainError,
  LearningPathDomainError,
  LearningPathNodeDomainError,
  LearningPathEdgeDomainError,
  TopicDomainError,
} from '@learning-resource/application';
import type { PomodoroDomainError } from '@pomodoro/application';
import type { RecommendationDomainError } from '@recommendation/application';
import type { TooManyRequestsError, UnauthorizedError, UnexpectedError } from 'domain-lib';

export type AppDomainError =
  | UserDomainError
  | LearningResourceDomainError
  | LearningPathDomainError
  | LearningPathNodeDomainError
  | LearningPathEdgeDomainError
  | TopicDomainError
  | PomodoroDomainError
  | RecommendationDomainError
  | TooManyRequestsError
  | UnauthorizedError
  | UnexpectedError;

export type AppErrorName = AppDomainError['name'];
