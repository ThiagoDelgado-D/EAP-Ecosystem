import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-file-import',
  standalone: true,
  template: `
    <div
      class="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-md w-full text-center">
        <div
          class="w-16 h-16 rounded-2xl bg-accent-soft dark:bg-accent/10 flex items-center justify-center text-3xl mx-auto mb-6"
        >
          📤
        </div>
        <h1 class="text-2xl font-bold text-ink dark:text-slate-100 mb-2">Import File</h1>
        <p class="text-sm text-ink-muted dark:text-slate-400 mb-8">
          Upload a CSV or JSON file to import multiple resources at once. Coming in a future
          release.
        </p>
        <button
          (click)="goBack()"
          class="px-5 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          ← Back to methods
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
