import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWatchlist } from './hooks/useWatchlist';
import { useTheme } from './hooks/useTheme';
import { useDebounce } from './hooks/useDebounce';
import {
  WatchlistItem,
  WatchStatus,
  WatchlistFilterState,
  SortOption,
  AniListMedia,
  AnimeSeason,
} from './types/anime';
import {
  searchAnime,
  fetchGenres,
  AniListSearchParams,
  SearchResult,
  formatScoreTo10,
} from './services/anilist';

import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { WatchlistFilters } from './components/WatchlistFilters';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { SkeletonCard } from './components/SkeletonCard';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import {
  Sparkles,
  SlidersHorizontal,
  Compass,
  Film,
  PlusCircle,
  Inbox,
  Search,
} from 'lucide-react';

const INITIAL_FILTERS: WatchlistFilterState = {
  status: 'All',
  searchQuery: '',
  genres: [],
  types: [],
  season: 'All',
  minYear: '',
  maxYear: '',
  minRating: '',
  minScore: '',
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const {
    watchlist,
    addToWatchlist,
    updateWatchlistItem,
    removeFromWatchlist,
    incrementEpisode,
    decrementEpisode,
    isInWatchlist,
    getWatchlistItem,
    exportWatchlist,
    importWatchlist,
  } = useWatchlist();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<'watchlist' | 'discover'>('watchlist');

  // Watchlist Filter & Sort State
  const [watchlistFilters, setWatchlistFilters] = useState<WatchlistFilterState>(INITIAL_FILTERS);
  const [watchlistSort, setWatchlistSort] = useState<SortOption>('date_added_desc');
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Discover & Search API State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [searchParams, setSearchParams] = useState<AniListSearchParams>({
    page: 1,
    perPage: 24,
    sort: ['POPULARITY_DESC'],
  });
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // Modals & Dialog State
  const [detailModalItem, setDetailModalItem] = useState<{
    item: WatchlistItem | AniListMedia;
    isWatchlist: boolean;
  } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch Genres on mount
  useEffect(() => {
    let isMounted = true;
    fetchGenres()
      .then(genres => {
        if (isMounted) setAvailableGenres(genres);
      })
      .catch(err => console.error('Failed to load genres:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch AniList Discover/Search data
  const executeSearch = useCallback(
    async (params: AniListSearchParams) => {
      setIsSearching(true);
      setRateLimitError(null);
      try {
        const result = await searchAnime(params);
        setSearchResults(result);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message.includes('429')) {
            setRateLimitError(err.message);
            showToast('Rate limit hit on AniList API. Please wait a moment.', 'error');
          } else {
            setRateLimitError(err.message);
          }
        } else {
          setRateLimitError('Failed to fetch anime list.');
        }
      } finally {
        setIsSearching(false);
      }
    },
    [showToast]
  );

  // Sync debounced search to searchParams
  useEffect(() => {
    setSearchParams(prev => ({
      ...prev,
      search: debouncedSearch.trim() || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  // Trigger search when searchParams change or when switching to Discover tab
  useEffect(() => {
    if (activeTab === 'discover') {
      executeSearch(searchParams);
    }
  }, [searchParams, activeTab, executeSearch]);

  // Watchlist status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Watching: 0,
      Completed: 0,
      'Plan to Watch': 0,
      'On Hold': 0,
      Dropped: 0,
    };
    watchlist.forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });
    return counts;
  }, [watchlist]);

  // Filtered & Sorted Watchlist
  const filteredWatchlist = useMemo(() => {
    return watchlist
      .filter(item => {
        // Status filter
        if (watchlistFilters.status !== 'All' && item.status !== watchlistFilters.status) {
          return false;
        }

        // Text search
        if (watchlistFilters.searchQuery.trim()) {
          const q = watchlistFilters.searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchRomaji = item.title_romaji?.toLowerCase().includes(q);
          const matchEnglish = item.title_english?.toLowerCase().includes(q);
          const matchNotes = item.personal_notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchRomaji && !matchEnglish && !matchNotes) {
            return false;
          }
        }

        // Genre multi-select (all selected genres must be matched)
        if (watchlistFilters.genres.length > 0) {
          const itemGenres = item.genres || [];
          const hasAllGenres = watchlistFilters.genres.every(g => itemGenres.includes(g));
          if (!hasAllGenres) return false;
        }

        // Type filter (any selected type matched)
        if (watchlistFilters.types.length > 0) {
          const normalizedType = item.type.toUpperCase();
          const matched = watchlistFilters.types.some(t => normalizedType.includes(t.toUpperCase()));
          if (!matched) return false;
        }

        // Season
        if (watchlistFilters.season !== 'All') {
          if (item.season?.toUpperCase() !== watchlistFilters.season) {
            return false;
          }
        }

        // Min Year
        if (watchlistFilters.minYear !== '' && item.year) {
          if (item.year < Number(watchlistFilters.minYear)) return false;
        }

        // Max Year
        if (watchlistFilters.maxYear !== '' && item.year) {
          if (item.year > Number(watchlistFilters.maxYear)) return false;
        }

        // Min Personal Rating
        if (watchlistFilters.minRating !== '') {
          if (!item.personal_rating || item.personal_rating < Number(watchlistFilters.minRating)) {
            return false;
          }
        }

        // Min MAL / AniList Score
        if (watchlistFilters.minScore !== '') {
          if (!item.mal_score || item.mal_score < Number(watchlistFilters.minScore)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (watchlistSort) {
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          case 'date_added_asc':
            return new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
          case 'date_added_desc':
            return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
          case 'rating_asc':
            return (a.personal_rating || 0) - (b.personal_rating || 0);
          case 'rating_desc':
            return (b.personal_rating || 0) - (a.personal_rating || 0);
          case 'score_asc':
            return (a.mal_score || 0) - (b.mal_score || 0);
          case 'score_desc':
            return (b.mal_score || 0) - (a.mal_score || 0);
          case 'year_asc':
            return (a.year || 0) - (b.year || 0);
          case 'year_desc':
            return (b.year || 0) - (a.year || 0);
          case 'progress_asc': {
            const progA = a.total_episodes ? a.episodes_watched / a.total_episodes : 0;
            const progB = b.total_episodes ? b.episodes_watched / b.total_episodes : 0;
            return progA - progB;
          }
          case 'progress_desc': {
            const progA = a.total_episodes ? a.episodes_watched / a.total_episodes : 0;
            const progB = b.total_episodes ? b.episodes_watched / b.total_episodes : 0;
            return progB - progA;
          }
          default:
            return 0;
        }
      });
  }, [watchlist, watchlistFilters, watchlistSort]);

  const hasActiveFilters = Boolean(
    watchlistFilters.status !== 'All' ||
    watchlistFilters.searchQuery.trim() !== '' ||
    watchlistFilters.genres.length > 0 ||
    watchlistFilters.types.length > 0 ||
    watchlistFilters.season !== 'All' ||
    watchlistFilters.minYear !== '' ||
    watchlistFilters.maxYear !== '' ||
    watchlistFilters.minRating !== '' ||
    watchlistFilters.minScore !== ''
  );

  const clearAllFilters = () => {
    setWatchlistFilters(INITIAL_FILTERS);
  };

  // Quick add from Discover page
  const handleQuickAdd = (media: AniListMedia, status: WatchStatus) => {
    const title = media.title.english || media.title.romaji || 'Untitled Anime';
    addToWatchlist({
      id: String(media.id),
      anilist_id: media.id,
      mal_id: media.idMal || media.id,
      title,
      title_english: media.title.english || undefined,
      title_romaji: media.title.romaji || undefined,
      image: media.coverImage.large || '',
      type: media.format?.replace('_', ' ') || 'TV',
      total_episodes: media.episodes,
      year: media.seasonYear,
      season: media.season,
      genres: media.genres,
      mal_score: formatScoreTo10(media.averageScore),
      status,
      episodes_watched: status === 'Completed' && media.episodes ? media.episodes : 0,
      personal_rating: null,
      personal_notes: '',
    });
    showToast(`Added "${title}" to your ${status} list!`, 'success');
  };

  // Open anime detail modal
  const handleOpenDetails = (item: WatchlistItem | AniListMedia) => {
    const isWatchlistItem = 'episodes_watched' in item;
    if (isWatchlistItem) {
      setDetailModalItem({ item, isWatchlist: true });
    } else {
      // Check if this AniList item is already saved
      const saved = getWatchlistItem(item.id);
      if (saved) {
        setDetailModalItem({ item: saved, isWatchlist: true });
      } else {
        setDetailModalItem({ item, isWatchlist: false });
      }
    }
  };

  // Deletion confirm
  const handleRequestRemove = (id: string, title: string) => {
    setDeleteConfirmTarget({ id, title });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmTarget) {
      removeFromWatchlist(deleteConfirmTarget.id);
      showToast(`Removed "${deleteConfirmTarget.title}" from watchlist.`, 'info');
      setDeleteConfirmTarget(null);
    }
  };

  // Seed sample anime for new users
  const handleSeedSamples = () => {
    const samples = [
      {
        id: '154587',
        anilist_id: 154587,
        mal_id: 52991,
        title: 'Frieren: Beyond Journey\'s End',
        title_romaji: 'Sousou no Frieren',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1HJZ2CnvEgn.jpg',
        type: 'TV',
        total_episodes: 28,
        year: 2023,
        season: 'FALL',
        genres: ['Adventure', 'Drama', 'Fantasy'],
        mal_score: 9.3,
        status: 'Completed' as WatchStatus,
        episodes_watched: 28,
        personal_rating: 10,
        personal_notes: 'Masterpiece pacing, incredible score, and beautiful reflections on time.',
        date_added: new Date().toISOString(),
      },
      {
        id: '16498',
        anilist_id: 16498,
        mal_id: 16498,
        title: 'Attack on Titan',
        title_romaji: 'Shingeki no Kyojin',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiDY.png',
        type: 'TV',
        total_episodes: 25,
        year: 2013,
        season: 'SPRING',
        genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
        mal_score: 8.5,
        status: 'Completed' as WatchStatus,
        episodes_watched: 25,
        personal_rating: 9,
        personal_notes: 'Phenomenal mystery and high stakes.',
        date_added: new Date().toISOString(),
      },
      {
        id: '113415',
        anilist_id: 113415,
        mal_id: 40748,
        title: 'Jujutsu Kaisen',
        title_romaji: 'Jujutsu Kaisen',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pTvEB8.png',
        type: 'TV',
        total_episodes: 24,
        year: 2020,
        season: 'FALL',
        genres: ['Action', 'Fantasy', 'Supernatural'],
        mal_score: 8.6,
        status: 'Watching' as WatchStatus,
        episodes_watched: 18,
        personal_rating: 8,
        personal_notes: 'Animation quality is out of this world.',
        date_added: new Date().toISOString(),
      },
      {
        id: '142838',
        anilist_id: 142838,
        mal_id: 51105,
        title: 'The Apothecary Diaries',
        title_romaji: 'Kusuriya no Hitorigoto',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-8YxM9YgXGg9K.jpg',
        type: 'TV',
        total_episodes: 24,
        year: 2023,
        season: 'FALL',
        genres: ['Drama', 'Mystery'],
        mal_score: 8.7,
        status: 'Plan to Watch' as WatchStatus,
        episodes_watched: 0,
        personal_rating: null,
        personal_notes: 'Heard Maomao is one of the best protagonists.',
        date_added: new Date().toISOString(),
      },
    ];

    samples.forEach(s => addToWatchlist(s));
    showToast('Loaded 4 starter anime into your watchlist!', 'success');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div>
            {/* Stats Bar */}
            <StatsBar
              watchlist={watchlist}
              activeStatusFilter={watchlistFilters.status}
              onSelectStatus={st => setWatchlistFilters(prev => ({ ...prev, status: st }))}
            />

            {/* Layout with Collapsible Sidebar on Desktop & Grid */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Filter Sidebar & Status Tabs */}
              <div className="w-full lg:w-auto shrink-0">
                <WatchlistFilters
                  filters={watchlistFilters}
                  setFilters={setWatchlistFilters}
                  sortOption={watchlistSort}
                  setSortOption={setWatchlistSort}
                  availableGenres={availableGenres}
                  statusCounts={statusCounts}
                  totalCount={watchlist.length}
                  isOpenMobile={isMobileDrawerOpen}
                  setIsOpenMobile={setIsMobileDrawerOpen}
                  isDesktopCollapsed={isDesktopSidebarCollapsed}
                  setIsDesktopCollapsed={setIsDesktopSidebarCollapsed}
                  onClearFilters={clearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>

              {/* Watchlist Anime Cards Grid */}
              <div className="flex-1 w-full min-w-0">
                {/* Mobile & Tablet Filter Trigger Bar */}
                <div className="flex lg:hidden items-center justify-between pb-4 mb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Showing <strong className="text-zinc-900 dark:text-zinc-100">{filteredWatchlist.length}</strong> anime
                  </div>

                  <button
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                </div>

                {/* Empty State: Whole watchlist empty */}
                {watchlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 my-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      Your watchlist is currently empty
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-1 mb-6 leading-relaxed">
                      Search the AniList catalog to track your progress, score your favorite shows, and keep personalized notes.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs sm:text-sm hover:bg-indigo-500 transition-colors shadow-xs"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Discover Anime</span>
                      </button>
                      <button
                        onClick={handleSeedSamples}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium text-xs sm:text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Load Sample Anime</span>
                      </button>
                    </div>
                  </div>
                ) : filteredWatchlist.length === 0 ? (
                  /* Empty State: Filters returned 0 items */
                  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 my-6">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      No matching anime found
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                      Try adjusting or clearing your filters to see more results.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  /* Grid: 2 columns mobile, 4-5 desktop */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                    {filteredWatchlist.map(item => (
                      <AnimeCard
                        key={item.id}
                        watchlistItem={item}
                        onOpenDetails={handleOpenDetails}
                        onIncrementEpisode={incrementEpisode}
                        onDecrementEpisode={decrementEpisode}
                        onRequestRemove={handleRequestRemove}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DISCOVER & SEARCH */}
        {activeTab === 'discover' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-['Space_Grotesk']">
                Discover & Search Anime
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Explore trending anime or search AniList database with live memory caching.
              </p>
            </div>

            {/* Search bar & query controls */}
            <SearchBar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              availableGenres={availableGenres}
              isLoading={isSearching}
              rateLimitError={rateLimitError}
              onRetry={() => executeSearch(searchParams)}
            />

            {/* Results Grid */}
            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))}
              </div>
            ) : searchResults?.media && searchResults.media.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                {searchResults.media.map(media => {
                  const isSaved = isInWatchlist(media.id);
                  return (
                    <AnimeCard
                      key={media.id}
                      discoverItem={media}
                      isSaved={isSaved}
                      onOpenDetails={handleOpenDetails}
                      onQuickAdd={handleQuickAdd}
                    />
                  );
                })}
              </div>
            ) : (
              !rateLimitError && (
                <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
                  <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No anime results found for your query.</p>
                  <p className="text-xs text-zinc-400 mt-1">Try another title, genre, or format filter.</p>
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">KuroAnime</span>
            <span>·</span>
            <span>Powered by AniList GraphQL API</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Client-side local storage</span>
            <span>·</span>
            <span>Zero trackers</span>
          </div>
        </div>
      </footer>

      {/* Detail & Edit Modal */}
      {detailModalItem && (
        <AnimeDetailModal
          item={detailModalItem.item}
          isWatchlistItem={detailModalItem.isWatchlist}
          onClose={() => setDetailModalItem(null)}
          onSaveToWatchlist={item => {
            addToWatchlist(item);
            showToast(`Saved "${item.title}" to watchlist!`, 'success');
          }}
          onUpdateWatchlistItem={(id, updates) => {
            updateWatchlistItem(id, updates);
            showToast('Watchlist entry updated.', 'success');
          }}
          onRequestRemove={handleRequestRemove}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmTarget)}
        title="Remove from Watchlist"
        message={`Are you sure you want to remove "${deleteConfirmTarget?.title}" from your watchlist? Your personal rating and notes will be deleted.`}
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmTarget(null)}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        watchlistCount={watchlist.length}
        onExport={exportWatchlist}
        onImport={importWatchlist}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
