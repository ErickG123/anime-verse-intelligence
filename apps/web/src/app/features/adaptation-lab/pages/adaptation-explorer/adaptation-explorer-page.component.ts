import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdaptationLabService } from '../../services/adaptation-lab.service';
import type {
  AdaptationMappingItem,
  AdaptationWorkOption,
  AdaptationWorkPayload,
} from '../../models/adaptation-lab.model';

@Component({
  selector: 'app-adaptation-explorer-page',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './adaptation-explorer-page.component.html',
  styleUrl: './adaptation-explorer-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptationExplorerPageComponent implements OnInit {
  private readonly adaptationService = inject(AdaptationLabService);

  readonly works = signal<AdaptationWorkOption[]>([]);
  readonly selectedWorkId = signal<string>('');
  readonly data = signal<AdaptationWorkPayload | null>(null);
  readonly selectedEpisodeNumber = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedEpisodeMappings = computed<AdaptationMappingItem[]>(() => {
    const ep = this.selectedEpisodeNumber();
    const payload = this.data();
    if (!payload) return [];
    if (ep === null) return payload.mappings;
    return payload.mappings.filter((m) => m.episodeNumber === ep);
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.adaptationService.listCuratedWorks().subscribe({
      next: (res) => {
        this.works.set(res.items);
        if (res.items.length > 0) {
          this.selectWork(res.items[0]!.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Unable to load curated works for AdaptationLab.');
        this.loading.set(false);
      },
    });
  }

  selectWork(workId: string): void {
    this.selectedWorkId.set(workId);
    this.selectedEpisodeNumber.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.adaptationService.getWorkAdaptation(workId).subscribe({
      next: (payload) => {
        this.data.set(payload);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load AdaptationLab mappings.');
        this.loading.set(false);
      },
    });
  }

  selectEpisode(epNumber: number | null): void {
    this.selectedEpisodeNumber.set(epNumber);
  }
}
