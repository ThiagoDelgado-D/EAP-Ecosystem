import { Component, Input } from '@angular/core';

export const POMODORO_RING_RADIUS = 190;
export const POMODORO_RING_CIRCUMFERENCE = 2 * Math.PI * POMODORO_RING_RADIUS;

@Component({
  selector: 'app-pomodoro-ring',
  standalone: true,
  templateUrl: './pomodoro-ring.component.html',
})
export class PomodoroRingComponent {
  readonly RING_RADIUS = POMODORO_RING_RADIUS;
  readonly RING_CIRCUMFERENCE = POMODORO_RING_CIRCUMFERENCE;

  @Input() strokeColor = 'var(--color-accent)';
  @Input() dashOffset = 0;
  @Input() animated = false;
  @Input() glow: string | null = null;
}
