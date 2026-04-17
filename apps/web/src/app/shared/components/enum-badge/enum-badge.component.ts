import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
  ElementRef,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import type { EnumOption } from './enum-badge.types.js';

const openBadgeId = signal<string | null>(null);

@Component({
  selector: 'app-enum-badge',
  standalone: true,
  imports: [CommonModule, NgStyle],
  templateUrl: './enum-badge.component.html',
})
export class EnumBadgeComponent {
  @Input({ required: true }) value!: string;
  @Input({ required: true }) options!: EnumOption[];
  @Input() loading = false;
  @Input() readonly = false;
  @Output() changed = new EventEmitter<string>();

  @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;

  private readonly instanceId = Math.random().toString(36).slice(2);

  readonly isOpen = computed(() => openBadgeId() === this.instanceId);
  dropdownPos = signal<{ top: number; left: number } | null>(null);

  get currentOption(): EnumOption | undefined {
    return this.options?.find((o) => o.value === this.value);
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.readonly || this.loading) return;

    if (this.isOpen()) {
      openBadgeId.set(null);
    } else {
      const rect = this.triggerBtn.nativeElement.getBoundingClientRect();
      this.dropdownPos.set({ top: rect.bottom + 4, left: rect.left });
      openBadgeId.set(this.instanceId);
    }
  }

  select(event: MouseEvent, opt: EnumOption): void {
    event.stopPropagation();
    if (opt.value !== this.value) {
      this.changed.emit(opt.value);
    }
    openBadgeId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    openBadgeId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    openBadgeId.set(null);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    openBadgeId.set(null);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    openBadgeId.set(null);
  }
}
