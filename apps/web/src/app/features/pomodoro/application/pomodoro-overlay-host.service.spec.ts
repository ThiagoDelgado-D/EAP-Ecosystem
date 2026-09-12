import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { PomodoroOverlayHostService } from './pomodoro-overlay-host.service';

@Component({
  selector: 'app-test-overlay-content',
  standalone: true,
  template: '<div class="test-overlay-marker">overlay content</div>',
})
class TestOverlayContentComponent {}

describe('PomodoroOverlayHostService', () => {
  let service: PomodoroOverlayHostService;
  let overlayContainer: OverlayContainer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PomodoroOverlayHostService);
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  test('should attach the component to the overlay container when shown', () => {
    service.show('widget', TestOverlayContentComponent, 'floating-bottom-right');

    expect(overlayContainer.getContainerElement().querySelector('.test-overlay-marker')).toBeTruthy();
    expect(service.isShown('widget')).toBe(true);
  });

  test('should detach and stop tracking the overlay when hidden', () => {
    service.show('widget', TestOverlayContentComponent, 'floating-bottom-right');

    service.hide('widget');

    expect(overlayContainer.getContainerElement().querySelector('.test-overlay-marker')).toBeFalsy();
    expect(service.isShown('widget')).toBe(false);
  });

  test('should replace a previously shown overlay under the same key instead of stacking', () => {
    service.show('zen', TestOverlayContentComponent, 'fullscreen');
    service.show('zen', TestOverlayContentComponent, 'fullscreen');

    expect(overlayContainer.getContainerElement().querySelectorAll('.test-overlay-marker')).toHaveLength(1);
  });

  test('hide should be a no-op when nothing is shown under that key', () => {
    expect(() => service.hide('never-shown')).not.toThrow();
    expect(service.isShown('never-shown')).toBe(false);
  });
});
