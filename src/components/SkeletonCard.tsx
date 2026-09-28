import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse">
      {/* Cover image placeholder */}
      <div className="w-full aspect-[3/4] bg-zinc-200 dark:bg-zinc-800" />

      {/* Content placeholder */}
      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800/80 rounded w-1/2" />

        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 ml-auto" />
        </div>
      </div>
    </div>
  );
};
