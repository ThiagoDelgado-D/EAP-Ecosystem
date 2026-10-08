import { Component, computed, inject, signal, HostListener, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { CaptureSheetComponent } from '@features/learning-resource/presentation/capture-sheet/capture-sheet.component';
import { CommandPaletteComponent } from '@core/command-palette/command-palette.component';
import { CommandPaletteService } from '@core/command-palette/command-palette.service';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';
import { ThemeService } from '@core/theme/theme.service';
import { CalibrationService } from '@features/recommendation/application/calibration.service';
import { ToastService } from '@core/toast/toast.service';
import type { MentalStateType } from '@features/learning-resource/domain/learning-resource.model';
import {
  MENTAL_STATE_LABELS,
  MENTAL_STATE_TYPES,
} from '@features/learning-resource/domain/learning-resource.constants';
import { BrandMarkComponent } from '@shared/components/brand-mark/brand-mark.component';

const MENTAL_STATE_TONES: Record<MentalStateType, string> = {
  deep_focus: 'deep-focus',
  light_read: 'light-read',
  creative: 'creative',
  quick_op: 'quick-op',
  review: 'review',
};

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    RouterModule,
    RouterLinkActive,
    CaptureSheetComponent,
    CommandPaletteComponent,
    BrandMarkComponent,
  ],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authHttp = inject(AuthHttpService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(ThemeService);

  readonly userInitials = this.authStore.userInitials;
  readonly displayName = this.authStore.displayName;
  readonly showPaths = computed(() => this.authStore.featureSet().has('learning-paths'));

  readonly sidebarOpen = signal(true);
  readonly mobileDrawerOpen = signal(false);

  private readonly calibration = inject(CalibrationService);
  private readonly commandPalette = inject(CommandPaletteService);

  readonly commandPaletteShortcut = this.commandPalette.shortcutLabel;
  private readonly toast = inject(ToastService);

  readonly currentState = this.calibration.mentalState;
  readonly stateMenuOpen = signal(false);
  readonly mentalStateOptions = MENTAL_STATE_TYPES.map((value) => ({
    value,
    label: MENTAL_STATE_LABELS[value],
  }));

  stateLabel(state: MentalStateType): string {
    return MENTAL_STATE_LABELS[state];
  }

  stateTone(state: MentalStateType): string {
    return `var(--color-state-${MENTAL_STATE_TONES[state]})`;
  }

  currentStateTone(): string | null {
    const current = this.currentState();
    return current ? this.stateTone(current) : null;
  }

  openCommandPalette(): void {
    this.commandPalette.open();
  }

  toggleStateMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.stateMenuOpen.update((v) => !v);
  }

  async chooseMentalState(state: MentalStateType | null): Promise<void> {
    this.stateMenuOpen.set(false);
    const saved = await this.calibration.setMentalState(state);
    if (!saved) {
      this.toast.show('Could not save your mental state', 'error');
      return;
    }
    this.toast.show(state ? `Mental state: ${MENTAL_STATE_LABELS[state]}` : 'Mental state cleared', 'info');
  }

  @HostListener('document:click')
  closeStateMenu(): void {
    this.stateMenuOpen.set(false);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.sidebarOpen.set(window.innerWidth >= 1024);
      void this.calibration.load();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth >= 1024) {
      this.mobileDrawerOpen.set(false);
    }
  }

  toggleSidebar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth >= 1024) {
      this.sidebarOpen.update((v) => !v);
    } else {
      this.mobileDrawerOpen.update((v) => !v);
    }
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  async signOut(): Promise<void> {
    try {
      await this.authHttp.signOut();
    } finally {
      this.authStore.clearSession();
      void this.router.navigate(['/auth/sign-in']);
    }
  }
}
