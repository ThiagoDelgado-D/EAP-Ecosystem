import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

export const APP_NAME = 'Cauce';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly title = inject(Title);

  set(page?: string): void {
    this.title.setTitle(page ? `${page} · ${APP_NAME}` : APP_NAME);
  }
}
