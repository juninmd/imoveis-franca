const fs = require('fs');
let code = fs.readFileSync('client/src/components/FilterSidebar.tsx', 'utf8');

// Add sticky header and sticky footer
code = code.replace(
  '<div className="p-5 space-y-2">',
  '<div className="flex flex-col h-full"><div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 font-bold text-gray-800 dark:text-gray-200 shadow-sm flex justify-between items-center"><span>Filtros</span>{filters.minPrice || filters.maxPrice || filters.minBedrooms || filters.minBathrooms || filters.minVacancies || filters.minArea || filters.maxArea || filters.minAreaTotal || filters.maxAreaTotal || filters.address.length > 0 ? <button onClick={() => setFilters({tipo: "venda", minPrice: "", maxPrice: "", minBedrooms: "", minBathrooms: "", minVacancies: "", minArea: "", maxArea: "", minAreaTotal: "", maxAreaTotal: "", address: []})} className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider hover:underline">Limpar</button> : null}</div><div className="p-5 space-y-2 flex-1 overflow-y-auto">'
);

code = code.replace(
  '<div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700/50">',
  '</div><div className="sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700/50">'
);

fs.writeFileSync('client/src/components/FilterSidebar.tsx', code);
