import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  readonly delay = input(0, { alias: 'appRevealDelay' });

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const native = this.el.nativeElement;
    native.classList.add('reveal');
    native.style.setProperty('--d', `${this.delay()}ms`);

    if (this.prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      native.dataset['in'] = 'true';
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            native.dataset['in'] = 'true';
            this.observer?.unobserve(native);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(native);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
