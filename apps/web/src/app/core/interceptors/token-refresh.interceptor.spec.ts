import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { type ApiErrorName } from '@core/errors/api-error';
import { apiErrorInterceptor } from '@core/errors/api-error.interceptor';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  REFRESH_URL,
  refreshResponseFor,
} from '@features/auth/infrastructure/mocks/refresh-response.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { authInterceptor } from './auth.interceptor';
import { tokenRefreshInterceptor } from './token-refresh.interceptor';

const TOPICS_URL = `${API_CONFIG.baseUrl}/topics`;
const UNAUTHORIZED_RESPONSE = { status: 401, statusText: 'Unauthorized' };
const SERVER_ERROR_RESPONSE = { status: 500, statusText: 'Internal Server Error' };
const REJECTED_REFRESH_ERROR = 'INVALID_OR_EXPIRED_CODE_ERROR' satisfies ApiErrorName;
const RATE_LIMITED_ERROR = 'TOO_MANY_REQUESTS_ERROR' satisfies ApiErrorName;

type RefreshFailure = (refresh: TestRequest) => void;

const TRANSIENT_REFRESH_FAILURES: [string, RefreshFailure][] = [
  ['the network is unreachable', (refresh) => refresh.error(new ProgressEvent('error'))],
  [
    'the refresh is rate limited',
    (refresh) =>
      refresh.flush(
        { error: RATE_LIMITED_ERROR },
        { status: 429, statusText: 'Too Many Requests' },
      ),
  ],
  ['the server fails', (refresh) => refresh.flush(null, SERVER_ERROR_RESPONSE)],
];

describe('tokenRefreshInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  let authStore: AuthStore;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([apiErrorInterceptor, authInterceptor, tokenRefreshInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    authStore.setSession(learner('Ada'), crypto.randomUUID());
  });

  afterEach(() => httpController.verify());

  const bearer = (accessToken: string) => `Bearer ${accessToken}`;

  const unauthorizedTopicsRequest = (): Promise<unknown> => {
    const topics = firstValueFrom(http.get(TOPICS_URL)).catch((error: unknown) => error);
    httpController.expectOne(TOPICS_URL).flush(null, UNAUTHORIZED_RESPONSE);
    return topics;
  };

  test('refreshes on a 401 and retries the request with the new access token', async () => {
    const refreshedSession = refreshResponseFor('Ada');
    const topics = firstValueFrom(http.get(TOPICS_URL));

    httpController.expectOne(TOPICS_URL).flush(null, UNAUTHORIZED_RESPONSE);
    httpController.expectOne(REFRESH_URL).flush(refreshedSession);
    const retried = await vi.waitFor(() => httpController.expectOne(TOPICS_URL));
    retried.flush([]);

    await topics;
    expect(retried.request.headers.get('Authorization')).toBe(bearer(refreshedSession.accessToken));
    expect(authStore.accessToken()).toBe(refreshedSession.accessToken);
  });

  test('retries with the current access token when it changed while the request was in flight', async () => {
    const topics = firstValueFrom(http.get(TOPICS_URL));
    const sentWithStaleToken = httpController.expectOne(TOPICS_URL);
    const tokenFromAnotherRefresh = crypto.randomUUID();
    authStore.setSession(learner('Ada'), tokenFromAnotherRefresh);

    sentWithStaleToken.flush(null, UNAUTHORIZED_RESPONSE);
    const retried = httpController.expectOne(TOPICS_URL);
    retried.flush([]);

    await topics;
    httpController.expectNone(REFRESH_URL);
    expect(retried.request.headers.get('Authorization')).toBe(bearer(tokenFromAnotherRefresh));
  });

  test('signs out when the server rejects the refresh', async () => {
    const topics = unauthorizedTopicsRequest();

    httpController
      .expectOne(REFRESH_URL)
      .flush({ error: REJECTED_REFRESH_ERROR }, { status: 400, statusText: 'Bad Request' });
    await topics;

    expect(authStore.accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/sign-in']);
  });

  test.each(TRANSIENT_REFRESH_FAILURES)('keeps the session when %s', async (_, failRefresh) => {
    const tokenBeforeRefresh = authStore.accessToken();
    const topics = unauthorizedTopicsRequest();

    failRefresh(httpController.expectOne(REFRESH_URL));
    await topics;

    expect(authStore.accessToken()).toBe(tokenBeforeRefresh);
    expect(navigate).not.toHaveBeenCalled();
  });

  test('keeps the refreshed session when the retried request fails', async () => {
    const refreshedSession = refreshResponseFor('Ada');
    const topics = unauthorizedTopicsRequest();

    httpController.expectOne(REFRESH_URL).flush(refreshedSession);
    const retried = await vi.waitFor(() => httpController.expectOne(TOPICS_URL));
    retried.flush(null, SERVER_ERROR_RESPONSE);
    await topics;

    expect(authStore.accessToken()).toBe(refreshedSession.accessToken);
    expect(navigate).not.toHaveBeenCalled();
  });
});
