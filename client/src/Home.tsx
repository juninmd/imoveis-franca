import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchImoveis } from './api';
import { FilterSidebar } from './components/FilterSidebar';
import { PropertyCard } from './components/PropertyCard';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

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

  const [sortOrder, setSortOrder] = useState('price_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: imoveis, isLoading, isError } = useQuery({
    queryKey: ['imoveis', filters],
    queryFn: () => fetchImoveis(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract unique addresses for the filter
  const allAddresses = useMemo(() => imoveis
    ? Array.from(new Set(imoveis.map((i) => i.endereco).filter(Boolean)))
    : [], [imoveis]);

  const sortedImoveis = useMemo(() => {
    if (!imoveis) return [];
    const sorted = [...imoveis];
    switch (sortOrder) {
      case 'price_asc':
        return sorted.sort((a, b) => a.valor - b.valor);
      case 'price_desc':
        return sorted.sort((a, b) => b.valor - a.valor);
      case 'area_desc':
        return sorted.sort((a, b) => b.area - a.area);
      case 'price_per_m_asc':
        return sorted.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
      default:
        return sorted;
    }
  }, [imoveis, sortOrder]);

  const totalPages = Math.ceil(sortedImoveis.length / itemsPerPage);
  const currentImoveis = sortedImoveis.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-white border-r border-gray-200 overflow-y-auto transition-transform transform lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Imóveis Franca</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-gray-500">
            <X size={24} />
          </button>
        </div>
        <FilterSidebar
          filters={filters}
          setFilters={(f) => { setFilters(f); setCurrentPage(1); }}
          addresses={allAddresses}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center justify-between shadow-sm flex-wrap gap-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-600 p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
               {isLoading ? 'Carregando...' : `${imoveis?.length || 0} Imóveis encontrados`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">Ordenar por:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="area_desc">Maior Área</option>
              <option value="price_per_m_asc">Menor Preço/m²</option>
            </select>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 flex-1">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white rounded-xl shadow-sm h-96 animate-pulse">
                   <div className="h-48 bg-gray-200 rounded-t-xl" />
                   <div className="p-4 space-y-3">
                     <div className="h-6 bg-gray-200 rounded w-3/4" />
                     <div className="h-4 bg-gray-200 rounded w-1/2" />
                     <div className="h-4 bg-gray-200 rounded w-full" />
                   </div>
                 </div>
               ))}
             </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-500">
              <p className="text-xl font-semibold">Erro ao carregar imóveis.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentImoveis.map((imovel, index) => (
                  <PropertyCard key={`${imovel.link}-${index}`} imovel={imovel} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-sm font-medium text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
