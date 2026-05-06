import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="p-6 max-w-2xl">
      <div class="mb-6">
        <h1 class="text-lg font-semibold text-slate-100">Notifications</h1>
        <p class="text-sm text-slate-400 mt-1">Control what notifications you receive.</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p class="text-sm text-slate-500">Coming soon</p>
      </div>
    </div>
  `,
})
export class NotificationsComponent {}
