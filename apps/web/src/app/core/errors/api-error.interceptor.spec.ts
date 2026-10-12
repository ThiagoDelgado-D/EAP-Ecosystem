import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { apiErrorInterceptor } from './api-error.interceptor';
import { isApiError, NETWORK_ERROR, type AnyApiError, type ApiErrorName } from './api-error';

const TOPICS_URL = `${API_CONFIG.baseUrl}/topics`;
const RATE_LIMITED_ERROR = 'TOO_MANY_REQUESTS_ERROR' satisfies ApiErrorName;
const DUPLICATE_TOPIC_ERROR = 'DUPLICATE_TOPIC_NAME_ERROR' satisfies ApiErrorName;
const UNEXPECTED_ERROR = 'UNEXPECTED_ERROR' satisfies ApiErrorName;
const ERROR_FROM_A_NEWER_API = 'ERROR_ADDED_AFTER_THIS_TAB_LOADED';
const RETRY_AFTER_SECONDS = 42;
const RATE_LIMITED_RESPONSE = { status: 429, statusText: 'Too Many Requests' };
const CONFLICT_RESPONSE = { status: 409, statusText: 'Conflict' };
const BAD_GATEWAY_RESPONSE = { status: 502, statusText: 'Bad Gateway' };
const PROXY_ERROR_PAGE = '<html>Bad Gateway</html>';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  const failedTopicsRequest = async (respond: (url: string) => void): Promise<AnyApiError> => {
    const rejection = firstValueFrom(http.get(TOPICS_URL)).catch((error: unknown) => error);
    respond(TOPICS_URL);
    const error = await rejection;
    if (!isApiError(error)) throw new Error('Expected the interceptor to reject with an ApiError');
    return error;
  };

  test('keeps the error name, status and context the API sent', async () => {
    const error = await failedTopicsRequest((url) =>
      httpController
        .expectOne(url)
        .flush(
          { error: RATE_LIMITED_ERROR, retryAfterSeconds: RETRY_AFTER_SECONDS },
          RATE_LIMITED_RESPONSE,
        ),
    );

    expect(error.name).toBe(RATE_LIMITED_ERROR);
    expect(error.status).toBe(RATE_LIMITED_RESPONSE.status);
    expect(error.context).toEqual({ retryAfterSeconds: RETRY_AFTER_SECONDS });
  });

  test('leaves the context empty for an error that carries none', async () => {
    const error = await failedTopicsRequest((url) =>
      httpController.expectOne(url).flush({ error: DUPLICATE_TOPIC_ERROR }, CONFLICT_RESPONSE),
    );

    expect(error.name).toBe(DUPLICATE_TOPIC_ERROR);
    expect(error.context).toBeUndefined();
  });

  test('treats a name this client does not know as unexpected, keeping the status', async () => {
    const error = await failedTopicsRequest((url) =>
      httpController.expectOne(url).flush({ error: ERROR_FROM_A_NEWER_API }, CONFLICT_RESPONSE),
    );

    expect(error.name).toBe(UNEXPECTED_ERROR);
    expect(error.status).toBe(CONFLICT_RESPONSE.status);
  });

  test('treats a body without an error name as unexpected', async () => {
    const error = await failedTopicsRequest((url) =>
      httpController.expectOne(url).flush(PROXY_ERROR_PAGE, BAD_GATEWAY_RESPONSE),
    );

    expect(error.name).toBe(UNEXPECTED_ERROR);
    expect(error.status).toBe(BAD_GATEWAY_RESPONSE.status);
  });

  test('reports a request that never reached the server as a network error', async () => {
    const error = await failedTopicsRequest((url) =>
      httpController.expectOne(url).error(new ProgressEvent('error')),
    );

    expect(error.name).toBe(NETWORK_ERROR);
  });
});
