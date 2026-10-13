import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';
import { ApiError, type ApiErrorName } from '@core/errors/api-error';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { SignInComponent } from './sign-in.component';

const LEARNER_EMAIL = 'ada@cauce.study';
const MISTYPED_CODE = '000000';
const RETRY_AFTER_SECONDS = 42;
const RATE_LIMITED_STATUS = 429;
const BAD_REQUEST_STATUS = 400;
const INVALID_CODE_ERROR = 'INVALID_OR_EXPIRED_CODE_ERROR' satisfies ApiErrorName;

describe('SignInComponent', () => {
  const authService = {
    requestSignIn: vi.fn(),
    verifySignIn: vi.fn(),
  };
  let component: SignInComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthHttpService, useValue: authService }],
    });
    component = TestBed.createComponent(SignInComponent).componentInstance;
  });

  test('tells a rate-limited learner how long to wait before asking for another code', async () => {
    authService.requestSignIn.mockRejectedValue(
      new ApiError('TOO_MANY_REQUESTS_ERROR', RATE_LIMITED_STATUS, {
        retryAfterSeconds: RETRY_AFTER_SECONDS,
      }),
    );

    await component.onEmailSubmit(LEARNER_EMAIL);

    expect(component.error()).toContain(`${RETRY_AFTER_SECONDS} seconds`);
    expect(component.step()).toBe('email');
  });

  test('explains that a mistyped or expired code needs a new one', async () => {
    authService.requestSignIn.mockResolvedValue(undefined);
    authService.verifySignIn.mockRejectedValue(
      new ApiError(INVALID_CODE_ERROR, BAD_REQUEST_STATUS, undefined),
    );
    await component.onEmailSubmit(LEARNER_EMAIL);

    await component.onCodeSubmit(MISTYPED_CODE);

    expect(component.error()).toBe(ERROR_MESSAGES[INVALID_CODE_ERROR]);
    expect(component.step()).toBe('code');
  });
});
