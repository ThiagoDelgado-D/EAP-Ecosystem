import { Component, inject } from '@angular/core';
import { AuthStore } from '@features/auth/application/auth.store';
import { ModuleLabelPipe } from '@shared/pipes/module-label.pipe';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ModuleLabelPipe],
  template: `
    <div>
      <!-- Avatar + name row -->
      <div class="flex items-center gap-5 mb-6 pb-6 border-b border-line-soft">
        <div
          class="w-16 h-16 rounded-full bg-surface-overlay border-2 border-accent-line flex items-center justify-center text-2xl font-semibold text-accent-ink flex-shrink-0 select-none"
        >
          {{ authStore.userInitials() }}
        </div>
        <div>
          <p class="text-lg font-semibold text-ink-strong leading-tight">{{ authStore.displayName() }}</p>
          <p class="text-sm text-ink-dim mt-0.5">{{ authStore.currentUser()?.email }}</p>
        </div>
      </div>

      <!-- Profile fields -->
      <div class="flex flex-col gap-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-ink-dim mb-1.5">First name</label>
            <div class="px-3 py-2 rounded-lg bg-surface-overlay/60 border border-line-strong text-sm text-ink-strong">
              {{ authStore.currentUser()?.firstName || '—' }}
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-dim mb-1.5">Last name</label>
            <div class="px-3 py-2 rounded-lg bg-surface-overlay/60 border border-line-strong text-sm text-ink-strong">
              {{ authStore.currentUser()?.lastName || '—' }}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-dim mb-1.5">Email address</label>
          <div class="px-3 py-2 rounded-lg bg-surface-overlay/60 border border-line-strong text-sm text-ink-strong">
            {{ authStore.currentUser()?.email }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-dim mb-1.5">Modules</label>

          <div class="flex flex-col gap-3">
            <div>
              <p class="text-[10px] uppercase tracking-widest text-ink-faint mb-1.5">Always active</p>
              <div class="flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-overlay/60 border border-line-strong text-xs text-ink-dim"
                >
                  Resource Library
                </span>
              </div>
            </div>

            <div>
              <p class="text-[10px] uppercase tracking-widest text-ink-faint mb-1.5">Enabled</p>
              @if ((authStore.currentUser()?.featureConfig?.length ?? 0) > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (key of authStore.currentUser()?.featureConfig ?? []; track key) {
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-md bg-accent-wash/60 border border-accent-line/50 text-xs text-accent-ink"
                    >
                      {{ key | moduleLabel }}
                    </span>
                  }
                </div>
              } @else {
                <p class="text-sm text-ink-faint">No modules enabled.</p>
              }
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-dim mb-1.5">Account status</label>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent"></span>
            <span class="text-sm text-ink-body">Active</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccountComponent {
  readonly authStore = inject(AuthStore);
}
