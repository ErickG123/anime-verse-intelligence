import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AniListCharactersResponseDto,
  AniListExternalStatusDto,
  AniListStaffResponseDto,
  AniListStudiosResponseDto,
  AnimeDetailDto,
  AnimeSummaryDto,
  NetworkGraphResponseDto,
  PaginatedResponse,
} from '@animeverse/contracts';
import { environment } from '@env/environment';
import type {
  CatalogFilterState,
  RelatedAnimeApiResponse,
} from '@features/catalog/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  searchAnime(filters: CatalogFilterState): Observable<PaginatedResponse<AnimeSummaryDto>> {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('pageSize', String(filters.pageSize))
      .set('sortBy', filters.sortBy)
      .set('sortOrder', filters.sortOrder);

    if (filters.q.trim()) params = params.set('q', filters.q.trim());
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.season) params = params.set('season', filters.season);
    if (filters.year.trim()) params = params.set('year', filters.year.trim());
    if (filters.tag.trim()) params = params.set('tag', filters.tag.trim());
    if (filters.studio.trim()) params = params.set('studio', filters.studio.trim());

    return this.http.get<PaginatedResponse<AnimeSummaryDto>>(`${this.baseUrl}/anime`, { params });
  }

  getAnimeDetail(id: string): Observable<AnimeDetailDto> {
    return this.http.get<AnimeDetailDto>(`${this.baseUrl}/anime/${encodeURIComponent(id)}`);
  }

  getRelatedAnime(id: string): Observable<RelatedAnimeApiResponse> {
    return this.http.get<RelatedAnimeApiResponse>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/related`,
    );
  }

  getAniListStatus(id: string): Observable<AniListExternalStatusDto> {
    return this.http.get<AniListExternalStatusDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/external-status`,
    );
  }

  getAniListCharacters(
    id: string,
    page = 1,
    perPage = 15,
  ): Observable<AniListCharactersResponseDto> {
    const params = new HttpParams().set('page', String(page)).set('perPage', String(perPage));
    return this.http.get<AniListCharactersResponseDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/characters`,
      { params },
    );
  }

  getAniListStaff(id: string, page = 1, perPage = 15): Observable<AniListStaffResponseDto> {
    const params = new HttpParams().set('page', String(page)).set('perPage', String(perPage));
    return this.http.get<AniListStaffResponseDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/staff`,
      { params },
    );
  }

  getAniListStudios(id: string): Observable<AniListStudiosResponseDto> {
    return this.http.get<AniListStudiosResponseDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/studios`,
    );
  }

  getStudioGraphStaff(id: string, limit = 15): Observable<NetworkGraphResponseDto> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<NetworkGraphResponseDto>(
      `${this.baseUrl}/anime/${encodeURIComponent(id)}/studio-graph-staff`,
      { params },
    );
  }
}
