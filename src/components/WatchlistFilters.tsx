import React from 'react';
import { WatchStatus, WatchlistFilterState, SortOption, AnimeSeason } from '../types/anime';
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Star,
  Film,
  Calendar,
} from 'lucide-react';

interface WatchlistFiltersProps {
  filters: WatchlistFilterState;
  setFilters: React.Dispatch<React.SetStateAction<WatchlistFilterState>>;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  availableGenres: string[];
  statusCounts: Record<string, number>;
  totalCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_TABS: Array<{ label: string; value: 'All' | WatchStatus }> = [
  { label: 'All', value: 'All' },
  { label: 'Watching', value: 'Watching' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Plan to Watch', value: 'Plan to Watch' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Dropped', value: 'Dropped' },
];

const ANIME_TYPES = ['TV', 'Movie', 'OVA', 'ONA', 'Special'];
const SEASONS: Array<{ label: string; value: 'All' | AnimeSeason }> = [
  { label: 'All Seasons', value: 'All' },
  { label: 'Winter', value: 'WINTER' },
  { label: 'Spring', value: 'SPRING' },
  { label: 'Summer', value: 'SUMMER' },
  { label: 'Fall', value: 'FALL' },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: 'Date Added (Newest)', value: 'date_added_desc' },
  { label: 'Date Added (Oldest)', value: 'date_added_asc' },
  { label: 'Title (A → Z)', value: 'title_asc' },
  { label: 'Title (Z → A)', value: 'title_desc' },
  { label: 'Personal Rating (High → Low)', value: 'rating_desc' },
  { label: 'Personal Rating (Low → High)', value: 'rating_asc' },
  { label: 'MAL Score (High → Low)', value: 'score_desc' },
  { label: 'MAL Score (Low → High)', value: 'score_asc' },
  { label: 'Year (Newest)', value: 'year_desc' },
  { label: 'Year (Oldest)', value: 'year_asc' },
  { label: 'Progress % (Highest)', value: 'progress_desc' },
  { label: 'Progress % (Lowest)', value: 'progress_asc' },
];

export const WatchlistFilters: React.FC<WatchlistFiltersProps> = ({
  filters,
  setFilters,
  sortOption,
  setSortOption,
  availableGenres,
  statusCounts,
  totalCount,
  isOpenMobile,
  setIsOpenMobile,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  onClearFilters,
  hasActiveFilters,
}) => {
  const toggleGenre = (genre: string) => {
    setFilters(prev => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists
          ? prev.genres.filter(g => g !== genre)
          : [...prev.genres, genre],
      };
    });
  };

  const toggleType = (type: string) => {
    setFilters(prev => {
      const exists = prev.types.includes(type);
      return {
        ...prev,
        types: exists
          ? prev.types.filter(t => t !== type)
          : [...prev.types, type],
      };
    });
  };

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Header with Title and Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Filter & Sort
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Watchlist Text Search */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
          Search in Watchlist
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter by title..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
          Sort Order
        </label>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value as SortOption)}
          className="w-full py-2 px-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Anime Format / Type */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          Format / Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ANIME_TYPES.map(type => {
            const isSelected = filters.types.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Season & Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Season
          </label>
          <select
            value={filters.season}
            onChange={e => setFilters(prev => ({ ...prev, season: e.target.value as 'All' | AnimeSeason }))}
            className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {SEASONS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Min Year
          </label>
          <input
            type="number"
            min="1960"
            max="2035"
            placeholder="e.g. 2018"
            value={filters.minYear}
            onChange={e => setFilters(prev => ({ ...prev, minYear: e.target.value ? Number(e.target.value) : '' }))}
            className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Ratings & Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Min User Rating
          </label>
          <select
            value={filters.minRating}
            onChange={e => setFilters(prev => ({ ...prev, minRating: e.target.value ? Number(e.target.value) : '' }))}
            className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
          >
            <option value="">Any Rating</option>
            {[9, 8, 7, 6, 5].map(r => (
              <option key={r} value={r}>
                ★ {r}+
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Min MAL Score
          </label>
          <select
            value={filters.minScore}
            onChange={e => setFilters(prev => ({ ...prev, minScore: e.target.value ? Number(e.target.value) : '' }))}
            className="w-full py-2 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
          >
            <option value="">Any Score</option>
            {[9, 8.5, 8, 7.5, 7, 6.5, 6].map(s => (
              <option key={s} value={s}>
                {s}+
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Genres (Multi-select) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Genres {filters.genres.length > 0 && `(${filters.genres.length})`}
          </label>
          {filters.genres.length > 0 && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, genres: [] }))}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Reset
            </button>
          )}
        </div>

        <div className="max-h-44 overflow-y-auto pr-1 space-y-1">
          {availableGenres.length === 0 ? (
            <div className="text-xs text-zinc-400 italic py-2">Loading genres...</div>
          ) : (
            availableGenres.map(genre => {
              const isChecked = filters.genres.includes(genre);
              return (
                <label
                  key={genre}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300 select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleGenre(genre)}
                    className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{genre}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Status Tabs Bar */}
      <div className="mb-5 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl w-max min-w-full sm:min-w-0">
          {STATUS_TABS.map(tab => {
            const count = tab.value === 'All' ? totalCount : (statusCounts[tab.value] || 0);
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilters(prev => ({ ...prev, status: tab.value }))}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Filter Sidebar Controls */}
      <div className="hidden lg:block">
        {isDesktopCollapsed ? (
          <button
            onClick={() => setIsDesktopCollapsed(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors shadow-xs mb-4"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Show Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>
        ) : (
          <aside className="w-64 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs sticky top-20 self-start">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 font-medium">Sidebar</span>
              <button
                onClick={() => setIsDesktopCollapsed(true)}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                title="Collapse sidebar"
              >
                Hide
              </button>
            </div>
            {filterContent}
          </aside>
        )}
      </div>

      {/* Mobile Drawer / Bottom Sheet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-zinc-200 dark:border-zinc-800 p-5 overflow-y-auto shadow-2xl z-10">
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Watchlist Filters
              </h3>
              <button
                onClick={() => setIsOpenMobile(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {filterContent}

            <div className="mt-6 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsOpenMobile(false)}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
