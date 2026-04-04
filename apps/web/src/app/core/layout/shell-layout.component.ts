import { Component, inject, signal, HostListener, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { ThemeService } from '@core/theme/theme.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);

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
