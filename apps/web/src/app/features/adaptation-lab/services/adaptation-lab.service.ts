import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { AdaptationWorkOption, AdaptationWorkPayload } from '../models/adaptation-lab.model';

@Injectable({ providedIn: 'root' })
export class AdaptationLabService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  listCuratedWorks(): Observable<{ items: AdaptationWorkOption[] }> {
    return this.http.get<{ items: AdaptationWorkOption[] }>(
      `${this.apiBase}/lore/curated-works?module=adaptation`,
    );
  }

  getWorkAdaptation(animeId: string): Observable<AdaptationWorkPayload> {
    return this.http.get<AdaptationWorkPayload>(`${this.apiBase}/adaptation/works/${animeId}`);
  }
}
