import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from '@features/auth/domain/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  setSession(user: AuthUser, token: string): void {
    this.currentUser.set(user);
    this.accessToken.set(token || null);
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
  }
}
