import React, { useState } from 'react';
import { WatchlistItem, WatchStatus, AniListMedia } from '../types/anime';
import { getDisplayTitle, formatScoreTo10 } from '../services/anilist';
import { Star, Plus, Minus, Check, MoreVertical, Edit3, Trash2, Film, CheckCircle2 } from 'lucide-react';

interface AnimeCardProps {
  // If item is in watchlist
  watchlistItem?: WatchlistItem;
  // If rendering from search/discover result
  discoverItem?: AniListMedia;
  isSaved?: boolean;
  onOpenDetails: (item: WatchlistItem | AniListMedia) => void;
  onQuickAdd?: (media: AniListMedia, status: WatchStatus) => void;
  onIncrementEpisode?: (id: string) => void;
  onDecrementEpisode?: (id: string) => void;
  onRequestRemove?: (id: string, title: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  watchlistItem,
  discoverItem,
  isSaved = false,
  onOpenDetails,
  onQuickAdd,
  onIncrementEpisode,
  onDecrementEpisode,
  onRequestRemove,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Extract shared fields
  const title = watchlistItem
    ? watchlistItem.title
    : discoverItem
    ? getDisplayTitle(discoverItem.title)
    : 'Unknown Anime';

  const secondaryTitle = watchlistItem
    ? (watchlistItem.title_romaji !== watchlistItem.title ? watchlistItem.title_romaji : undefined)
    : (discoverItem?.title.romaji !== title ? discoverItem?.title.romaji : undefined);

  const imageUrl = watchlistItem
    ? watchlistItem.image
    : discoverItem?.coverImage?.large || '';

  const format = watchlistItem
    ? watchlistItem.type
    : (discoverItem?.format?.replace('_', ' ') || 'TV');

  const totalEpisodes = watchlistItem
    ? watchlistItem.total_episodes
    : discoverItem?.episodes ?? null;

  const score = watchlistItem
    ? watchlistItem.mal_score
    : formatScoreTo10(discoverItem?.averageScore);

  const year = watchlistItem
    ? watchlistItem.year
    : discoverItem?.seasonYear ?? null;

  const genres = watchlistItem
    ? watchlistItem.genres
    : (discoverItem?.genres || []);

  // Watchlist specific values
  const watched = watchlistItem?.episodes_watched ?? 0;
  const status = watchlistItem?.status;
  const personalRating = watchlistItem?.personal_rating;

  const progressPercent = totalEpisodes && totalEpisodes > 0
    ? Math.min(100, Math.round((watched / totalEpisodes) * 100))
    : null;

  const getStatusColor = (s?: WatchStatus) => {
    switch (s) {
      case 'Watching':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Completed':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Plan to Watch':
        return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'On Hold':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Dropped':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
      {/* Cover Image Container */}
      <div 
        onClick={() => onOpenDetails(watchlistItem || discoverItem!)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
      >
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-zinc-400 bg-zinc-800">
            <Film className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs line-clamp-2">{title}</span>
          </div>
        )}

        {/* Gradient Scrim for readable badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {score !== null && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-300 font-mono text-xs font-semibold tabular-nums shadow-xs">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>{score.toFixed(1)}</span>
            </div>
          )}

          {/* Watch status label if in watchlist */}
          {status && (
            <div className={`px-2 py-0.5 rounded-md text-[11px] font-medium border backdrop-blur-md ${getStatusColor(status)}`}>
              {status}
            </div>
          )}
        </div>

        {/* Bottom Image Overlay Details */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-medium">
            <span>{format}</span>
            {year && (
              <>
                <span>·</span>
                <span>{year}</span>
              </>
            )}
            {totalEpisodes && (
              <>
                <span>·</span>
                <span className="font-mono tabular-nums">{totalEpisodes} eps</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (Watchlist mode) */}
      {watchlistItem && (
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === 'Completed'
                ? 'bg-emerald-500'
                : 'bg-indigo-600 dark:bg-indigo-500'
            }`}
            style={{ width: `${progressPercent !== null ? progressPercent : (watched > 0 ? 100 : 0)}%` }}
          />
        </div>
      )}

      {/* Card Body */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title */}
        <h3
          onClick={() => onOpenDetails(watchlistItem || discoverItem!)}
          className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
          title={title}
        >
          {title}
        </h3>

        {/* Secondary Title (Romaji or clean metadata) */}
        {secondaryTitle ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
            {secondaryTitle}
          </p>
        ) : (
          genres.length > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
              {genres.slice(0, 2).join(' · ')}
            </p>
          )
        )}

        {/* Watchlist Mode Controls */}
        {watchlistItem ? (
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2">
            {/* Episode Counter & +/- Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span>Ep</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {watched}
                </span>
                <span>/</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {totalEpisodes ?? '?'}
                </span>
              </div>

              {/* + and - stepper buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDecrementEpisode && onDecrementEpisode(watchlistItem.id)}
                  disabled={watched <= 0}
                  aria-label="Decrement episode"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onIncrementEpisode && onIncrementEpisode(watchlistItem.id)}
                  disabled={Boolean(totalEpisodes && watched >= totalEpisodes)}
                  aria-label="Increment episode"
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom row: Personal Rating & Action buttons */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              <div>
                {personalRating ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono tabular-nums">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {personalRating}/10
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Unrated</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenDetails(watchlistItem)}
                  title="Edit details & notes"
                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRequestRemove && onRequestRemove(watchlistItem.id, title)}
                  title="Remove from watchlist"
                  className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Discover / Search Mode Actions */
          <div className="mt-auto pt-3">
            {isSaved ? (
              <button
                onClick={() => onOpenDetails(discoverItem!)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Watchlist</span>
              </button>
            ) : (
              <div className="relative">
                <div className="flex items-center rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 overflow-hidden text-xs">
                  <button
                    onClick={() => onQuickAdd && onQuickAdd(discoverItem!, 'Plan to Watch')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to List</span>
                  </button>

                  <button
                    onClick={() => setShowStatusMenu(prev => !prev)}
                    className="px-2 py-1.5 border-l border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                    title="Choose initial status"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dropdown status selector */}
                {showStatusMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowStatusMenu(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-30 text-xs">
                      {(['Watching', 'Plan to Watch', 'Completed', 'On Hold'] as WatchStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => {
                            setShowStatusMenu(false);
                            onQuickAdd && onQuickAdd(discoverItem!, st);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
                        >
                          <span>{st}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
