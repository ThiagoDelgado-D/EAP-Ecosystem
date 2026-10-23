import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthHttpService } from './auth-http.service';
import { REFRESH_URL, refreshResponseFor } from './mocks/refresh-response.fixture';

describe('AuthHttpService.refresh', () => {
  let authHttp: AuthHttpService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authHttp = TestBed.inject(AuthHttpService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('sends one request for refreshes started while one is in flight', async () => {
    const refreshedSession = refreshResponseFor('Ada');

    const fromGuard = authHttp.refresh();
    const fromInterceptor = authHttp.refresh();
    httpController.expectOne(REFRESH_URL).flush(refreshedSession);

    const [guardResult, interceptorResult] = await Promise.all([fromGuard, fromInterceptor]);
    expect(guardResult.accessToken).toBe(refreshedSession.accessToken);
    expect(interceptorResult.accessToken).toBe(refreshedSession.accessToken);
  });

  test('sends a new request once the previous refresh has settled', async () => {
    const firstSession = refreshResponseFor('Ada');
    const nextSession = refreshResponseFor('Ada');

    const firstRefresh = authHttp.refresh();
    httpController.expectOne(REFRESH_URL).flush(firstSession);
    await firstRefresh;

    const nextRefresh = authHttp.refresh();
    httpController.expectOne(REFRESH_URL).flush(nextSession);

    expect((await nextRefresh).accessToken).toBe(nextSession.accessToken);
  });

  test('sends a new request after a failed refresh', async () => {
    const failedRefresh = authHttp.refresh().catch((error: unknown) => error);
    httpController.expectOne(REFRESH_URL).error(new ProgressEvent('error'));
    await failedRefresh;

    const retriedRefresh = authHttp.refresh();
    const retriedSession = refreshResponseFor('Ada');
    httpController.expectOne(REFRESH_URL).flush(retriedSession);

    expect((await retriedRefresh).accessToken).toBe(retriedSession.accessToken);
  });
});
