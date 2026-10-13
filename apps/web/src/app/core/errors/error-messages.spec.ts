import { ApiError, type ApiErrorName } from './api-error';
import { ERROR_MESSAGES, isKnownErrorName, messageFor, messageOf } from './error-messages';

const RATE_LIMITED_STATUS = 429;
const CONFLICT_STATUS = 409;
const RETRY_AFTER_SECONDS = 42;
const DUPLICATE_TOPIC_ERROR = 'DUPLICATE_TOPIC_NAME_ERROR' satisfies ApiErrorName;
const ERROR_FROM_A_NEWER_API = 'ERROR_ADDED_AFTER_THIS_TAB_LOADED';

describe('error messages', () => {
  test('gives an error its fixed message', () => {
    const duplicateTopic = new ApiError(DUPLICATE_TOPIC_ERROR, CONFLICT_STATUS, undefined);

    expect(messageFor(duplicateTopic)).toBe(ERROR_MESSAGES[DUPLICATE_TOPIC_ERROR]);
  });

  test('tells a rate-limited learner how long to wait', () => {
    const rateLimited = new ApiError('TOO_MANY_REQUESTS_ERROR', RATE_LIMITED_STATUS, {
      retryAfterSeconds: RETRY_AFTER_SECONDS,
    });

    expect(messageFor(rateLimited)).toContain(`${RETRY_AFTER_SECONDS} seconds`);
  });

  test('still explains a rate limit when the API sent no wait time', () => {
    const rateLimited = new ApiError('TOO_MANY_REQUESTS_ERROR', RATE_LIMITED_STATUS, {});

    expect(messageFor(rateLimited)).not.toContain('undefined');
  });

  test('recognizes only the names it has a message for', () => {
    expect(isKnownErrorName(DUPLICATE_TOPIC_ERROR)).toBe(true);
    expect(isKnownErrorName(ERROR_FROM_A_NEWER_API)).toBe(false);
  });

  test('falls back to the unexpected-error message for anything that is not an API error', () => {
    expect(messageOf(new TypeError())).toBe(ERROR_MESSAGES.UNEXPECTED_ERROR);
  });
});
