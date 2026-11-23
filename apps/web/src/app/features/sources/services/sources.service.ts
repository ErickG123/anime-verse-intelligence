import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { AniListMetricsDto, DataSourceDto, IngestionRunDto } from '@animeverse/contracts';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SourcesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listSources(): Observable<{ items: DataSourceDto[] }> {
    return this.http.get<{ items: DataSourceDto[] }>(`${this.baseUrl}/data-sources`);
  }

  listRuns(sourceId: string): Observable<{ sourceId: string; items: IngestionRunDto[] }> {
    return this.http.get<{ sourceId: string; items: IngestionRunDto[] }>(
      `${this.baseUrl}/data-sources/${encodeURIComponent(sourceId)}/runs`,
    );
  }

  getAniListMetrics(): Observable<AniListMetricsDto> {
    return this.http.get<AniListMetricsDto>(`${this.baseUrl}/data-sources/anilist/metrics`);
  }
}
