import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-file-import',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div class="max-w-md w-full text-center">
        <div
          class="w-16 h-16 rounded-2xl bg-sky-950/70 flex items-center
                    justify-center mx-auto mb-6"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="text-sky-400"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-100 mb-2">Import Externals</h1>
        <p class="text-sm text-slate-500 mb-8 leading-relaxed">
          Batch upload JSON, PDF, or Markdown directly to the repository. Coming in a future
          release.
        </p>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-2 border border-slate-700 text-slate-300
                 hover:border-slate-500 hover:text-slate-100 text-sm font-medium
                 px-5 py-2.5 rounded-full transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to methods
        </button>
      </div>
    </div>
  `,
})
export class FileImportComponent {
  private readonly router = inject(Router);
  goBack(): void {
    this.router.navigate(['/add']);
  }
}
