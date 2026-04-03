import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface AddMethod {
  id: string;
  title: string;
  description: string;
  features: string[];
  iconVariant: 'form' | 'url' | 'import' | 'voice';
  route: string;
  available: boolean;
  ctaLabel: string;
}

@Component({
  selector: 'app-add-resource-hub',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './add-resource-hub.component.html',
})
export class AddResourceHubComponent {
  private readonly router = inject(Router);

  readonly methods: AddMethod[] = [
    {
      id: 'guided',
      title: 'Guided Form',
      description: 'A structured, step-by-step walkthrough for complex entry creation.',
      features: ['Real-time validation', 'Visual progress', 'Smart fields'],
      iconVariant: 'form',
      route: '/add/guided',
      available: true,
      ctaLabel: 'Initialize',
    },
    {
      id: 'url',
      title: 'URL Scrape',
      description: 'Convert any web source into structured data instantly.',
      features: ['Smart autocomplete', 'Instant preview', 'Auto metadata'],
      iconVariant: 'url',
      route: '/add/url',
      available: false,
      ctaLabel: 'Initialize',
    },
    {
      id: 'voice',
      title: 'Voice Capture',
      description: 'Dictate your resource and let the AI transcribe and categorize.',
      features: ['Voice recognition', 'Draft editing', 'Review before submit'],
      iconVariant: 'voice',
      route: '/add/voice',
      available: false,
      ctaLabel: 'Initialize',
    },
    {
      id: 'import',
      title: 'Import Externals',
      description: 'Batch upload JSON, PDF, or Markdown directly to the repository.',
      features: ['CSV and JSON', 'Bulk import', 'Data validation'],
      iconVariant: 'import',
      route: '/add/import',
      available: false,
      ctaLabel: 'Initialize',
    },
  ];

  navigate(method: AddMethod): void {
    if (!method.available) return;
    this.router.navigate([method.route]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
