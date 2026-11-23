import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ThemeService } from '@core/services/theme.service';
import { PRIMARY_NAV_ITEMS } from '@layout/constants/navigation.constants';
import { AppIconComponent } from '@shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe, AppIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly themeService = inject(ThemeService);
  private readonly transloco = inject(TranslocoService);

  protected readonly activeLang = signal<string>(this.transloco.getActiveLang() || 'pt-BR');
  protected readonly mobileMenuOpen = signal(false);
  protected readonly navItems = PRIMARY_NAV_ITEMS;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected switchLang(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.activeLang.set(lang);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
