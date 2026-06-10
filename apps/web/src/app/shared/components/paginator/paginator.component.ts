import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="border-t border-slate-800 pt-4 mt-2">
      <div class="flex items-center justify-between text-sm text-slate-400">
        <button
          class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          (click)="prev()"
          [disabled]="currentPage() <= 1"
          aria-label="Previous page"
        >
          Previous
        </button>

        <div class="flex items-center gap-3">
          <span class="text-slate-400">Page {{ currentPage() }} of {{ totalPages() }}</span>
          <select
            class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:border-slate-600 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
            [ngModel]="pageSize()"
            (ngModelChange)="pageSizeChange.emit($event)"
            aria-label="Items per page"
          >
            @for (size of pageSizeOptions; track size) {
              <option [value]="size">{{ size }} per page</option>
            }
          </select>
        </div>

        <button
          class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          (click)="next()"
          [disabled]="currentPage() >= totalPages()"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  `,
})
export class PaginatorComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly pageSizeOptions = [5, 10, 20, 50];

  prev(): void {
    this.pageChange.emit(this.currentPage() - 1);
  }

  next(): void {
    this.pageChange.emit(this.currentPage() + 1);
  }
}
