import { Component } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { SessionService } from '@features/settings/application/session.service';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { SessionRepository } from '@features/settings/domain/session.repository';
import { PreferencesHttpRepository } from '@features/settings/infrastructure/preferences-http.repository';
import { SessionHttpRepository } from '@features/settings/infrastructure/session-http.repository';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  providers: [
    PreferencesService,
    SessionService,
    { provide: PreferencesRepository, useClass: PreferencesHttpRepository },
    { provide: SessionRepository, useClass: SessionHttpRepository },
  ],
  templateUrl: './settings-layout.component.html',
})
export class SettingsLayoutComponent {}
