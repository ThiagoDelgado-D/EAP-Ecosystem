import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkDrag, type CdkDragEnd } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { createPomodoroRingDisplay } from '@features/pomodoro/presentation/active/pomodoro-ring-display';
import {
  readMiniWidgetCollapsed,
  readMiniWidgetOffset,
  writeMiniWidgetCollapsed,
  writeMiniWidgetOffset,
  type MiniWidgetOffset,
} from '@features/pomodoro/application/pomodoro-view-preferences';
import { createTransientFlag } from '@shared/utils/transient-flag';
import { holdNearestCorner, type Size } from './widget-placement';

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-pomodoro-mini-widget',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDrag],
  templateUrl: './pomodoro-mini-widget.component.html',
})
export class PomodoroMiniWidgetComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly RING_RADIUS = RING_RADIUS;
  readonly RING_CIRCUMFERENCE = RING_CIRCUMFERENCE;

  readonly collapsed = signal(readMiniWidgetCollapsed());
  readonly offset = signal<MiniWidgetOffset>(readMiniWidgetOffset());

  private readonly dragRoot = viewChild.required<ElementRef<HTMLElement>>('dragRoot');
  private justDragged = false;
  private lastSize: Size | null = null;

  constructor() {
    inject(ElementRef<HTMLElement>).nativeElement.addEventListener(
      'click',
      (event: MouseEvent) => this.swallowClickEndingADrag(event),
      true,
    );
    afterNextRender(() => this.holdCornerWhenResized(this.dragRoot().nativeElement));
  }

  private readonly ringDisplay = createPomodoroRingDisplay(this.store, this.picker, RING_CIRCUMFERENCE);
  readonly ringDashOffset = this.ringDisplay.ringDashOffset;
  readonly breakRingDashOffset = this.ringDisplay.breakRingDashOffset;
  readonly currentTarget = this.ringDisplay.currentTarget;
  readonly contextDisplay = this.ringDisplay.contextDisplay;

  toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
    writeMiniWidgetCollapsed(this.collapsed());
  }

  onDragEnded(event: CdkDragEnd): void {
    this.justDragged = true;
    setTimeout(() => (this.justDragged = false));
    this.moveTo(event.source.getFreeDragPosition());
  }

  private swallowClickEndingADrag(event: MouseEvent): void {
    if (!this.justDragged) return;
    this.justDragged = false;
    event.stopPropagation();
    event.preventDefault();
  }

  private holdCornerWhenResized(element: HTMLElement): void {
    const observer = new ResizeObserver(() => this.onResized(element));
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // The overlay pane is anchored bottom-right, so collapsing, expanding or switching phase would otherwise
  // grow or shrink the widget away from the corner it was dragged to.
  private onResized(element: HTMLElement): void {
    const after = element.getBoundingClientRect();
    if (after.width === 0 || after.height === 0) return;
    const previous = this.lastSize ?? after;
    this.lastSize = { width: after.width, height: after.height };
    const before = {
      right: after.right,
      bottom: after.bottom,
      left: after.right - previous.width,
      top: after.bottom - previous.height,
    };
    const shift = holdNearestCorner(before, after, { width: window.innerWidth, height: window.innerHeight });
    if (shift.x === 0 && shift.y === 0) return;
    const current = this.offset();
    this.moveTo({ x: current.x + shift.x, y: current.y + shift.y });
  }

  private moveTo(offset: MiniWidgetOffset): void {
    this.offset.set(offset);
    writeMiniWidgetOffset(offset);
  }

  togglePause(): void {
    this.store.togglePause();
  }

  goFull(): void {
    void this.router.navigateByUrl('/pomodoro/active');
  }

  async openSwitchDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'app-dialog',
      autoFocus: '#switch-material-search',
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (target) await this.store.switchTarget(target);
  }

  endSession(): void {
    void this.router.navigateByUrl('/pomodoro/end');
  }

  readonly plannedTimeReached = this.store.plannedTimeReached;

  async keepGoing(): Promise<void> {
    await this.store.continueAtPlannedTime();
  }

  private readonly extendFlash = createTransientFlag();
  readonly justExtended = this.extendFlash.active;

  async extendBreak(): Promise<void> {
    this.extendFlash.trigger();
    await this.store.extendBreak();
  }

  async finishBreak(): Promise<void> {
    await this.store.endBreak();
    void this.router.navigateByUrl('/pomodoro');
  }
}
