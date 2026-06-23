import { Component, computed, inject, signal, HostListener, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authHttp = inject(AuthHttpService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly userInitials = this.authStore.userInitials;
  readonly displayName = this.authStore.displayName;
  readonly showPaths = computed(() => this.authStore.featureSet().has('learning-paths'));
  readonly showAtlas = computed(() => this.authStore.featureSet().has('knowledge-graph'));

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

  async signOut(): Promise<void> {
    try {
      await this.authHttp.signOut();
    } finally {
      this.authStore.clearSession();
      void this.router.navigate(['/auth/sign-in']);
    }
  }
}
