import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AnimeSummaryDto,
  NetworkGraphResponseDto,
  PaginatedResponse,
} from '@animeverse/contracts';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class RelationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAnimeNetwork(animeId: string, depth: number, limit = 50): Observable<NetworkGraphResponseDto> {
    const params = new HttpParams().set('depth', String(depth)).set('limit', String(limit));
    return this.http.get<NetworkGraphResponseDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(animeId)}/network`,
      { params },
    );
  }

  searchAnimeWorks(query: string): Observable<PaginatedResponse<AnimeSummaryDto>> {
    const params = new HttpParams().set('q', query.trim()).set('page', '1').set('pageSize', '8');
    return this.http.get<PaginatedResponse<AnimeSummaryDto>>(`${this.baseUrl}/anime`, { params });
  }
}
