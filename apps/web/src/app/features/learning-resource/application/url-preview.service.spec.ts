import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '@core/config/api.config';
import { apiErrorInterceptor } from '@core/errors/api-error.interceptor';
import { messageOf } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { UrlPreviewService } from './url-preview.service';

const PREVIEW_URL = `${API_CONFIG.baseUrl}/learning-resources/preview`;
const ARTICLE_URL = 'https://dataintensive.net/chapter-5';

describe('UrlPreviewService', () => {
  let service: UrlPreviewService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UrlPreviewService,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UrlPreviewService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('preview should store why reading the URL failed', async () => {
    const previewing = service.preview(ARTICLE_URL);

    httpController.expectOne(PREVIEW_URL).error(new ProgressEvent('error'));
    const result = await previewing;

    expect(result).toBeNull();
    expect(service.error()).toBe(messageOf(offlineError()));
    expect(service.loading()).toBe(false);
  });
});
