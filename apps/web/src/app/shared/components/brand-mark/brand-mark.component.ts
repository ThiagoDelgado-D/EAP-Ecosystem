import { Component, computed, input } from '@angular/core';

type BrandMarkSize = 'compact' | 'hero';

const SIZE_CLASSES: Record<
  BrandMarkSize,
  Record<'layout' | 'symbol' | 'text' | 'name' | 'tagline', string>
> = {
  compact: {
    layout: 'items-center gap-2.5',
    symbol: 'w-7 h-7',
    text: '',
    name: 'text-sm',
    tagline: 'text-[10px] text-ink-dim',
  },
  hero: {
    layout: 'flex-col items-center gap-3',
    symbol: 'w-14 h-14',
    text: 'items-center',
    name: 'text-lg',
    tagline: 'text-xs text-accent-ink font-medium',
  },
};

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  templateUrl: './brand-mark.component.html',
})
export class BrandMarkComponent {
  readonly size = input<BrandMarkSize>('compact');

  protected readonly classes = computed(() => SIZE_CLASSES[this.size()]);
}
