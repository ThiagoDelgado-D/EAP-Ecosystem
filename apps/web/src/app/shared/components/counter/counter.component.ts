import { Component, OnDestroy, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<span class="tnum">{{ prefix() }}{{ display().toLocaleString('en-US') }}{{ suffix() }}</span>`,
})
export class CounterComponent implements OnDestroy {
  readonly value = input.required<number>();
  readonly prefix = input('');
  readonly suffix = input('');
  readonly duration = input(1100);

  readonly display = signal(0);

  private raf = 0;
  private from = 0;

  constructor() {
    effect(() => {
      const target = this.value();
      const ms = this.duration();
      cancelAnimationFrame(this.raf);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.display.set(target);
        this.from = target;
        return;
      }

      const startValue = this.from;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        this.display.set(Math.round(startValue + (target - startValue) * eased));
        if (t < 1) this.raf = requestAnimationFrame(tick);
        else this.from = target;
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }
}
