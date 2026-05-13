import { Component, Input } from '@angular/core';

type BadgeType = 'energy' | 'difficulty' | 'status' | 'focus';

const BADGE_CONFIG: Record<BadgeType, { prefix: string; map: Record<string, string> }> = {
  energy: {
    prefix: '▬',
    map: {
      LOW: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
      MEDIUM: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
      HIGH: 'bg-red-950/60 border-red-800/50 text-red-400',
    },
  },
  difficulty: {
    prefix: '●',
    map: {
      LOW: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
      MEDIUM: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
      HIGH: 'bg-red-950/60 border-red-800/50 text-red-400',
    },
  },
  status: {
    prefix: '',
    map: {
      PENDING: 'bg-slate-800/60 border-slate-700 text-slate-400',
      'IN PROGRESS': 'bg-blue-950/60 border-blue-800/50 text-blue-400',
      COMPLETED: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
    },
  },
  focus: {
    prefix: '',
    map: {
      'DEEP FOCUS': 'bg-violet-950/60 border-violet-800/50 text-violet-400',
      'LIGHT READ': 'bg-sky-950/60 border-sky-800/50 text-sky-400',
      CREATIVE: 'bg-pink-950/60 border-pink-800/50 text-pink-400',
      'QUICK OP': 'bg-amber-950/60 border-amber-800/50 text-amber-400',
      REVIEW: 'bg-slate-800/60 border-slate-700 text-slate-400',
    },
  },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    @if (value) {
      <span
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide"
        [class]="colorClasses"
      >
        @if (prefix) {
          <span class="text-[8px]">{{ prefix }}</span>
        }
        {{ displayValue }}
      </span>
    }
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) type!: BadgeType;
  @Input() value: string | null | undefined = undefined;

  private normalizeKey(raw: string): string {
    return raw
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toUpperCase();
  }

  get displayValue(): string {
    if (!this.value) return '';
    return this.value
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  get prefix(): string {
    return BADGE_CONFIG[this.type]?.prefix ?? '';
  }

  get colorClasses(): string {
    if (!this.value) return '';
    const map = BADGE_CONFIG[this.type]?.map;
    return map?.[this.normalizeKey(this.value)] ?? 'bg-slate-800/60 border-slate-700 text-slate-400';
  }
}
