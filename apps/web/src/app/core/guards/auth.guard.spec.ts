import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { ApiError, NETWORK_ERROR, type ApiErrorName } from '@core/errors/api-error';
import { apiErrorInterceptor } from '@core/errors/api-error.interceptor';
import { messageFor } from '@core/errors/error-messages';
import { ToastService } from '@core/toast/toast.service';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  REFRESH_URL,
  refreshResponseFor,
} from '@features/auth/infrastructure/mocks/refresh-response.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { authGuard, MAX_REFRESH_RETRY_AFTER_MS, REFRESH_RETRY_DELAYS_MS } from './auth.guard';

const SIGN_IN_URL = '/auth/sign-in';
const REJECTED_REFRESH_ERROR = 'INVALID_OR_EXPIRED_CODE_ERROR' satisfies ApiErrorName;
const RATE_LIMITED_ERROR = 'TOO_MANY_REQUESTS_ERROR' satisfies ApiErrorName;
const RATE_LIMITED_RESPONSE = { status: 429, statusText: 'Too Many Requests' };
const [FIRST_RETRY_DELAY_MS, SECOND_RETRY_DELAY_MS] = REFRESH_RETRY_DELAYS_MS;

describe('authGuard', () => {
  let httpController: HttpTestingController;
  let authStore: AuthStore;
  let toast: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpController.verify();
    vi.useRealTimers();
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as Promise<
      boolean | UrlTree
    >;

  const nextRefresh = (): Promise<TestRequest> =>
    vi.waitFor(() => httpController.expectOne(REFRESH_URL));

  const failWithNetworkError = async () => (await nextRefresh()).error(new ProgressEvent('error'));

  const urlOf = (result: boolean | UrlTree) =>
    result instanceof UrlTree ? result.toString() : null;

  test('lets a learner with an access token through without refreshing', async () => {
    authStore.setSession(learner('Ada'), crypto.randomUUID());

    expect(await runGuard()).toBe(true);
    httpController.expectNone(REFRESH_URL);
  });

  test('restores the session from the refresh cookie', async () => {
    const refreshedSession = refreshResponseFor('Ada');
    const guard = runGuard();

    (await nextRefresh()).flush(refreshedSession);

    expect(await guard).toBe(true);
    expect(authStore.accessToken()).toBe(refreshedSession.accessToken);
  });

  test('sends the learner to sign in without retrying when the refresh is rejected', async () => {
    const guard = runGuard();

    (await nextRefresh()).flush(
      { error: REJECTED_REFRESH_ERROR },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(urlOf(await guard)).toBe(SIGN_IN_URL);
    httpController.expectNone(REFRESH_URL);
    expect(toast.toasts()).toEqual([]);
  });

  test('retries a refresh that failed for a transient reason', async () => {
    const refreshedSession = refreshResponseFor('Ada');
    const guard = runGuard();

    await failWithNetworkError();
    await vi.advanceTimersByTimeAsync(FIRST_RETRY_DELAY_MS);
    await failWithNetworkError();
    await vi.advanceTimersByTimeAsync(SECOND_RETRY_DELAY_MS);
    (await nextRefresh()).flush(refreshedSession);

    expect(await guard).toBe(true);
    expect(authStore.accessToken()).toBe(refreshedSession.accessToken);
  });

  test('sends the learner to sign in with the error once the retries run out', async () => {
    const guard = runGuard();

    await failWithNetworkError();
    await vi.advanceTimersByTimeAsync(FIRST_RETRY_DELAY_MS);
    await failWithNetworkError();
    await vi.advanceTimersByTimeAsync(SECOND_RETRY_DELAY_MS);
    await failWithNetworkError();

    expect(urlOf(await guard)).toBe(SIGN_IN_URL);
    expect(toast.toasts().map((t) => t.message)).toEqual([
      messageFor(new ApiError(NETWORK_ERROR, 0, undefined)),
    ]);
  });

  test('waits the time a rate-limited refresh asks for, up to a cap', async () => {
    const retryAfterSeconds = MAX_REFRESH_RETRY_AFTER_MS / 1000 + 60;
    const guard = runGuard();

    (await nextRefresh()).flush(
      { error: RATE_LIMITED_ERROR, retryAfterSeconds },
      RATE_LIMITED_RESPONSE,
    );
    await vi.advanceTimersByTimeAsync(MAX_REFRESH_RETRY_AFTER_MS - 1);
    httpController.expectNone(REFRESH_URL);
    await vi.advanceTimersByTimeAsync(1);
    (await nextRefresh()).flush(refreshResponseFor('Ada'));

    expect(await guard).toBe(true);
  });
});
