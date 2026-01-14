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

  const inputClass = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "text-xs text-gray-500 dark:text-gray-400";
  const headingClass = "text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider";

  return (
    <div className="p-4 space-y-6">

      {/* Price */}
      <div className="space-y-3">
        <h3 className={headingClass}>Preço (R$)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            value={filters.minPrice}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
         <h3 className={headingClass}>Características</h3>

         <div className="space-y-2">
           <label className={labelClass}>Mínimo de Quartos</label>
           <input
              type="number"
              name="minBedrooms"
              placeholder="Ex: 2"
              value={filters.minBedrooms}
              onChange={handleChange}
              className={inputClass}
           />
         </div>

         <div className="space-y-2">
           <label className={labelClass}>Mínimo de Banheiros</label>
           <input
              type="number"
              name="minBathrooms"
              placeholder="Ex: 1"
              value={filters.minBathrooms}
              onChange={handleChange}
              className={inputClass}
           />
         </div>

         <div className="space-y-2">
           <label className={labelClass}>Mínimo de Vagas</label>
           <input
              type="number"
              name="minVacancies"
              placeholder="Ex: 1"
              value={filters.minVacancies}
              onChange={handleChange}
              className={inputClass}
           />
         </div>
      </div>

      {/* Area */}
      <div className="space-y-3">
        <h3 className={headingClass}>Área Útil (m²)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minArea"
            placeholder="Min"
            value={filters.minArea}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="number"
            name="maxArea"
            placeholder="Max"
            value={filters.maxArea}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Total Area */}
      <div className="space-y-3">
        <h3 className={headingClass}>Área Terreno (m²)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minAreaTotal"
            placeholder="Min"
            value={filters.minAreaTotal}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="number"
            name="maxAreaTotal"
            placeholder="Max"
            value={filters.maxAreaTotal}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-3">
        <h3 className={headingClass}>Endereços</h3>
        <select
          multiple
          name="address"
          value={filters.address}
          onChange={handleAddressChange}
          className={`${inputClass} h-32`}
        >
          {addresses.sort().map((addr, i) => (
            <option key={i} value={addr}>{addr}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 dark:text-gray-500">Segure Ctrl (ou Cmd) para selecionar múltiplos.</p>
      </div>

    </div>
  );
};
