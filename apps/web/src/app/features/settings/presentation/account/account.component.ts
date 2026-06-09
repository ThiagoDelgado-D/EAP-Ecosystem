import { Component, inject } from '@angular/core';
import { AuthStore } from '@features/auth/application/auth.store';
import { ModuleLabelPipe } from '@shared/pipes/module-label.pipe';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ModuleLabelPipe],
  template: `
    <div class="max-w-[680px] mx-auto px-14 py-10">
      <div class="mb-8">
        <h1 class="text-xl font-semibold text-slate-100">My account</h1>
        <p class="text-sm text-slate-400 mt-1">Manage your profile and personal information.</p>
      </div>

      <!-- Avatar + name row -->
      <div class="flex items-center gap-5 mb-8 pb-8 border-b border-slate-800">
        <div
          class="w-16 h-16 rounded-full bg-slate-800 border-2 border-violet-700 flex items-center justify-center text-2xl font-semibold text-violet-400 flex-shrink-0 select-none"
        >
          {{ authStore.userInitials() }}
        </div>
        <div>
          <p class="text-lg font-semibold text-slate-100 leading-tight">{{ authStore.displayName() }}</p>
          <p class="text-sm text-slate-400 mt-0.5">{{ authStore.currentUser()?.email }}</p>
        </div>
      </div>

      <!-- Profile fields -->
      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">First name</label>
            <div class="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-slate-200">
              {{ authStore.currentUser()?.firstName || '—' }}
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Last name</label>
            <div class="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-slate-200">
              {{ authStore.currentUser()?.lastName || '—' }}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
          <div class="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-slate-200">
            {{ authStore.currentUser()?.email }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Modules</label>

          <div class="flex flex-col gap-3">
            <div>
              <p class="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Always active</p>
              <div class="flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-xs text-slate-400"
                >
                  Resource Library
                </span>
              </div>
            </div>

            <div>
              <p class="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Enabled</p>
              @if ((authStore.currentUser()?.featureConfig?.length ?? 0) > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (key of authStore.currentUser()?.featureConfig ?? []; track key) {
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-950/60 border border-violet-800/50 text-xs text-violet-300"
                    >
                      {{ key | moduleLabel }}
                    </span>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-500">No modules enabled.</p>
              }
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Account status</label>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-sm text-slate-300">Active</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccountComponent {
  readonly authStore = inject(AuthStore);
}
