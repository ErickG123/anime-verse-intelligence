import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DEFAULT_CATALOG_FILTERS } from '@features/catalog/constants/catalog-filter.constants';
import { CatalogService } from '@features/catalog/services/catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends query parameters for search and filters to /api/v1/anime', () => {
    service
      .searchAnime({
        ...DEFAULT_CATALOG_FILTERS,
        q: 'Bebop',
        type: 'TV',
        year: '1998',
        page: 2,
      })
      .subscribe((res) => {
        expect(res.pagination.total).toBe(0);
      });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/anime'));
    expect(req.request.params.get('q')).toBe('Bebop');
    expect(req.request.params.get('type')).toBe('TV');
    expect(req.request.params.get('year')).toBe('1998');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], pagination: { page: 2, pageSize: 20, total: 0, totalPages: 0 } });
  });
});
