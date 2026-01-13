import React from 'react';
import { Search } from 'lucide-react';

interface FilterState {
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBathrooms: string;
  minVacancies: string;
  minArea: string;
  maxArea: string;
  minAreaTotal: string;
  maxAreaTotal: string;
  address: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  addresses: string[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters, addresses }) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFilters(prev => ({ ...prev, address: selected }));
  };

  return (
    <div className="p-4 space-y-6">

      {/* Price */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Preço (R$)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            value={filters.minPrice}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Características</h3>

         <div className="space-y-2">
           <label className="text-xs text-gray-500">Mínimo de Quartos</label>
           <input
              type="number"
              name="minBedrooms"
              placeholder="Ex: 2"
              value={filters.minBedrooms}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
           />
         </div>

         <div className="space-y-2">
           <label className="text-xs text-gray-500">Mínimo de Banheiros</label>
           <input
              type="number"
              name="minBathrooms"
              placeholder="Ex: 1"
              value={filters.minBathrooms}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
           />
         </div>

         <div className="space-y-2">
           <label className="text-xs text-gray-500">Mínimo de Vagas</label>
           <input
              type="number"
              name="minVacancies"
              placeholder="Ex: 1"
              value={filters.minVacancies}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
           />
         </div>
      </div>

      {/* Area */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Área Útil (m²)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minArea"
            placeholder="Min"
            value={filters.minArea}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="number"
            name="maxArea"
            placeholder="Max"
            value={filters.maxArea}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Total Area */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Área Terreno (m²)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minAreaTotal"
            placeholder="Min"
            value={filters.minAreaTotal}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="number"
            name="maxAreaTotal"
            placeholder="Max"
            value={filters.maxAreaTotal}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Endereços</h3>
        <select
          multiple
          name="address"
          value={filters.address}
          onChange={handleAddressChange}
          className="w-full p-2 border border-gray-300 rounded-md text-sm h-32"
        >
          {addresses.sort().map((addr, i) => (
            <option key={i} value={addr}>{addr}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">Segure Ctrl (ou Cmd) para selecionar múltiplos.</p>
      </div>

      {/* Action */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        // Since React Query handles the refetching based on state change, this button might be just visual or for "Apply" if we debounce.
        // For now, inputs update state immediately, triggering refetch.
        // We could wrap inputs in a form and update "appliedFilters" on submit to avoid too many requests.
        // But let's keep it simple reactive for now.
      >
        <Search size={18} />
        Filtrar
      </button>

    </div>
  );
};
