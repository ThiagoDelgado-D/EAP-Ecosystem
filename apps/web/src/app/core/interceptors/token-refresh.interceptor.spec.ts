import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
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

describe('tokenRefreshInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  let authStore: AuthStore;

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
    authStore.setSession(learner('Ada'), crypto.randomUUID());
  });

  afterEach(() => httpController.verify());

  const bearer = (accessToken: string) => `Bearer ${accessToken}`;

  test('refreshes on a 401 and retries the request with the new access token', async () => {
    const refreshedSession = refreshResponseFor('Ada');
    const topics = firstValueFrom(http.get(TOPICS_URL));

    httpController.expectOne(TOPICS_URL).flush(null, UNAUTHORIZED_RESPONSE);
    httpController.expectOne(REFRESH_URL).flush(refreshedSession);
    const retried = await vi.waitFor(() => httpController.expectOne(TOPICS_URL));
    retried.flush([]);

    await topics;
    expect(retried.request.headers.get('Authorization')).toBe(
      bearer(refreshedSession.accessToken),
    );
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
});
