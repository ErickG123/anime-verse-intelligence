import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  CompanyRole,
  CompanySummaryDto,
  NetworkGraphResponseDto,
  PaginatedResponse,
  StudioGraphMetadataDto,
  StudioGraphMode,
  StudioGraphPageDto,
} from '@animeverse/contracts';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class StudiosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listCompanies(
    role: CompanyRole,
    q = '',
    page = 1,
    pageSize = 20,
  ): Observable<PaginatedResponse<CompanySummaryDto>> {
    let params = new HttpParams()
      .set('role', role)
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<PaginatedResponse<CompanySummaryDto>>(`${this.baseUrl}/studios`, {
      params,
    });
  }

  getCompanyNetwork(companyId: string, limit = 50): Observable<NetworkGraphResponseDto> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<NetworkGraphResponseDto>(
      `${this.baseUrl}/studios/${encodeURIComponent(companyId)}/network`,
      { params },
    );
  }

  getStudioGraphMetadata(): Observable<StudioGraphMetadataDto> {
    return this.http.get<StudioGraphMetadataDto>(`${this.baseUrl}/studio-graph/metadata`);
  }

  queryStudioGraph(options: {
    anchorId: string;
    mode: StudioGraphMode;
    role?: CompanyRole | '';
    yearFrom?: string;
    yearTo?: string;
    limit?: number;
    offset?: number;
  }): Observable<StudioGraphPageDto> {
    let params = new HttpParams()
      .set('anchorId', options.anchorId)
      .set('mode', options.mode)
      .set('limit', String(options.limit ?? 30))
      .set('offset', String(options.offset ?? 0));
    if (options.role) params = params.set('role', options.role);
    if (options.yearFrom?.trim()) params = params.set('yearFrom', options.yearFrom.trim());
    if (options.yearTo?.trim()) params = params.set('yearTo', options.yearTo.trim());

    return this.http.get<StudioGraphPageDto>(`${this.baseUrl}/studio-graph`, { params });
  }

  getNodeNeighbors(
    nodeId: string,
    options: { role?: CompanyRole | ''; limit?: number; offset?: number } = {},
  ): Observable<StudioGraphPageDto> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 20))
      .set('offset', String(options.offset ?? 0));
    if (options.role) params = params.set('role', options.role);

    return this.http.get<StudioGraphPageDto>(
      `${this.baseUrl}/studio-graph/nodes/${encodeURIComponent(nodeId)}/neighbors`,
      { params },
    );
  }
}
