import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppIconComponent } from '@shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-state-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, AppIconComponent],
  templateUrl: './state-panel.component.html',
  styleUrl: './state-panel.component.scss',
})
export class StatePanelComponent {
  readonly kind = input.required<'loading' | 'empty' | 'error'>();
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly retry = output<void>();
}
