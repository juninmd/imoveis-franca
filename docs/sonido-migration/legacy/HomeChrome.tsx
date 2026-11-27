// Trechos literais de origin/master:client/src/Home.tsx, usados só no
// comparativo visual. Só o import de ícones foi mantido igual ao original.
import { Heart, Sun, Moon, LayoutGrid, List, FilterX, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export function LegacyClearFilters({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={() => undefined}
      disabled={count === 0}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
    >
      <FilterX size={16} />
      Limpar Filtros ({count})
    </button>
  );
}

export function LegacyFavoritesButton({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={() => undefined}
      aria-pressed={false}
      className="p-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border shadow-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
      title="Mostrar apenas favoritos"
    >
      <Heart size={18} />
      <span>Favoritos ({count})</span>
    </button>
  );
}

export function LegacyDarkToggle({ dark }: { dark: boolean }) {
  return (
    <button
      type="button"
      onClick={() => undefined}
      title={dark ? 'Modo Claro' : 'Modo Escuro'}
      className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export function LegacyViewToggle({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => undefined}
        className={clsx(
          'p-1.5 rounded-md transition-all',
          viewMode === 'grid'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400',
        )}
        title="Visualização em Grade"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        type="button"
        onClick={() => undefined}
        className={clsx(
          'p-1.5 rounded-md transition-all',
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400',
        )}
        title="Visualização em Lista"
      >
        <List size={18} />
      </button>
    </div>
  );
}

export function LegacyLoading() {
  return (
    <span className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-medium">
      <Loader2 size={20} className="animate-spin" />
      Buscando imóveis...
    </span>
  );
}

export function LegacyFilterSkeleton() {
  return (
    <div className="p-5 space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3 pb-6 border-b border-gray-100/50 dark:border-gray-700/50">
          <div className="h-4 bg-gray-200/70 dark:bg-gray-700/70 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-gray-200/70 dark:bg-gray-700/70 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-200/70 dark:bg-gray-700/70 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
