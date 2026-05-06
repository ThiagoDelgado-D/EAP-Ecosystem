import { Component } from '@angular/core';

@Component({
  selector: 'app-danger-zone',
  standalone: true,
  template: `
    <div class="p-6 max-w-2xl">
      <div class="mb-6">
        <h1 class="text-lg font-semibold text-slate-100">Danger Zone</h1>
        <p class="text-sm text-slate-400 mt-1">Irreversible actions for your account.</p>
      </div>
      <div class="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
        <p class="text-sm text-slate-500">Coming soon</p>
      </div>
    </div>
  `,
})
export class DangerZoneComponent {}
