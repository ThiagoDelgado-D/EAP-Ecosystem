import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-url-import',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div class="max-w-md w-full text-center">
        <div
          class="w-16 h-16 rounded-2xl bg-emerald-950/70 flex items-center
                    justify-center mx-auto mb-6"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="text-emerald-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
                     15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-100 mb-2">URL Scrape</h1>
        <p class="text-sm text-slate-500 mb-8 leading-relaxed">
          Convert any web source into structured data instantly. Coming in a future release.
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
export class UrlImportComponent {
  private readonly router = inject(Router);
  goBack(): void {
    this.router.navigate(['/add']);
  }
}
