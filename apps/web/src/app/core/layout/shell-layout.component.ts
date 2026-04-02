import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { ThemeService } from '@core/theme/theme.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent {
  readonly themeService = inject(ThemeService);

  readonly sidebarOpen = signal(window.innerWidth >= 1024);
  readonly mobileDrawerOpen = signal(false);

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) {
      this.mobileDrawerOpen.set(false);
    }
  }

  toggleSidebar(): void {
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
