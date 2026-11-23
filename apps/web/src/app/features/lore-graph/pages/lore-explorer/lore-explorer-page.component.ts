import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoreGraphService } from '../../services/lore-graph.service';
import type {
  CuratedWorkOption,
  LoreEventItem,
  LoreViewMode,
  LoreWorkPayload,
  SpoilerLevel,
} from '../../models/lore-graph.model';

@Component({
  selector: 'app-lore-explorer-page',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './lore-explorer-page.component.html',
  styleUrl: './lore-explorer-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoreExplorerPageComponent implements OnInit {
  private readonly loreService = inject(LoreGraphService);

  readonly works = signal<CuratedWorkOption[]>([]);
  readonly selectedWorkId = signal<string>('');
  readonly maxSpoiler = signal<SpoilerLevel>('NONE');
  readonly viewMode = signal<LoreViewMode>('timeline');
  readonly loreData = signal<LoreWorkPayload | null>(null);
  readonly selectedEventId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedEvent = computed<LoreEventItem | null>(() => {
    const id = this.selectedEventId();
    if (!id) return null;
    return this.loreData()?.events.find((e) => e.id === id) ?? null;
  });

  readonly selectedEventRelations = computed(() => {
    const id = this.selectedEventId();
    const data = this.loreData();
    if (!id || !data) return [];
    return data.relations.filter((r) => r.fromEventId === id || r.toEventId === id);
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.loreService.listCuratedWorks().subscribe({
      next: (res) => {
        this.works.set(res.items);
        if (res.items.length > 0) {
          this.selectWork(res.items[0]!.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Unable to load curated LoreGraph works.');
        this.loading.set(false);
      },
    });
  }

  selectWork(workId: string): void {
    this.selectedWorkId.set(workId);
    this.selectedEventId.set(null);
    this.loadLore();
  }

  setSpoilerLevel(level: SpoilerLevel): void {
    this.maxSpoiler.set(level);
    this.selectedEventId.set(null);
    this.loadLore();
  }

  setViewMode(mode: LoreViewMode): void {
    this.viewMode.set(mode);
  }

  selectEvent(eventId: string): void {
    this.selectedEventId.set(eventId);
  }

  private loadLore(): void {
    const workId = this.selectedWorkId();
    if (!workId) return;
    this.loading.set(true);
    this.error.set(null);
    this.loreService.getWorkLore(workId, this.maxSpoiler()).subscribe({
      next: (data) => {
        this.loreData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load spoiler-filtered LoreGraph data.');
        this.loading.set(false);
      },
    });
  }
}
