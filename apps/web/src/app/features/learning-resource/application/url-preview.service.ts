import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PreviewResponse {
  title?: string;
  description?: string;
  imageUrl?: string;
  resourceTypeId?: string;
  resourceTypeCode?: string;
  author?: string;
  siteName?: string;
}

@Injectable()
export class UrlPreviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/v1/learning-resources';

  readonly previewData = signal<PreviewResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async preview(url: string): Promise<PreviewResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(
        this.http.post<PreviewResponse>(`${this.baseUrl}/preview`, { url }),
      );
      this.previewData.set(result);
      return result;
    } catch (err: any) {
      const msg =
        err?.error?.message || 'Could not fetch metadata. Please check the URL and try again.';
      this.error.set(msg);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.previewData.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
