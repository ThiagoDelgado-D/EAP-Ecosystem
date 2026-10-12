import { TestBed } from '@angular/core/testing';
import { ToastService } from '@core/toast/toast.service';
import { ApiError, type ApiErrorName } from './api-error';
import { ERROR_MESSAGES } from './error-messages';
import { ErrorNotifier } from './error-notifier.service';

const CONFLICT_STATUS = 409;
const DUPLICATE_TOPIC_ERROR = 'DUPLICATE_TOPIC_NAME_ERROR' satisfies ApiErrorName;
const ERROR_TOAST = 'error';

describe('ErrorNotifier', () => {
  let notifier: ErrorNotifier;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    notifier = TestBed.inject(ErrorNotifier);
    toast = TestBed.inject(ToastService);
    vi.spyOn(toast, 'show');
  });

  test('shows an API error’s message as an error toast', () => {
    notifier.notify(new ApiError(DUPLICATE_TOPIC_ERROR, CONFLICT_STATUS, undefined));

    expect(toast.show).toHaveBeenCalledWith(ERROR_MESSAGES[DUPLICATE_TOPIC_ERROR], ERROR_TOAST);
  });

  test('shows the unexpected-error message for anything that is not an API error', () => {
    notifier.notify(new TypeError());

    expect(toast.show).toHaveBeenCalledWith(ERROR_MESSAGES.UNEXPECTED_ERROR, ERROR_TOAST);
  });
});
