import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-center gap-1.5 pt-4" aria-label="Pagination">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          [disabled]="currentPage() <= 1"
          (click)="prev()"
        >
          Previous
        </button>
        @for (entry of pageEntries(); track $index) {
          @if (entry === null) {
            <span class="text-ink-faint">&hellip;</span>
          } @else {
            <button
              type="button"
              (click)="goTo(entry)"
              [attr.aria-current]="entry === currentPage() ? 'page' : undefined"
              [class]="
                entry === currentPage()
                  ? 'tnum grid h-8 w-8 place-items-center rounded-full text-[0.8rem] font-semibold bg-ink-strong text-surface-base transition-all'
                  : 'tnum grid h-8 w-8 place-items-center rounded-full text-[0.8rem] font-semibold text-ink-dim hover:bg-surface-overlay hover:text-ink-strong transition-all'
              "
            >
              {{ entry }}
            </button>
          }
        }
        <button
          type="button"
          class="btn btn-outline btn-sm"
          [disabled]="currentPage() >= totalPages()"
          (click)="next()"
        >
          Next
        </button>
      </nav>
    }
  `,
})
export class PaginatorComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  prev(): void {
    this.pageChange.emit(this.currentPage() - 1);
  }

  next(): void {
    this.pageChange.emit(this.currentPage() + 1);
  }

  goTo(page: number): void {
    this.pageChange.emit(page);
  }

  pageEntries(): (number | null)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages = new Set<number>([1, total]);
    for (let p = current - 1; p <= current + 1; p += 1) {
      if (p >= 1 && p <= total) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const entries: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && sorted[i - 1] !== p - 1) entries.push(null);
      entries.push(p);
    });
    return entries;
  }
}
