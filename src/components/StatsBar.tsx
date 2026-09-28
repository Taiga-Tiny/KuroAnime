import React from 'react';
import { WatchlistItem, WatchStatus } from '../types/anime';
import { Film, CheckCircle2, PlayCircle, Clock, PauseCircle, XCircle, Star, Tv } from 'lucide-react';

interface StatsBarProps {
  watchlist: WatchlistItem[];
  activeStatusFilter: 'All' | WatchStatus;
  onSelectStatus: (status: 'All' | WatchStatus) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  watchlist,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const totalAnime = watchlist.length;

  const counts: Record<WatchStatus, number> = {
    Watching: 0,
    Completed: 0,
    'Plan to Watch': 0,
    'On Hold': 0,
    Dropped: 0,
  };

  let totalEpisodesWatched = 0;
  let ratingSum = 0;
  let ratedCount = 0;

  watchlist.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
    totalEpisodesWatched += item.episodes_watched || 0;
    if (item.personal_rating && item.personal_rating > 0) {
      ratingSum += item.personal_rating;
      ratedCount++;
    }
  });

  const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {/* Total Anime */}
        <button
          onClick={() => onSelectStatus('All')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'All'
              ? 'border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Anime</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {totalAnime}
          </div>
        </button>

        {/* Watching */}
        <button
          onClick={() => onSelectStatus('Watching')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'Watching'
              ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Watching</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {counts.Watching}
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => onSelectStatus('Completed')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'Completed'
              ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {counts.Completed}
          </div>
        </button>

        {/* Plan to Watch */}
        <button
          onClick={() => onSelectStatus('Plan to Watch')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'Plan to Watch'
              ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Plan to Watch</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {counts['Plan to Watch']}
          </div>
        </button>

        {/* On Hold */}
        <button
          onClick={() => onSelectStatus('On Hold')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'On Hold'
              ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <PauseCircle className="w-3.5 h-3.5" />
            <span>On Hold</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {counts['On Hold']}
          </div>
        </button>

        {/* Dropped */}
        <button
          onClick={() => onSelectStatus('Dropped')}
          className={`text-left p-2.5 rounded-lg border transition-all ${
            activeStatusFilter === 'Dropped'
              ? 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            <span>Dropped</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {counts.Dropped}
          </div>
        </button>

        {/* Total Episodes Watched */}
        <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Tv className="w-3.5 h-3.5 text-cyan-500" />
            <span>Episodes Watched</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {totalEpisodesWatched.toLocaleString()}
          </div>
        </div>

        {/* Avg Personal Rating */}
        <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Avg Rating</span>
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {avgRating ? `${avgRating}` : '—'}
            {avgRating && <span className="text-xs font-normal text-zinc-500"> / 10</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
