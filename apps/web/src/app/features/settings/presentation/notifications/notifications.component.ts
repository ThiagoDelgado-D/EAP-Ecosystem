import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div>
      <div class="rounded-xl border border-line-soft bg-surface-raised p-8 text-center">
        <p class="text-sm text-ink-faint">Coming soon</p>
      </div>
    </div>
  `,
})
export class NotificationsComponent {}
