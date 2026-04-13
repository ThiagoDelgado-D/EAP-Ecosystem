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
      description: 'Extract metadata from any article, documentation or repository.',
      features: [
        'Auto-fetch title & description',
        'Preview before saving',
        'Supports articles, GitHub, docs',
      ],
      iconVariant: 'url',
      available: true,
      ctaLabel: 'Import URL',
      route: '/add/url',
    },
    {
      id: 'voice',
      title: 'Voice Capture',
      description: 'Dictate your resource and let the AI transcribe and categorize.',
      features: ['Voice recognition', 'Draft editing', 'Review before submit'],
      iconVariant: 'voice',
      route: '/add/voice',
      available: true,
      ctaLabel: 'Start Recording',
    },
    {
      id: 'import',
      title: 'Import Externals',
      description: 'Batch upload JSON, PDF, or Markdown directly to the repository.',
      features: ['CSV and JSON', 'Bulk import', 'Data validation'],
      iconVariant: 'import',
      route: '/add/import',
      available: true,
      ctaLabel: 'Upload File',
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
