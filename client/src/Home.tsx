import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchImoveis } from './api';
import { PropertyCard } from './components/PropertyCard';
import { PropertyCardSkeleton } from './components/PropertyCardSkeleton';
import { EmptyState } from './components/EmptyState';
import { ScrollToTop } from './components/ScrollToTop';
import { Menu, X, Moon, Sun, Heart, FilterX, Search, Home as HomeIcon, ArrowUpDown, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from './components/ToastContext';
import { VirtuosoGrid } from 'react-virtuoso';

const FilterSidebar = React.lazy(() => import('./components/FilterSidebar').then(module => ({ default: module.FilterSidebar })));

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, children, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    style={style}
    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8"
  >
    {children}
  </div>
));

const ItemContainer = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className="h-full">
    {children}
  </div>
);

export const Home = () => {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    minBathrooms: '',
    minVacancies: '',
    minArea: '',
    maxArea: '',
    minAreaTotal: '',
    maxAreaTotal: '',
    address: [] as string[],
  });

  const { addToast } = useToast();
  const debouncedFilters = useDebounce(filters, 500);

  const [sortOrder, setSortOrder] = useState('price_asc');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' ||
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (link: string) => {
    const isAdding = !favorites.includes(link);
    setFavorites(prev =>
      prev.includes(link) ? prev.filter(l => l !== link) : [...prev, link]
    );
    addToast(
      isAdding ? 'Imóvel salvo nos favoritos!' : 'Imóvel removido dos favoritos.',
      isAdding ? 'success' : 'info'
    );
  };

  const { data: imoveis, isLoading, isError } = useQuery({
    queryKey: ['imoveis', debouncedFilters],
    queryFn: () => fetchImoveis(debouncedFilters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract unique addresses for the filter
  const allAddresses = useMemo(() => imoveis
    ? Array.from(new Set(imoveis.map((i) => i.endereco).filter(Boolean)))
    : [], [imoveis]);

  const sortedImoveis = useMemo(() => {
    if (!imoveis) return [];
    let list = [...imoveis];

    if (showFavoritesOnly) {
        list = list.filter(i => favorites.includes(i.link));
    }

    switch (sortOrder) {
      case 'price_asc':
        return list.sort((a, b) => a.valor - b.valor);
      case 'price_desc':
        return list.sort((a, b) => b.valor - a.valor);
      case 'area_desc':
        return list.sort((a, b) => b.area - a.area);
      case 'price_per_m_asc':
        return list.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
      default:
        return list;
    }
  }, [imoveis, sortOrder, showFavoritesOnly, favorites]);

  // Scroll to top when filters or sort change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedFilters, sortOrder, showFavoritesOnly]);

  const activeFiltersCount = Object.entries(filters).filter(([, value]) => {
     if (Array.isArray(value)) return value.length > 0;
     return value !== '';
  }).length;

  const clearFilters = () => {
    setFilters({
      minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '',
      minVacancies: '', minArea: '', maxArea: '', minAreaTotal: '',
      maxAreaTotal: '', address: []
    });
    addToast('Filtros limpos com sucesso.', 'info');
  };

  const activeFiltersList = useMemo(() => {
    const list: { key: keyof typeof filters; label: string; value?: string }[] = [];
    if (filters.minPrice) list.push({ key: 'minPrice', label: `Mín: R$ ${parseInt(filters.minPrice).toLocaleString('pt-BR')}` });
    if (filters.maxPrice) list.push({ key: 'maxPrice', label: `Máx: R$ ${parseInt(filters.maxPrice).toLocaleString('pt-BR')}` });
    if (filters.minBedrooms) list.push({ key: 'minBedrooms', label: `${filters.minBedrooms}+ Quartos` });
    if (filters.minBathrooms) list.push({ key: 'minBathrooms', label: `${filters.minBathrooms}+ Banhos` });
    if (filters.minVacancies) list.push({ key: 'minVacancies', label: `${filters.minVacancies}+ Vagas` });
    if (filters.minArea) list.push({ key: 'minArea', label: `Área Mín: ${filters.minArea} m²` });
    if (filters.maxArea) list.push({ key: 'maxArea', label: `Área Máx: ${filters.maxArea} m²` });
    if (filters.minAreaTotal) list.push({ key: 'minAreaTotal', label: `Total Mín: ${filters.minAreaTotal} m²` });
    if (filters.maxAreaTotal) list.push({ key: 'maxAreaTotal', label: `Total Máx: ${filters.maxAreaTotal} m²` });

    filters.address.forEach((addr) => {
      list.push({ key: 'address', value: addr, label: addr });
    });

    return list;
  }, [filters]);

  const removeFilter = (item: { key: keyof typeof filters; value?: string }) => {
    setFilters((prev) => {
      if (item.key === 'address' && item.value) {
        return { ...prev, address: prev.address.filter((a) => a !== item.value) };
      }
      return { ...prev, [item.key]: '' };
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-transform duration-300 transform lg:translate-x-0 shadow-2xl lg:shadow-none flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 dark:bg-blue-500 p-1.5 rounded-lg text-white">
                <HomeIcon size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Imóveis Franca
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
            <button
               onClick={clearFilters}
               disabled={activeFiltersCount === 0}
               className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
            >
               <FilterX size={16} />
               Limpar Filtros ({activeFiltersCount})
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Suspense fallback={
            <div className="p-5 space-y-6">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                       <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                       <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                 </div>
               ))}
            </div>
          }>
            <FilterSidebar
              filters={filters}
              setFilters={(f) => { setFilters(f); /* Scroll to top handled by effect */ }}
              addresses={allAddresses}
            />
          </Suspense>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ScrollToTop />
        <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-sm flex-wrap gap-4 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-600 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
               {isLoading ? (
                 <span className="flex items-center gap-2 text-gray-500">
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                   Carregando...
                 </span>
               ) : (
                 <>
                    <Search size={18} className="text-gray-400" />
                    {sortedImoveis.length} <span className="hidden sm:inline">Imóveis encontrados</span>
                 </>
               )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border shadow-sm",
                  showFavoritesOnly
                    ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                )}
                title="Mostrar apenas favoritos"
              >
                <Heart size={18} className={showFavoritesOnly ? "fill-current" : ""} />
                <span className="hidden sm:inline">Favoritos ({favorites.length})</span>
              </button>

             <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                title={darkMode ? "Modo Claro" : "Modo Escuro"}
             >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <ArrowUpDown size={14} />
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="py-2 pl-2 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                >
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="area_desc">Maior Área</option>
                  <option value="price_per_m_asc">Menor Preço/m²</option>
                </select>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {activeFiltersList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFiltersList.map((filter, index) => (
                <button
                  key={`${filter.key}-${filter.value || index}`}
                  onClick={() => removeFilter(filter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {filter.label}
                  <X
                    size={13}
                    className="opacity-60 hover:opacity-100 hover:text-red-500 transition-opacity"
                  />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1 px-2 py-1.5"
              >
                Limpar
              </button>
            </div>
          )}

          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <PropertyCardSkeleton key={i} />
               ))}
             </div>
          ) : isError ? (
            <EmptyState
                icon={AlertCircle}
                title="Erro ao carregar imóveis"
                description="Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
                action={{
                    label: 'Tentar novamente',
                    onClick: () => window.location.reload()
                }}
            />
          ) : sortedImoveis.length === 0 ? (
             <EmptyState
                icon={Search}
                title="Nenhum imóvel encontrado"
                description={
                  showFavoritesOnly
                     ? "Você ainda não adicionou nenhum imóvel aos favoritos."
                     : "Tente ajustar os filtros para encontrar o que você procura."
                }
                action={
                    activeFiltersCount > 0 && !showFavoritesOnly
                    ? { label: 'Limpar Filtros', onClick: clearFilters }
                    : undefined
                }
             />
          ) : (
            <VirtuosoGrid
              useWindowScroll
              totalCount={sortedImoveis.length}
              components={{
                List: ListContainer,
                Item: ItemContainer
              }}
              itemContent={(index) => {
                const imovel = sortedImoveis[index];
                return (
                   <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full"
                   >
                    <PropertyCard
                      imovel={imovel}
                      isFavorite={favorites.includes(imovel.link)}
                      onToggleFavorite={() => toggleFavorite(imovel.link)}
                    />
                  </motion.div>
                );
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};
