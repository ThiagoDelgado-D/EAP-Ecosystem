import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PomodoroRingComponent, POMODORO_RING_CIRCUMFERENCE } from './pomodoro-ring.component';

@Component({
  standalone: true,
  imports: [PomodoroRingComponent],
  template: `<app-pomodoro-ring><span>25:00</span></app-pomodoro-ring>`,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(PomodoroRingComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('PomodoroRingComponent', () => {
  test('should default to a full, static accent ring', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();

    const circles = fixture.nativeElement.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    expect(circles[1].getAttribute('stroke')).toBe('var(--color-accent)');
    expect(circles[1].getAttribute('stroke-dashoffset')).toBe('0');
    expect(component.RING_CIRCUMFERENCE).toBe(POMODORO_RING_CIRCUMFERENCE);
  });

  test('should reflect a custom stroke color, dash offset and animated transition', () => {
    const { fixture, component } = setup();
    component.strokeColor = 'var(--color-status-done)';
    component.dashOffset = 400;
    component.animated = true;
    fixture.detectChanges();

    const progressCircle = fixture.nativeElement.querySelectorAll('circle')[1] as SVGCircleElement;
    expect(progressCircle.getAttribute('stroke')).toBe('var(--color-status-done)');
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe('400');
    expect(progressCircle.style.transition).toBe('stroke-dashoffset 1s linear');
  });

  test('should project center content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('25:00');
  });
});
