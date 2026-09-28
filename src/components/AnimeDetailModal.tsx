import React, { useState, useEffect } from 'react';
import { WatchlistItem, WatchStatus, AniListMedia } from '../types/anime';
import { getDisplayTitle, formatScoreTo10 } from '../services/anilist';
import { X, Star, Plus, Minus, Trash2, Calendar, Film, Bookmark, ExternalLink } from 'lucide-react';

interface AnimeDetailModalProps {
  item: WatchlistItem | AniListMedia | null;
  onClose: () => void;
  isWatchlistItem: boolean;
  onSaveToWatchlist: (item: Partial<WatchlistItem> & { id: string; title: string; image: string }) => void;
  onUpdateWatchlistItem?: (id: string, updates: Partial<WatchlistItem>) => void;
  onRequestRemove?: (id: string, title: string) => void;
}

const STATUS_OPTIONS: WatchStatus[] = ['Watching', 'Completed', 'Plan to Watch', 'On Hold', 'Dropped'];

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  item,
  onClose,
  isWatchlistItem,
  onSaveToWatchlist,
  onUpdateWatchlistItem,
  onRequestRemove,
}) => {
  if (!item) return null;

  // Extract base anime info
  const watchlistItem = isWatchlistItem ? (item as WatchlistItem) : null;
  const discoverItem = !isWatchlistItem ? (item as AniListMedia) : null;

  const anilistId = watchlistItem ? watchlistItem.anilist_id : discoverItem!.id;
  const malId = watchlistItem ? watchlistItem.mal_id : (discoverItem?.idMal || discoverItem?.id || 0);
  const title = watchlistItem ? watchlistItem.title : getDisplayTitle(discoverItem!.title);
  const englishTitle = watchlistItem ? watchlistItem.title_english : discoverItem?.title?.english;
  const romajiTitle = watchlistItem ? watchlistItem.title_romaji : discoverItem?.title?.romaji;
  const imageUrl = watchlistItem ? watchlistItem.image : (discoverItem?.coverImage?.large || '');
  const format = watchlistItem ? watchlistItem.type : (discoverItem?.format?.replace('_', ' ') || 'TV');
  const totalEpisodes = watchlistItem ? watchlistItem.total_episodes : (discoverItem?.episodes ?? null);
  const year = watchlistItem ? watchlistItem.year : (discoverItem?.seasonYear ?? null);
  const season = watchlistItem ? watchlistItem.season : (discoverItem?.season ?? null);
  const genres = watchlistItem ? watchlistItem.genres : (discoverItem?.genres || []);
  const malScore = watchlistItem ? watchlistItem.mal_score : formatScoreTo10(discoverItem?.averageScore);
  const description = discoverItem?.description?.replace(/<[^>]*>?/gm, ''); // strip HTML tags from AniList

  // Editable state
  const [status, setStatus] = useState<WatchStatus>(watchlistItem?.status || 'Plan to Watch');
  const [episodesWatched, setEpisodesWatched] = useState<number>(watchlistItem?.episodes_watched || 0);
  const [personalRating, setPersonalRating] = useState<number | null>(watchlistItem?.personal_rating ?? null);
  const [personalNotes, setPersonalNotes] = useState<string>(watchlistItem?.personal_notes || '');

  // Reset state when item changes
  useEffect(() => {
    setStatus(watchlistItem?.status || 'Plan to Watch');
    setEpisodesWatched(watchlistItem?.episodes_watched || 0);
    setPersonalRating(watchlistItem?.personal_rating ?? null);
    setPersonalNotes(watchlistItem?.personal_notes || '');
  }, [watchlistItem]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleEpisodeChange = (newVal: number) => {
    const clamped = Math.max(0, newVal);
    const valid = totalEpisodes ? Math.min(totalEpisodes, clamped) : clamped;
    setEpisodesWatched(valid);

    // Auto-complete check
    if (totalEpisodes && valid >= totalEpisodes && status !== 'Completed') {
      setStatus('Completed');
    }
  };

  const handleSave = () => {
    const baseId = watchlistItem?.id || String(anilistId);

    const payload = {
      id: baseId,
      anilist_id: anilistId,
      mal_id: malId,
      title,
      title_english: englishTitle || undefined,
      title_romaji: romajiTitle || undefined,
      image: imageUrl,
      type: format,
      total_episodes: totalEpisodes,
      year,
      season,
      genres,
      mal_score: malScore,
      status,
      episodes_watched: episodesWatched,
      personal_rating: personalRating,
      personal_notes: personalNotes,
    };

    if (isWatchlistItem && onUpdateWatchlistItem) {
      onUpdateWatchlistItem(baseId, payload);
    } else {
      onSaveToWatchlist(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
              {isWatchlistItem ? 'Edit Watchlist Entry' : 'Anime Details & Add'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Anime Presentation */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Poster Thumbnail */}
            <div className="w-32 sm:w-36 shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 self-center sm:self-start shadow-xs">
              <img
                src={imageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Column */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {title}
                </h2>
                {romajiTitle && romajiTitle !== title && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {romajiTitle}
                  </p>
                )}

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{format}</span>
                  <span>·</span>
                  <span>{year || 'Year N/A'}</span>
                  {season && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{season.toLowerCase()}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="font-mono tabular-nums">{totalEpisodes ? `${totalEpisodes} eps` : 'Unknown eps'}</span>
                </div>

                {/* Score */}
                {malScore !== null && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{malScore.toFixed(1)} AniList Score</span>
                    </div>
                  </div>
                )}

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {genres.map(g => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AniList External link */}
              <div className="mt-3 pt-2 flex items-center gap-3">
                <a
                  href={`https://anilist.co/anime/${anilistId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>View on AniList</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {malId > 0 && (
                  <a
                    href={`https://myanimelist.net/anime/${malId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline"
                  >
                    <span>MyAnimeList</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description / Synopsis if present */}
          {description && (
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-h-36 overflow-y-auto">
              {description}
            </div>
          )}

          {/* User Watchlist Controls Section */}
          <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Watchlist Settings
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Watch Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {STATUS_OPTIONS.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      status === st
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Watched Stepper & Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Episodes Watched
                </label>
                <span className="text-xs text-zinc-500 font-mono tabular-nums">
                  {totalEpisodes ? `${episodesWatched} of ${totalEpisodes} watched` : `${episodesWatched} episodes watched`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleEpisodeChange(episodesWatched - 1)}
                  disabled={episodesWatched <= 0}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="0"
                  max={totalEpisodes || 9999}
                  value={episodesWatched}
                  onChange={e => handleEpisodeChange(Number(e.target.value))}
                  className="w-24 text-center py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={() => handleEpisodeChange(episodesWatched + 1)}
                  disabled={Boolean(totalEpisodes && episodesWatched >= totalEpisodes)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {totalEpisodes && (
                  <button
                    type="button"
                    onClick={() => handleEpisodeChange(totalEpisodes)}
                    className="ml-auto text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                  >
                    Set Max ({totalEpisodes})
                  </button>
                )}
              </div>
            </div>

            {/* Personal Rating (1 - 10) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Personal Rating (1–10)
                </label>
                {personalRating !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                      ★ {personalRating} / 10
                    </span>
                    <button
                      type="button"
                      onClick={() => setPersonalRating(null)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 italic">Not rated yet</span>
                )}
              </div>

              {/* 1-10 rating selector buttons */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scoreNum => (
                  <button
                    key={scoreNum}
                    type="button"
                    onClick={() => setPersonalRating(scoreNum)}
                    className={`py-1.5 rounded-md font-mono text-xs font-bold transition-all ${
                      personalRating === scoreNum
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    {scoreNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Personal Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add thoughts, favorite arc, viewing date, or reminders..."
                value={personalNotes}
                onChange={e => setPersonalNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Date added if exists */}
            {watchlistItem?.date_added && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Added on {new Date(watchlistItem.date_added).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
          <div>
            {isWatchlistItem && onRequestRemove && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestRemove(watchlistItem!.id, title);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from List</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs transition-colors"
            >
              {isWatchlistItem ? 'Save Changes' : 'Add to Watchlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
