import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { messageOf } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { IdealMatchComponent } from './ideal-match.component';

const EMPTY_STATE_TEXT = 'Nothing fits this calibration yet';

function render(error: string | null) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(IdealMatchComponent);
  fixture.componentRef.setInput('recommendation', null);
  fixture.componentRef.setInput('error', error);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('IdealMatchComponent', () => {
  test('should show why recommendations failed instead of the empty state', () => {
    const offlineMessage = messageOf(offlineError());

    const element = render(offlineMessage);

    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(offlineMessage);
    expect(element.textContent).not.toContain(EMPTY_STATE_TEXT);
  });

  test('should show the empty state when nothing fits and nothing failed', () => {
    const element = render(null);

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).toContain(EMPTY_STATE_TEXT);
  });
});
