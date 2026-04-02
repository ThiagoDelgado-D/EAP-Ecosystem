import { Component } from '@angular/core';

// Hardcoded — Focus Pulse depends on the User Module (v0.5.0).
// Replace with real signals once UserService is available.
@Component({
  selector: 'app-focus-pulse',
  standalone: true,
  templateUrl: './focus-pulse.component.html',
})
export class FocusPulseComponent {
  readonly weeklyBars = [55, 70, 45, 90, 80, 65, 95];
  readonly todayIndex = this.weeklyBars.length - 1;

  readonly weeklyEfficiency = 84;
  readonly amPeak = '9:30 AM';
  readonly pmDip = '3:15 PM';
  readonly current = 'Stabilized';

  readonly flowFill = 62;
}
