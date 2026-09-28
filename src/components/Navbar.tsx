import React from 'react';
import { Sun, Moon, Download, Sparkles, Bookmark, Compass } from 'lucide-react';

interface NavbarProps {
  activeTab: 'watchlist' | 'discover';
  setActiveTab: (tab: 'watchlist' | 'discover') => void;
  watchlistCount: number;
  onOpenImportExport: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
  onOpenImportExport,
  isDark,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark with subtle accent dot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-['Space_Grotesk']">
              KuroAnime
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'watchlist'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 font-mono tabular-nums font-semibold">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover & Search</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Backup/Export + Theme Toggle) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Import or Export Watchlist JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Backup & Sync</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
