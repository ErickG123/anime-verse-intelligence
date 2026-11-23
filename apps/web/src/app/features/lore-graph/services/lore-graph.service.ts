import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CuratedWorkOption, LoreWorkPayload, SpoilerLevel } from '../models/lore-graph.model';

@Injectable({ providedIn: 'root' })
export class LoreGraphService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  listCuratedWorks(): Observable<{ items: CuratedWorkOption[] }> {
    return this.http.get<{ items: CuratedWorkOption[] }>(
      `${this.apiBase}/lore/curated-works?module=lore`,
    );
  }

  getWorkLore(animeId: string, maxSpoiler: SpoilerLevel): Observable<LoreWorkPayload> {
    const params = new HttpParams().set('maxSpoiler', maxSpoiler);
    return this.http.get<LoreWorkPayload>(`${this.apiBase}/lore/works/${animeId}`, { params });
  }
}
