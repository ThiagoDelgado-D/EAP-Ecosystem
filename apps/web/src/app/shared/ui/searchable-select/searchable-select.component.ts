import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [FormsModule],
  host: { style: 'display: block; position: relative;' },
  template: `
    <button
      type="button"
      class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-overlay border text-sm text-left transition-colors focus:outline-none focus-visible:border-accent"
      [class.border-accent]="open()"
      [class.border-line-strong]="!open()"
      (click)="toggle()"
    >
      <span
        class="truncate"
        [class.text-ink-strong]="!!selectedLabel"
        [class.text-ink-faint]="!selectedLabel"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="w-4 h-4 text-ink-faint flex-shrink-0 ml-2 transition-transform duration-150"
        [class.rotate-180]="open()"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown -->
    @if (open()) {
      <div
        class="absolute z-50 w-full mt-1 rounded-lg border border-line-soft bg-surface-raised shadow-[var(--shadow-lift)] overflow-hidden"
      >
        <!-- Search input -->
        <div class="p-2 border-b border-line-soft">
          <input
            #searchInput
            type="text"
            class="input py-1.5 text-sm"
            placeholder="Search…"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
          />
        </div>

        <!-- Options -->
        <ul class="max-h-52 overflow-y-auto py-1">
          @for (opt of filtered(); track opt.value) {
            <li>
              <button
                type="button"
                class="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-overlay"
                [class.text-accent-ink]="opt.value === value"
                [class.bg-accent-wash]="opt.value === value"
                [class.text-ink-body]="opt.value !== value"
                (click)="select(opt.value)"
              >
                {{ opt.label }}
              </button>
            </li>
          } @empty {
            <li class="px-3 py-2 text-sm text-ink-faint">No results</li>
          }
        </ul>
      </div>
    }
  `,
})
export class SearchableSelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Select…';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('searchInput') private readonly searchInputRef?: ElementRef<HTMLInputElement>;

  readonly open = signal(false);
  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return q ? this.options.filter((o) => o.label.toLowerCase().includes(q)) : this.options;
  });

  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label ?? '';
  }

  constructor(private readonly el: ElementRef) {}

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.query.set('');
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    }
  }

  select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
    this.query.set('');
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (!this.el.nativeElement.contains(target)) {
      this.open.set(false);
      this.query.set('');
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.open.set(false);
    this.query.set('');
  }
}
