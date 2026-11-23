import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader, Translation } from '@jsverse/transloco';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';

class InlineTestLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    const dict: Record<string, Translation> = {
      'pt-BR': {
        app: {
          name: 'AnimeVerse Intelligence',
          skipToContent: 'Pular para o conteúdo principal',
          attribution: 'Atribuição ODbL',
          themeLight: 'Tema claro',
          themeDark: 'Tema escuro',
          language: 'Idioma',
        },
        nav: {
          catalog: 'Catálogo',
          relations: 'Relações',
          studios: 'Estúdios',
          sources: 'Fontes',
          lore: 'LoreGraph',
          adaptation: 'AdaptationLab',
          about: 'Sobre',
        },
      },
      en: {
        app: {
          name: 'AnimeVerse Intelligence',
          skipToContent: 'Skip to main content',
          attribution: 'ODbL Attribution',
          themeLight: 'Light theme',
          themeDark: 'Dark theme',
          language: 'Language',
        },
        nav: {
          catalog: 'Catalog',
          relations: 'Relations',
          studios: 'Studios',
          sources: 'Sources',
          lore: 'LoreGraph',
          adaptation: 'AdaptationLab',
          about: 'About',
        },
      },
    };
    return of(dict[lang] ?? dict['pt-BR']);
  }
}

describe('App Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideTransloco({
          config: {
            availableLangs: ['pt-BR', 'en'],
            defaultLang: 'pt-BR',
            reRenderOnLangChange: true,
          },
          loader: InlineTestLoader,
        }),
      ],
    }).compileComponents();
  });

  it('renders shell navigation in pt-BR by default and toggles dark/light theme', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('AnimeVerse Intelligence');
    expect(el.textContent).toContain('Catálogo');
    expect(el.textContent).toContain('Fontes');

    const themeBtn = el.querySelector<HTMLButtonElement>('.topbar__icon-btn');
    expect(themeBtn).toBeTruthy();
    themeBtn?.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
