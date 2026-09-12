import { Injectable, inject, type ComponentRef, type Type } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

export type PomodoroOverlayPlacement = 'floating-bottom-right' | 'fullscreen';

@Injectable({ providedIn: 'root' })
export class PomodoroOverlayHostService {
  private readonly overlay = inject(Overlay);
  private readonly refs = new Map<string, OverlayRef>();

  show<T>(key: string, component: Type<T>, placement: PomodoroOverlayPlacement): ComponentRef<T> {
    this.hide(key);

    const position =
      placement === 'fullscreen'
        ? this.overlay.position().global().top('0').left('0')
        : this.overlay.position().global().bottom('16px').right('16px');

    const overlayRef = this.overlay.create({
      positionStrategy: position,
      hasBackdrop: false,
      width: placement === 'fullscreen' ? '100vw' : undefined,
      height: placement === 'fullscreen' ? '100vh' : undefined,
    });

    const componentRef = overlayRef.attach(new ComponentPortal(component));
    this.refs.set(key, overlayRef);
    return componentRef;
  }

  hide(key: string): void {
    this.refs.get(key)?.dispose();
    this.refs.delete(key);
  }

  isShown(key: string): boolean {
    return this.refs.has(key);
  }
}
