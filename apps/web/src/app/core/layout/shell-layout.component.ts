import { Component, computed, inject, signal, HostListener, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { ThemeService } from '@core/theme/theme.service';
import { AuthStore } from '@features/auth/application/auth.store';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  private readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly userInitials = computed(() => {
    const user = this.authStore.currentUser();
    if (!user) return '?';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || user.email[0].toUpperCase();
  });

  readonly displayName = computed(() => {
    const user = this.authStore.currentUser();
    if (!user) return '';
    return user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
  });

  readonly sidebarOpen = signal(true);
  readonly mobileDrawerOpen = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.sidebarOpen.set(window.innerWidth >= 1024);
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
