import { useState, useEffect, useCallback } from 'react';
import { WatchlistItem, WatchStatus } from '../types/anime';

const STORAGE_KEY = 'kuro_anime_watchlist_v1';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Validate items shape
        return parsed.filter((item): item is WatchlistItem => 
          item && typeof item === 'object' && typeof item.id === 'string' && typeof item.title === 'string'
        );
      }
      return [];
    } catch (e) {
      console.error('Failed to parse watchlist from localStorage:', e);
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to write watchlist to localStorage:', e);
    }
  }, [watchlist]);

  const isInWatchlist = useCallback((idOrMalId: number): boolean => {
    return watchlist.some(item => item.anilist_id === idOrMalId || item.mal_id === idOrMalId);
  }, [watchlist]);

  const getWatchlistItem = useCallback((idOrMalId: number): WatchlistItem | undefined => {
    return watchlist.find(item => item.anilist_id === idOrMalId || item.mal_id === idOrMalId);
  }, [watchlist]);

  const addToWatchlist = useCallback((item: Partial<WatchlistItem> & { id: string; title: string; image: string }) => {
    setWatchlist(prev => {
      // Check if already exists
      const existingIndex = prev.findIndex(i => 
        i.id === item.id || 
        (item.anilist_id && i.anilist_id === item.anilist_id) || 
        (item.mal_id && i.mal_id === item.mal_id)
      );

      const newItem: WatchlistItem = {
        id: item.id || String(item.anilist_id || item.mal_id || Date.now()),
        mal_id: item.mal_id || item.anilist_id || 0,
        anilist_id: item.anilist_id || item.mal_id || 0,
        title: item.title,
        title_romaji: item.title_romaji,
        title_english: item.title_english,
        image: item.image,
        type: item.type || 'TV',
        total_episodes: item.total_episodes ?? null,
        year: item.year ?? null,
        season: item.season ?? null,
        genres: Array.isArray(item.genres) ? item.genres : [],
        mal_score: item.mal_score ?? null,
        status: (item.status as WatchStatus) || 'Plan to Watch',
        episodes_watched: Math.max(0, item.episodes_watched || 0),
        personal_rating: item.personal_rating ?? null,
        personal_notes: item.personal_notes || '',
        date_added: item.date_added || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newItem, updated_at: new Date().toISOString() };
        return updated;
      }

      return [newItem, ...prev];
    });
  }, []);

  const updateWatchlistItem = useCallback((id: string, updates: Partial<WatchlistItem>) => {
    setWatchlist(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated: WatchlistItem = {
          ...item,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // If watched episodes changed, check auto-completion
        if (
          updates.episodes_watched !== undefined &&
          item.total_episodes &&
          item.total_episodes > 0 &&
          updates.episodes_watched >= item.total_episodes &&
          updated.status !== 'Completed' &&
          updates.status === undefined
        ) {
          updated.status = 'Completed';
        }

        return updated;
      })
    );
  }, []);

  const incrementEpisode = useCallback((id: string) => {
    setWatchlist(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const maxEpisodes = item.total_episodes ?? Infinity;
        if (item.episodes_watched >= maxEpisodes) return item;

        const nextWatched = item.episodes_watched + 1;
        const autoCompleted = item.total_episodes && nextWatched >= item.total_episodes;

        return {
          ...item,
          episodes_watched: nextWatched,
          status: autoCompleted ? 'Completed' : (item.status === 'Plan to Watch' ? 'Watching' : item.status),
          updated_at: new Date().toISOString(),
        };
      })
    );
  }, []);

  const decrementEpisode = useCallback((id: string) => {
    setWatchlist(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        if (item.episodes_watched <= 0) return item;

        const nextWatched = item.episodes_watched - 1;
        let newStatus = item.status;
        if (item.status === 'Completed' && item.total_episodes && nextWatched < item.total_episodes) {
          newStatus = 'Watching';
        }

        return {
          ...item,
          episodes_watched: nextWatched,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      })
    );
  }, []);

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  }, []);

  const exportWatchlist = useCallback(() => {
    try {
      const dataStr = JSON.stringify(watchlist, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `kuroanime_watchlist_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exporting watchlist:', e);
    }
  }, [watchlist]);

  const importWatchlist = useCallback((importedData: unknown): { success: boolean; added: number; updated: number; message: string } => {
    if (!Array.isArray(importedData)) {
      return { success: false, added: 0, updated: 0, message: 'Invalid JSON format: expected a list of anime items.' };
    }

    let addedCount = 0;
    let updatedCount = 0;

    setWatchlist(prev => {
      const currentMap = new Map<string, WatchlistItem>();
      // index by anilist_id, mal_id, and id
      prev.forEach(item => {
        currentMap.set(String(item.id), item);
        if (item.anilist_id) currentMap.set(`ani_${item.anilist_id}`, item);
        if (item.mal_id) currentMap.set(`mal_${item.mal_id}`, item);
      });

      const nextList = [...prev];

      importedData.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const item = raw as Partial<WatchlistItem>;
        if (!item.title) return;

        const anilistId = Number(item.anilist_id) || Number(item.mal_id) || 0;
        const malId = Number(item.mal_id) || anilistId || 0;
        const id = String(item.id || anilistId || malId || Math.random().toString(36).substring(2, 9));

        const existing = currentMap.get(id) || 
          (anilistId ? currentMap.get(`ani_${anilistId}`) : undefined) ||
          (malId ? currentMap.get(`mal_${malId}`) : undefined);

        const validStatuses: WatchStatus[] = ['Watching', 'Completed', 'Plan to Watch', 'On Hold', 'Dropped'];
        const validatedStatus = validStatuses.includes(item.status as WatchStatus) 
          ? (item.status as WatchStatus) 
          : 'Plan to Watch';

        const sanitizedItem: WatchlistItem = {
          id: existing ? existing.id : id,
          mal_id: malId,
          anilist_id: anilistId,
          title: String(item.title),
          title_romaji: item.title_romaji ? String(item.title_romaji) : undefined,
          title_english: item.title_english ? String(item.title_english) : undefined,
          image: String(item.image || ''),
          type: String(item.type || 'TV'),
          total_episodes: item.total_episodes !== undefined && item.total_episodes !== null ? Number(item.total_episodes) : null,
          year: item.year ? Number(item.year) : null,
          season: item.season ? String(item.season) : null,
          genres: Array.isArray(item.genres) ? item.genres.map(String) : [],
          mal_score: item.mal_score !== undefined && item.mal_score !== null ? Number(item.mal_score) : null,
          status: validatedStatus,
          episodes_watched: Math.max(0, Number(item.episodes_watched) || 0),
          personal_rating: item.personal_rating ? Math.min(10, Math.max(1, Number(item.personal_rating))) : null,
          personal_notes: item.personal_notes ? String(item.personal_notes) : '',
          date_added: item.date_added ? String(item.date_added) : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          const index = nextList.findIndex(i => i.id === existing.id);
          if (index !== -1) {
            nextList[index] = { ...existing, ...sanitizedItem };
            updatedCount++;
          }
        } else {
          nextList.push(sanitizedItem);
          currentMap.set(sanitizedItem.id, sanitizedItem);
          if (sanitizedItem.anilist_id) currentMap.set(`ani_${sanitizedItem.anilist_id}`, sanitizedItem);
          if (sanitizedItem.mal_id) currentMap.set(`mal_${sanitizedItem.mal_id}`, sanitizedItem);
          addedCount++;
        }
      });

      return nextList;
    });

    return {
      success: true,
      added: addedCount,
      updated: updatedCount,
      message: `Successfully imported! Added ${addedCount} new anime and updated ${updatedCount} existing entries.`,
    };
  }, []);

  return {
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
  };
}
