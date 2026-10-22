import { computed, Injectable, signal } from '@angular/core';
import {
  AuthUser,
  CAPABILITY_STATE,
  type CapabilityKey,
  type ModulePreferences,
  type OptionalModuleKey,
} from '@features/auth/domain/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  readonly enabledModuleSet = computed(
    () => new Set<string>(this.currentUser()?.enabledModules ?? []),
  );

  readonly displayName = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    const full = `${u.firstName} ${u.lastName}`.trim();
    return full || u.email;
  });

  readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    if (u.firstName) return u.firstName[0].toUpperCase();
    return u.email[0].toUpperCase();
  });

  setSession(user: AuthUser, token: string): void {
    this.currentUser.set(user);
    this.accessToken.set(token || null);
  }

  isEnabled(key: CapabilityKey): boolean {
    return this.currentUser()?.capabilities[key]?.state === CAPABILITY_STATE.ENABLED;
  }

  updateModulePreferences({ enabledModules, capabilities }: ModulePreferences): void {
    const u = this.currentUser();
    if (!u) return;
    this.currentUser.set({ ...u, enabledModules, capabilities });
  }

  updateEnabledModules(enabledModules: OptionalModuleKey[]): void {
    const u = this.currentUser();
    if (!u) return;
    this.currentUser.set({ ...u, enabledModules });
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
  }
}
