import { AniListMedia, AnimeFormat, AnimeSeason } from '../types/anime';

const ANILIST_API_URL = 'https://graphql.anilist.co';

export interface AniListSearchParams {
  search?: string;
  genre_in?: string[];
  seasonYear?: number;
  season?: AnimeSeason;
  format_in?: AnimeFormat[];
  averageScore_greater?: number; // 0-100
  sort?: string[];
  page?: number;
  perPage?: number;
}

export interface SearchResult {
  media: AniListMedia[];
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    perPage: number;
  };
}

// In-memory query cache
const memoryCache = new Map<string, { timestamp: number; data: SearchResult }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory genres cache
let cachedGenres: string[] | null = null;

const ANIME_QUERY = `
  query (
    $page: Int = 1,
    $perPage: Int = 20,
    $search: String,
    $genre_in: [String],
    $seasonYear: Int,
    $season: MediaSeason,
    $format_in: [MediaFormat],
    $averageScore_greater: Int,
    $sort: [MediaSort] = [POPULARITY_DESC]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(
        type: ANIME,
        search: $search,
        genre_in: $genre_in,
        seasonYear: $seasonYear,
        season: $season,
        format_in: $format_in,
        averageScore_greater: $averageScore_greater,
        sort: $sort
      ) {
        id
        idMal
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        format
        episodes
        seasonYear
        season
        genres
        averageScore
        status
        description
      }
    }
  }
`;

const GENRES_QUERY = `
  query {
    GenreCollection
  }
`;

/**
 * Executes a GraphQL query against AniList with rate limit handling and caching
 */
export async function searchAnime(params: AniListSearchParams): Promise<SearchResult> {
  // Normalize params for cache key
  const cacheKey = JSON.stringify(params);
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Format variables: sanitize empty strings/arrays
  const variables: Record<string, unknown> = {
    page: params.page || 1,
    perPage: params.perPage || 24,
    sort: params.sort || ['POPULARITY_DESC'],
  };

  if (params.search && params.search.trim().length > 0) {
    variables.search = params.search.trim();
  }
  if (params.genre_in && params.genre_in.length > 0) {
    variables.genre_in = params.genre_in;
  }
  if (params.seasonYear) {
    variables.seasonYear = params.seasonYear;
  }
  if (params.season) {
    variables.season = params.season;
  }
  if (params.format_in && params.format_in.length > 0) {
    variables.format_in = params.format_in;
  }
  if (params.averageScore_greater && params.averageScore_greater > 0) {
    variables.averageScore_greater = params.averageScore_greater;
  }

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANIME_QUERY,
        variables,
      }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMessage = retryAfter ? ` Please wait ${retryAfter} seconds.` : ' Please wait a moment before trying again.';
      throw new Error(`AniList API rate limit reached (HTTP 429).${waitMessage}`);
    }

    if (!response.ok) {
      throw new Error(`AniList API returned error HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      const msg = json.errors.map((e: { message: string }) => e.message).join(', ');
      throw new Error(`AniList API Error: ${msg}`);
    }

    const pageData = json.data?.Page;
    const result: SearchResult = {
      media: pageData?.media || [],
      pageInfo: pageData?.pageInfo || {
        total: 0,
        currentPage: 1,
        lastPage: 1,
        hasNextPage: false,
        perPage: 24,
      },
    };

    // Save to memory cache
    memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });

    // Evict old entries if cache grows past 100 items
    if (memoryCache.size > 100) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network error occurred while querying AniList.');
  }
}

/**
 * Fetch available genres from AniList
 */
export async function fetchGenres(): Promise<string[]> {
  if (cachedGenres && cachedGenres.length > 0) {
    return cachedGenres;
  }

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: GENRES_QUERY,
      }),
    });

    if (response.status === 429) {
      throw new Error('AniList API rate limit reached (HTTP 429). Please wait a moment.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch genres: ${response.statusText}`);
    }

    const json = await response.json();
    const genres = (json.data?.GenreCollection as string[]) || [];
    cachedGenres = genres.filter(Boolean);
    return cachedGenres;
  } catch (err) {
    console.error('Error fetching genres:', err);
    // Safe fallback if genre query fails
    return [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
      'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
      'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];
  }
}

/**
 * Helper to get clean display title (English preferred if available, or Romaji)
 */
export function getDisplayTitle(title: { english?: string | null; romaji?: string | null }): string {
  return title.english?.trim() || title.romaji?.trim() || 'Untitled Anime';
}

/**
 * Helper to convert AniList 0-100 score to 0-10 format
 */
export function formatScoreTo10(score: number | null | undefined): number | null {
  if (score === null || score === undefined || isNaN(score) || score <= 0) {
    return null;
  }
  return Math.round((score / 10) * 10) / 10;
}
