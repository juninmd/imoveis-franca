import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchImoveis } from './api';
import { HeroSearch } from './components/HeroSearch';
import { PropertyCard } from './components/PropertyCard';
import { PropertyCardSkeleton } from './components/PropertyCardSkeleton';
import { EmptyState } from './components/EmptyState';
import { ScrollToTop } from './components/ScrollToTop';
import { Menu, X, Moon, Sun, Heart, FilterX, Search, Home as HomeIcon, ArrowUpDown, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import type { Imovel } from './types';
import { useToast } from './components/ToastContext';
import { VirtuosoGrid } from 'react-virtuoso';
import { useSearchState } from './hooks/useSearchState';
import { useFavorites } from './hooks/useFavorites';

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

const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, children, className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    style={style}
    className={className}
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
  // Estado da busca vive na URL: a pesquisa fica compartilhável, sobrevive ao refresh e
  // acompanha o botão "voltar" do navegador.
  const {
    filters, setFilters,
    sortOrder, setSortOrder,
    viewMode, setViewMode,
    showFavoritesOnly, setShowFavoritesOnly,
  } = useSearchState();

  const { addToast } = useToast();
  const debouncedFilters = useDebounce(filters, 500);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fechar com Esc é o mínimo esperado de um painel sobreposto no mobile.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

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

  const { isFavorite, toggle: toggleFavoriteInStore, sync: syncFavorites, items: favoriteItems, count: favoritesCount } = useFavorites();

  const toggleFavorite = (imovel: Imovel) => {
    const isAdding = toggleFavoriteInStore(imovel);
    addToast(
      isAdding ? 'Imóvel salvo nos favoritos!' : 'Imóvel removido dos favoritos.',
      isAdding ? 'success' : 'info'
    );
  };

  const { data: imoveis, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['imoveis', debouncedFilters],
    queryFn: () => fetchImoveis({ ...debouncedFilters }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Completa favoritos antigos (salvos quando só guardávamos o link) com os dados do anúncio.
  useEffect(() => {
    if (imoveis) syncFavorites(imoveis);
  }, [imoveis, syncFavorites]);

  // Extract unique addresses for the filter
  const allAddresses = useMemo(() => imoveis
    ? Array.from(new Set(imoveis.map((i) => i.endereco).filter(Boolean)))
    : [], [imoveis]);

  const sortedImoveis = useMemo(() => {
    // Os favoritos vêm do armazenamento local, não do resultado da busca: antes eles sumiam
    // da tela ao trocar de "Comprar" para "Alugar" ou ao mexer em qualquer filtro, enquanto o
    // contador continuava mostrando o total salvo.
    const source = showFavoritesOnly ? favoriteItems : imoveis;
    if (!source) return [];
    const list = [...source];

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
  }, [imoveis, sortOrder, showFavoritesOnly, favoriteItems]);

  // Scroll to top when filters or sort change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedFilters, sortOrder, showFavoritesOnly]);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
     if (key === 'tipo') return false; // finalidade não conta como filtro avançado
     if (Array.isArray(value)) return value.length > 0;
     return value !== '';
  }).length;

  const clearFilters = () => {
    // Mantém `tipo` (Comprar/Alugar): é a finalidade da busca, não um filtro avançado.
    setFilters(prev => ({
      tipo: prev.tipo,
      minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '',
      minVacancies: '', minArea: '', maxArea: '', minAreaTotal: '',
      maxAreaTotal: '', address: []
    }));
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
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-transform duration-300 transform lg:translate-x-0 shadow-2xl lg:shadow-none flex flex-col",
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
          <button onClick={() => setIsSidebarOpen(false)} aria-label="Fechar filtros" className="lg:hidden p-2 text-primary-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-5 space-y-6"
            >
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="space-y-3 pb-6 border-b border-gray-100/50 dark:border-gray-700/50">
                    <div className="h-4 bg-gray-200/70 dark:bg-gray-700/70 rounded w-1/3 animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                       <div className="h-10 bg-gray-200/70 dark:bg-gray-700/70 rounded-lg animate-pulse" />
                       <div className="h-10 bg-gray-200/70 dark:bg-gray-700/70 rounded-lg animate-pulse" />
                    </div>
                 </div>
               ))}
            </motion.div>
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

        {/* Floating Dark Mode Toggle for Hero */}
        <div className="absolute top-4 right-4 z-20 hidden lg:block">
            <button
               onClick={() => setDarkMode(!darkMode)}
               title={darkMode ? "Modo Claro" : "Modo Escuro"}
               className="p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>

        <HeroSearch
          filters={filters}
          setFilters={setFilters}
          addresses={allAddresses}
        />
        <header id="resultados" className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-sm flex-wrap gap-4 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-600 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                aria-label={activeFiltersCount > 0 ? `Abrir filtros (${activeFiltersCount} ativos)` : 'Abrir filtros'}
                aria-expanded={isSidebarOpen}
              >
                <Menu size={24} />
                {activeFiltersCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" aria-hidden="true" />
                )}
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2" aria-live="polite">
               {isLoading ? (
                 <span className="flex items-center gap-2 text-gray-500">
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                   Carregando...
                 </span>
               ) : (
                 <>
                    <Search size={18} className="text-gray-400" />
                    {sortedImoveis.length} <span className="hidden sm:inline">imóveis para {filters.tipo === 'aluguel' ? 'alugar' : 'comprar'}</span>
                 </>
               )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <button
                onClick={() => setShowFavoritesOnly(prev => !prev)}
                aria-pressed={showFavoritesOnly}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border shadow-sm",
                  showFavoritesOnly
                    ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                )}
                title="Mostrar apenas favoritos"
              >
                <Heart size={18} className={showFavoritesOnly ? "fill-current" : ""} />
                <span className="hidden sm:inline">Favoritos ({favoritesCount})</span>
              </button>

             <button
                onClick={() => setDarkMode(!darkMode)}

                title={darkMode ? "Modo Claro" : "Modo Escuro"}
                className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm hover:scale-105 active:scale-95"
             >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all hover:-translate-y-1 hover:scale-105 active:scale-95",
                    viewMode === 'grid'
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all hover:-translate-y-1 hover:scale-105 active:scale-95",
                    viewMode === 'list'
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                  title="Visualização em Lista"
                >
                  <List size={18} />
                </button>
             </div>

            {/* Ordenação também no mobile: estava atrás de `hidden sm:flex`, ou seja, a maior
                parte do tráfego não conseguia ordenar a lista. */}
            <div className="flex items-center gap-2 sm:pl-2 sm:border-l border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:flex items-center gap-1" aria-hidden="true">
                    <ArrowUpDown size={14} />
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  aria-label="Ordenar resultados"
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
            <motion.div layout className="flex flex-wrap gap-2 mb-6">
              <AnimatePresence>
                {activeFiltersList.map((filter, index) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, width: 0, overflow: "hidden", paddingLeft: 0, paddingRight: 0, margin: 0, transition: { duration: 0.2 } }}
                    key={`${filter.key}-${filter.value || index}`}
                    onClick={() => removeFilter(filter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {filter.label}
                    <X
                      size={13}
                      className="opacity-60 hover:opacity-100 hover:text-red-500 transition-opacity"
                    />
                  </motion.button>
                ))}
              </AnimatePresence>
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1 px-2 py-1.5"
              >
                Limpar
              </button>
            </motion.div>
          )}

          {isLoading ? (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className={clsx(
                 "grid gap-6",
                 viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
               )}
             >
               {[...Array(6)].map((_, i) => (
                 <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                    className="h-full"
                 >
                   <PropertyCardSkeleton viewMode={viewMode} />
                 </motion.div>
               ))}
             </motion.div>
          ) : isError ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><EmptyState
                icon={AlertCircle}
                title="Erro ao carregar imóveis"
                description="Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
                action={{
                    label: isFetching ? 'Tentando...' : 'Tentar novamente',
                    onClick: () => { void refetch(); }
                }}
            /></motion.div>
          ) : sortedImoveis.length === 0 ? (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><EmptyState
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
             /></motion.div>
          ) : (
            <VirtuosoGrid
              useWindowScroll
              totalCount={sortedImoveis.length}
              listClassName={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8" : "grid grid-cols-1 gap-6 pb-8"}
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
                      isFavorite={isFavorite(imovel.link)}
                      onToggleFavorite={() => toggleFavorite(imovel)}
                      viewMode={viewMode}
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
