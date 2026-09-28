import React from 'react';
import { Search, X, Loader2, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { AnimeFormat, AnimeSeason } from '../types/anime';
import { AniListSearchParams } from '../services/anilist';

interface SearchBarProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchParams: AniListSearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<AniListSearchParams>>;
  availableGenres: string[];
  isLoading: boolean;
  rateLimitError: string | null;
  onRetry: () => void;
}

const SORT_CHOICES = [
  { label: 'Popularity', value: ['POPULARITY_DESC'] },
  { label: 'Trending Now', value: ['TRENDING_DESC'] },
  { label: 'Highest Rated', value: ['SCORE_DESC'] },
  { label: 'Recently Released', value: ['START_DATE_DESC'] },
  { label: 'Title (A → Z)', value: ['TITLE_ROMAJI'] },
];

const FORMAT_CHOICES: Array<{ label: string; value: AnimeFormat }> = [
  { label: 'TV Series', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Special', value: 'SPECIAL' },
];

const SEASON_CHOICES: Array<{ label: string; value: AnimeSeason }> = [
  { label: 'Winter', value: 'WINTER' },
  { label: 'Spring', value: 'SPRING' },
  { label: 'Summer', value: 'SUMMER' },
  { label: 'Fall', value: 'FALL' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchInput,
  setSearchInput,
  searchParams,
  setSearchParams,
  availableGenres,
  isLoading,
  rateLimitError,
  onRetry,
}) => {
  const currentSortKey = JSON.stringify(searchParams.sort || ['POPULARITY_DESC']);

  const handleSortChange = (sortVal: string[]) => {
    setSearchParams(prev => ({
      ...prev,
      sort: sortVal,
      page: 1,
    }));
  };

  const handleGenreChange = (genre: string) => {
    setSearchParams(prev => ({
      ...prev,
      genre_in: genre ? [genre] : undefined,
      page: 1,
    }));
  };

  const handleFormatChange = (format: string) => {
    setSearchParams(prev => ({
      ...prev,
      format_in: format ? [format as AnimeFormat] : undefined,
      page: 1,
    }));
  };

  const handleSeasonChange = (season: string) => {
    setSearchParams(prev => ({
      ...prev,
      season: season ? (season as AnimeSeason) : undefined,
      page: 1,
    }));
  };

  const handleYearChange = (year: string) => {
    setSearchParams(prev => ({
      ...prev,
      seasonYear: year ? Number(year) : undefined,
      page: 1,
    }));
  };

  const handleMinScoreChange = (score: string) => {
    setSearchParams(prev => ({
      ...prev,
      averageScore_greater: score ? Number(score) * 10 : undefined,
      page: 1,
    }));
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: 1,
      perPage: 24,
      sort: ['POPULARITY_DESC'],
    });
  };

  const hasExtraFilters = Boolean(
    (searchParams.genre_in && searchParams.genre_in.length > 0) ||
    searchParams.season ||
    searchParams.seasonYear ||
    (searchParams.format_in && searchParams.format_in.length > 0) ||
    searchParams.averageScore_greater
  );

  return (
    <div className="w-full flex flex-col gap-4 mb-6">
      {/* Rate limit friendly notice banner */}
      {rateLimitError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{rateLimitError}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-medium text-xs transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Search Input */}
      <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search anime by title (e.g., Frieren, Jujutsu Kaisen, Attack on Titan)..."
          className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
        />

        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Discovery & Query Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {/* Genre */}
        <select
          value={searchParams.genre_in?.[0] || ''}
          onChange={e => handleGenreChange(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Genres</option>
          {availableGenres.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Format */}
        <select
          value={searchParams.format_in?.[0] || ''}
          onChange={e => handleFormatChange(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Formats</option>
          {FORMAT_CHOICES.map(f => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Season */}
        <select
          value={searchParams.season || ''}
          onChange={e => handleSeasonChange(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Seasons</option>
          {SEASON_CHOICES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Season Year */}
        <input
          type="number"
          placeholder="Year (e.g. 2024)"
          min="1970"
          max="2030"
          value={searchParams.seasonYear || ''}
          onChange={e => handleYearChange(e.target.value)}
          className="w-28 py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />

        {/* Min Score */}
        <select
          value={searchParams.averageScore_greater ? String(searchParams.averageScore_greater / 10) : ''}
          onChange={e => handleMinScoreChange(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
        >
          <option value="">Any Score</option>
          {[8.5, 8.0, 7.5, 7.0, 6.0].map(sc => (
            <option key={sc} value={sc}>
              ★ {sc}+
            </option>
          ))}
        </select>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-zinc-400 hidden sm:inline">Sort:</span>
          <select
            value={currentSortKey}
            onChange={e => handleSortChange(JSON.parse(e.target.value))}
            className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {SORT_CHOICES.map(sc => (
              <option key={sc.label} value={JSON.stringify(sc.value)}>
                {sc.label}
              </option>
            ))}
          </select>

          {hasExtraFilters && (
            <button
              onClick={resetAllFilters}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Reset search filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
