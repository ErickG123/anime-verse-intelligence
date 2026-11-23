import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import type { AppTheme } from '@core/models/theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  constructor() {
    effect(() => {
      const current = this.theme();
      this.doc.documentElement.setAttribute('data-theme', current);
      try {
        globalThis.localStorage?.setItem('animeverse-theme', current);
      } catch {
        // Ignore storage restrictions
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private readInitialTheme(): AppTheme {
    try {
      const stored = globalThis.localStorage?.getItem('animeverse-theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Ignore storage restrictions
    }
    return 'dark';
  }
}
