import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IntakeHttpService } from './intake-http.service';
import { INTAKE_PREVIEW_URL, examPrepAnswers, examPrepSetup } from './mocks/intake.fixture';

describe('IntakeHttpService.previewSetup', () => {
  let intakeHttp: IntakeHttpService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    intakeHttp = TestBed.inject(IntakeHttpService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('sends the answers and returns the setup composed from them', async () => {
    const preview = intakeHttp.previewSetup(examPrepAnswers);
    const request = httpController.expectOne(INTAKE_PREVIEW_URL);
    request.flush(examPrepSetup);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(examPrepAnswers);
    expect(await preview).toEqual(examPrepSetup);
  });
});
