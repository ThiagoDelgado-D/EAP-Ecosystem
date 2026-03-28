import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '@core/theme/theme.service';

interface AddMethod {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
  route: string;
  available: boolean;
  accentColor: string;
}

@Component({
  selector: 'app-add-resource-hub',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './add-resource-hub.component.html',
})
export class AddResourceHubComponent {
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly methods: AddMethod[] = [
    {
      id: 'guided',
      title: 'Guided Form',
      description: 'Step-by-step form with real-time validation',
      features: ['Real-time validation', 'Visual progress', 'Smart fields'],
      icon: '📋',
      route: '/add/guided',
      available: true,
      accentColor: 'blue',
    },
    {
      id: 'url',
      title: 'Import from URL',
      description: 'Paste a URL and autocomplete resource info',
      features: ['Smart autocomplete', 'Instant preview', 'Auto metadata'],
      icon: '🔗',
      route: '/add/url',
      available: false,
      accentColor: 'purple',
    },
    {
      id: 'import',
      title: 'Import File',
      description: 'Upload CSV or JSON to import multiple resources',
      features: ['CSV and JSON', 'Bulk import', 'Data validation'],
      icon: '📤',
      route: '/add/import',
      available: false,
      accentColor: 'green',
    },
    {
      id: 'voice',
      title: 'Voice Capture',
      description: 'Dictate your resource and review before saving',
      features: ['Voice recognition', 'Draft editing', 'Review before submit'],
      icon: '🎙️',
      route: '/add/voice',
      available: false,
      accentColor: 'pink',
    },
  ];

  navigate(method: AddMethod): void {
    if (!method.available) return;
    this.router.navigate([method.route]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
