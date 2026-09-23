import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import {
  POMODORO_VIEW_MODE,
  readDefaultDurationMin,
  readDefaultViewMode,
  readHideShortcutHints,
} from '@features/pomodoro/application/pomodoro-view-preferences';
import {
  PomodoroZenViewComponent,
  POMODORO_ZEN_KEY,
} from '@features/pomodoro/presentation/zen-view/pomodoro-zen-view.component';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { PomodoroRingComponent } from '@features/pomodoro/presentation/pomodoro-ring/pomodoro-ring.component';
import {
  DURATION_PRESETS,
  MAX_PLANNED_DURATION_MIN,
  SEGMENT_TARGET_KIND,
  type SegmentTarget,
} from '@features/pomodoro/domain/pomodoro.model';
import { describeTargetLabel, type TargetLabel } from './target-description';

function formatMinutesClock(minutes: number): string {
  return `${String(minutes).padStart(2, '0')}:00`;
}

@Component({
  selector: 'app-pomodoro-start',
  standalone: true,
  imports: [FormsModule, PomodoroRingComponent],
  templateUrl: './start.component.html',
})
export class StartComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly overlayHost = inject(PomodoroOverlayHostService);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly DURATION_PRESETS = DURATION_PRESETS;
  readonly MAX_PLANNED_DURATION_MIN = MAX_PLANNED_DURATION_MIN;
  readonly maxDurationDigits = String(MAX_PLANNED_DURATION_MIN).length;

  readonly selectedDuration = signal<number>(readDefaultDurationMin());
  readonly customDurationInput = signal('');
  readonly intent = signal('');
  readonly showIntentInput = signal(false);

  readonly selectedTarget = signal<SegmentTarget | null>(null);
  readonly selectedTargetLabel = signal<TargetLabel | null>(null);
  readonly moreMenuOpen = signal(false);
  readonly hideShortcutHints = signal(readHideShortcutHints());

  readonly durationClock = computed(() => formatMinutesClock(this.selectedDuration()));
  readonly isCustomDurationActive = computed(() => !DURATION_PRESETS.includes(this.selectedDuration()));
  readonly effectiveTarget = computed<SegmentTarget>(() => this.selectedTarget() ?? { kind: SEGMENT_TARGET_KIND.FREE });
  readonly hasAttachedMaterial = computed(() => this.selectedTarget() !== null);
  readonly canStart = computed(() => this.selectedDuration() > 0);
  readonly canOfferIntention = computed(() => !this.showIntentInput() && !this.intent());
  readonly hasMoreActions = computed(() => !this.hasAttachedMaterial() || this.canOfferIntention());

  constructor() {
    void this.picker.load();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (!this.canStart() || this.store.starting()) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON' || target?.tagName === 'A' || target?.tagName === 'INPUT') return;

    event.preventDefault();
    void this.start();
  }

  @HostListener('document:click')
  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  toggleMoreMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.moreMenuOpen.update((v) => !v);
  }

  pickDuration(minutes: number): void {
    this.selectedDuration.set(minutes);
    this.customDurationInput.set('');
  }

  onCustomDurationInput(value: string): void {
    this.customDurationInput.set(value.replace(/\D/g, ''));
    this.applyCustomDuration();
  }

  applyCustomDuration(): void {
    const raw = this.customDurationInput().trim();
    if (raw === '') return;
    const minutes = Number(raw);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    this.selectedDuration.set(Math.min(MAX_PLANNED_DURATION_MIN, Math.round(minutes)));
  }

  toggleIntentInput(): void {
    this.showIntentInput.set(true);
  }

  chooseAddIntention(): void {
    this.moreMenuOpen.set(false);
    this.toggleIntentInput();
  }

  async chooseAttachMaterial(): Promise<void> {
    this.moreMenuOpen.set(false);
    await this.openAttachDialog();
  }

  async openAttachDialog(): Promise<void> {
    const previous = this.selectedTarget();
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: '#switch-material-search',
      data: previous ? { target: previous, label: this.selectedTargetLabel() } : null,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (!target) return;
    this.selectedTarget.set(target);
    this.selectedTargetLabel.set(describeTargetLabel(target, this.picker.allPaths(), this.picker.library()));
  }

  clearAttachedMaterial(): void {
    this.selectedTarget.set(null);
    this.selectedTargetLabel.set(null);
  }

  async start(): Promise<void> {
    if (!this.canStart()) return;
    const session = await this.store.start({
      plannedMin: this.selectedDuration(),
      target: this.effectiveTarget(),
      intent: this.intent().trim() || undefined,
    });
    if (session) this.enterDefaultView();
  }

  private enterDefaultView(): void {
    const mode = readDefaultViewMode();
    if (mode === POMODORO_VIEW_MODE.MINI) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    void this.router.navigateByUrl('/pomodoro/active');
    if (mode === POMODORO_VIEW_MODE.ZEN) {
      this.overlayHost.show(POMODORO_ZEN_KEY, PomodoroZenViewComponent, 'fullscreen');
    }
  }
}
