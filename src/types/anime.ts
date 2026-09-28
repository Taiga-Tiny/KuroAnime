export type WatchStatus = 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped';

export type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export interface AniListMediaTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface AniListCoverImage {
  large?: string | null;
  medium?: string | null;
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: AniListMediaTitle;
  coverImage: AniListCoverImage;
  format: AnimeFormat | string | null;
  episodes: number | null;
  seasonYear: number | null;
  season: AnimeSeason | string | null;
  genres: string[];
  averageScore: number | null; // 0-100
  status: string | null;
  description?: string | null;
}

export interface AniListSearchResponse {
  data?: {
    Page?: {
      pageInfo?: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
      media: AniListMedia[];
    };
    GenreCollection?: string[];
  };
  errors?: Array<{
    message: string;
    status?: number;
  }>;
}

export interface WatchlistItem {
  id: string; // unique internal id
  mal_id: number;
  anilist_id: number;
  title: string;
  title_romaji?: string;
  title_english?: string;
  image: string;
  type: string; // TV, Movie, etc.
  total_episodes: number | null;
  year: number | null;
  season: string | null;
  genres: string[];
  mal_score: number | null; // Converted to 0-10 scale
  status: WatchStatus;
  episodes_watched: number;
  personal_rating: number | null; // 1-10
  personal_notes: string;
  date_added: string; // ISO string
  updated_at?: string;
}

export type SortOption =
  | 'title_asc'
  | 'title_desc'
  | 'date_added_desc'
  | 'date_added_asc'
  | 'rating_desc'
  | 'rating_asc'
  | 'score_desc'
  | 'score_asc'
  | 'year_desc'
  | 'year_asc'
  | 'progress_desc'
  | 'progress_asc';

export interface WatchlistFilterState {
  status: 'All' | WatchStatus;
  searchQuery: string;
  genres: string[];
  types: string[];
  season: 'All' | AnimeSeason;
  minYear: number | '';
  maxYear: number | '';
  minRating: number | ''; // personal rating 1-10
  minScore: number | '';  // AniList/MAL score 1-10
}
