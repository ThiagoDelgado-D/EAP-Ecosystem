import { ApiError, isApiError, type ApiErrorContext, type ApiErrorName } from './api-error';

const UNKNOWN_STATUS = 0;

type ErrorMessage<N extends ApiErrorName> = string | ((context: ApiErrorContext<N>) => string);

export const ERROR_MESSAGES: { [N in ApiErrorName]: ErrorMessage<N> } = {
  INVALID_DATA_ERROR: 'Some of the information is invalid. Check it and try again.',
  VALIDATION_ERROR: 'Some of the information is invalid. Check it and try again.',
  NOT_FOUND_ERROR: 'We couldn’t find what you were looking for.',
  FORBIDDEN_ERROR: 'You don’t have access to this.',
  UNAUTHORIZED_ERROR: 'Your session has expired. Sign in again.',
  TOO_MANY_REQUESTS_ERROR: retryLaterMessage,
  UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Can’t reach the server. Check your connection and try again.',
  INVALID_OR_EXPIRED_CODE_ERROR: 'That code is invalid or has expired. Request a new one.',
  USER_NOT_FOUND_ERROR: 'We couldn’t find your account.',
  LEARNING_RESOURCE_NOT_FOUND_ERROR: 'This resource no longer exists.',
  LEARNING_RESOURCE_FORBIDDEN_ERROR: 'You don’t have access to this resource.',
  LEARNING_PATH_NOT_FOUND_ERROR: 'This learning path no longer exists.',
  LEARNING_PATH_FORBIDDEN_ERROR: 'You don’t have access to this learning path.',
  LEARNING_PATH_NODE_NOT_FOUND_ERROR: 'This step no longer exists in the path.',
  LEARNING_PATH_EDGE_NOT_FOUND_ERROR: 'This connection no longer exists in the path.',
  DUPLICATE_LEARNING_PATH_EDGE_ERROR: 'These steps are already connected.',
  TOPIC_NOT_FOUND_ERROR: 'This topic no longer exists.',
  DUPLICATE_TOPIC_NAME_ERROR: 'You already have a topic with that name.',
  SESSION_NOT_FOUND_ERROR: 'This focus session no longer exists.',
  SESSION_FORBIDDEN_ERROR: 'You don’t have access to this focus session.',
  SESSION_ALREADY_ACTIVE_ERROR: 'You already have a focus session running.',
  SESSION_STILL_ACTIVE_ERROR: 'Finish your current focus session first.',
  SESSION_NOT_ACTIVE_ERROR: 'This focus session has already ended.',
  SESSION_NOT_COMPLETED_ERROR: 'This focus session isn’t finished yet.',
  SEGMENTS_ALREADY_ATTRIBUTED_ERROR: 'The time in this session is already assigned.',
  NO_OPEN_SEGMENT_ERROR: 'There’s no running segment in this session.',
  PLANNED_TIME_NOT_REACHED_ERROR: 'The planned time for this session hasn’t been reached yet.',
  AMBIGUOUS_PATH_TARGET_ERROR:
    'This resource is in more than one path. Pick which one to focus on.',
  SEGMENT_TARGET_FORBIDDEN_ERROR: 'You can’t focus on something you don’t have access to.',
  BREAK_NOT_FOUND_ERROR: 'This break no longer exists.',
  BREAK_FORBIDDEN_ERROR: 'You don’t have access to this break.',
  BREAK_ALREADY_ACTIVE_ERROR: 'You’re already on a break.',
  BREAK_NOT_ACTIVE_ERROR: 'This break has already ended.',
  RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR: 'Tell us how you feel today to get recommendations.',
};

function retryLaterMessage(context: ApiErrorContext<'TOO_MANY_REQUESTS_ERROR'>): string {
  if (!context.retryAfterSeconds) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  return `Too many attempts. Try again in ${context.retryAfterSeconds} seconds.`;
}

export function isKnownErrorName(name: string): name is ApiErrorName {
  return Object.hasOwn(ERROR_MESSAGES, name);
}

export function messageFor<N extends ApiErrorName>(error: ApiError<N>): string {
  const message: ErrorMessage<N> = ERROR_MESSAGES[error.name];
  if (typeof message === 'string') {
    return message;
  }
  return message(error.context);
}

export function messageOf(error: unknown): string {
  if (!isApiError(error)) {
    return messageFor(new ApiError('UNEXPECTED_ERROR', UNKNOWN_STATUS, undefined));
  }
  return messageFor(error);
}
