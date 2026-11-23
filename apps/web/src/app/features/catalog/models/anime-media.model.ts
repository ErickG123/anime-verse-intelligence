export interface AnimeMedia {
  imageUrl: string | null;
  source: string;
  attribution: string | null;
  mediaType: 'POSTER' | 'THUMBNAIL' | 'BACKDROP';
  usageStatus: 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
}

export interface TmdbMatchPayload {
  tmdbId: number;
  mediaType: 'tv' | 'movie';
  name: string;
  originalName: string | null;
  firstAirDate: string | null;
  overview: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  usageStatus: 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
}

export interface TmdbExternalResponse {
  animeId: string;
  animeTitle: string;
  state: 'OK' | 'DISABLED' | 'MISSING_CREDENTIALS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'UNAVAILABLE';
  match: TmdbMatchPayload | null;
  attribution: string;
}
