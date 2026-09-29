import { Component, OnDestroy, effect, input, signal } from '@angular/core';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*#@';

@Component({
  selector: 'app-scramble',
  standalone: true,
  template: `<span [attr.aria-label]="text()"><span aria-hidden>{{ out() }}</span></span>`,
})
export class ScrambleComponent implements OnDestroy {
  readonly text = input.required<string>();
  readonly speed = input(34);

  readonly out = signal('');

  private raf = 0;
  private readonly reduceRef = { current: false };

  constructor() {
    effect(() => {
      const value = this.text();
      const stepMs = this.speed();
      cancelAnimationFrame(this.raf);

      if (this.prefersReducedMotion()) {
        this.out.set(value);
        return;
      }

      let frame = 0;
      let last = 0;
      const total = value.length * 2.6 + 8;

      const run = (now: number) => {
        if (now - last > stepMs) {
          last = now;
          frame += 1;
          const revealed = Math.floor(frame / 2.6);
          this.out.set(
            value
              .split('')
              .map((ch, i) => {
                if (ch === ' ') return ' ';
                if (i < revealed) return ch;
                return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              })
              .join(''),
          );
        }
        if (frame < total) this.raf = requestAnimationFrame(run);
        else this.out.set(value);
      };
      this.raf = requestAnimationFrame(run);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private prefersReducedMotion(): boolean {
    if (this.reduceRef.current) return true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.reduceRef.current = reduced;
    return reduced;
  }
}
