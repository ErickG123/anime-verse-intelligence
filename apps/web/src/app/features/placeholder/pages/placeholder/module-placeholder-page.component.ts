import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';

@Component({
  selector: 'app-module-placeholder-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, StatePanelComponent],
  templateUrl: './module-placeholder-page.component.html',
  styleUrl: './module-placeholder-page.component.scss',
})
export class ModulePlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly titleKey = String(this.route.snapshot.data['titleKey'] ?? 'states.emptyTitle');
  protected readonly messageKey = String(
    this.route.snapshot.data['messageKey'] ?? 'states.unavailable',
  );
}
