import { Component, AfterViewInit, ElementRef, OnDestroy, inject, signal } from '@angular/core';
import { AccountComponent } from '@features/settings/presentation/account/account.component';
import { PreferencesComponent } from '@features/settings/presentation/preferences/preferences.component';
import { ModulesComponent } from '@features/settings/presentation/modules/modules.component';
import { WidgetsComponent } from '@features/settings/presentation/widgets/widgets.component';
import { PomodoroSettingsComponent } from '@features/pomodoro/presentation/settings/pomodoro-settings.component';
import { SessionsComponent } from '@features/settings/presentation/sessions/sessions.component';
import { SecurityComponent } from '@features/settings/presentation/security/security.component';
import { NotificationsComponent } from '@features/settings/presentation/notifications/notifications.component';
import { ImportExportComponent } from '@features/settings/presentation/import-export/import-export.component';
import { DangerZoneComponent } from '@features/settings/presentation/danger-zone/danger-zone.component';
import { RevealDirective } from '@shared/components/reveal/reveal.directive';
import { AuthStore } from '@features/auth/application/auth.store';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { SessionService } from '@features/settings/application/session.service';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { SessionRepository } from '@features/settings/domain/session.repository';
import { PreferencesHttpRepository } from '@features/settings/infrastructure/preferences-http.repository';
import { SessionHttpRepository } from '@features/settings/infrastructure/session-http.repository';

interface SettingsSection {
  id: string;
  label: string;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [
    AccountComponent,
    PreferencesComponent,
    ModulesComponent,
    WidgetsComponent,
    PomodoroSettingsComponent,
    SessionsComponent,
    SecurityComponent,
    NotificationsComponent,
    ImportExportComponent,
    DangerZoneComponent,
    RevealDirective,
  ],
  providers: [
    PreferencesService,
    SessionService,
    { provide: PreferencesRepository, useClass: PreferencesHttpRepository },
    { provide: SessionRepository, useClass: SessionHttpRepository },
  ],
  templateUrl: './settings-layout.component.html',
})
export class SettingsLayoutComponent implements AfterViewInit, OnDestroy {
  private readonly authStore = inject(AuthStore);

  readonly displayName = this.authStore.displayName;
  readonly accountEmail = () => this.authStore.currentUser()?.email ?? null;
  readonly sections: SettingsSection[] = [
    { id: 'account', label: 'Account', title: 'Account', detail: 'Who is signed in.' },
    {
      id: 'appearance',
      label: 'Appearance',
      title: 'Appearance',
      detail: 'Saved to your profile and restored each sign-in.',
    },
    {
      id: 'modules',
      label: 'Modules',
      title: 'Active modules',
      detail: 'What you disable leaves navigation and stops being queried.',
    },
    {
      id: 'widgets',
      label: 'Widgets',
      title: 'Dashboard widgets',
      detail: 'Choose which blocks appear on Home.',
    },
    {
      id: 'pomodoro',
      label: 'Pomodoro',
      title: 'Pomodoro',
      detail: 'Sound, default view and hints for focus sessions.',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      title: 'Active sessions',
      detail: 'Devices with a live token. Revoke any without closing this one.',
    },
    {
      id: 'security',
      label: 'Security',
      title: 'Login & security',
      detail: 'Manage sign-in methods and security settings.',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      title: 'Notifications',
      detail: 'Control what you get notified about.',
    },
    {
      id: 'data',
      label: 'Data',
      title: 'Import & export',
      detail: 'Back up your data or migrate from another tool.',
    },
    {
      id: 'danger',
      label: 'Danger zone',
      title: 'Danger zone',
      detail: 'Irreversible actions for your account.',
    },
  ];

  readonly activeSection = signal('account');

  private readonly host = inject(ElementRef<HTMLElement>);
  private scroller: HTMLElement | null = null;
  private onScroll = (): void => this.updateActiveFromScroll();

  ngAfterViewInit(): void {
    this.scroller = this.host.nativeElement.closest('main');
    if (!this.scroller) return;
    this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateActiveFromScroll();
  }

  ngOnDestroy(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
    this.scroller = null;
  }

  private updateActiveFromScroll(): void {
    const scroller = this.scroller;
    if (!scroller) return;
    const last = this.sections[this.sections.length - 1]!.id;
    const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 24;
    if (atBottom) {
      this.activeSection.set(last);
      return;
    }
    const line = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.4;
    let current = this.sections[0]!.id;
    for (const section of this.sections) {
      const el = document.getElementById(section.id);
      if (el && el.getBoundingClientRect().top <= line) current = section.id;
    }
    this.activeSection.set(current);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection.set(id);
  }
}
