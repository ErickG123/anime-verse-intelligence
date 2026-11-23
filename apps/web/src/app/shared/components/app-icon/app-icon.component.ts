import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconName } from '@shared/models/icon-name.types';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-icon.component.html',
  styleUrl: './app-icon.component.scss',
})
export class AppIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(18);
}
