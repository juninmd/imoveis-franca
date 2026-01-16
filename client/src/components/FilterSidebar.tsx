import React from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

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

  const inputClass = "w-full p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-shadow";
  const labelClass = "text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block";
  const sectionClass = "space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700 last:border-0";
  const headingClass = "text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2";

  return (
    <div className="p-5 space-y-6">

      {/* Price */}
      <div className={sectionClass}>
        <h3 className={headingClass}>Preço (R$)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className={labelClass}>Mínimo</label>
             <input
                type="number"
                name="minPrice"
                placeholder="0"
                value={filters.minPrice}
                onChange={handleChange}
                className={inputClass}
             />
          </div>
          <div>
             <label className={labelClass}>Máximo</label>
             <input
                type="number"
                name="maxPrice"
                placeholder="Ilimitado"
                value={filters.maxPrice}
                onChange={handleChange}
                className={inputClass}
             />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className={sectionClass}>
         <h3 className={headingClass}>Características</h3>
         <div className="grid grid-cols-3 gap-3">
             <div>
               <label className={labelClass}>Quartos</label>
               <input
                  type="number"
                  name="minBedrooms"
                  placeholder="2+"
                  value={filters.minBedrooms}
                  onChange={handleChange}
                  className={inputClass}
               />
             </div>
             <div>
               <label className={labelClass}>Banheiros</label>
               <input
                  type="number"
                  name="minBathrooms"
                  placeholder="1+"
                  value={filters.minBathrooms}
                  onChange={handleChange}
                  className={inputClass}
               />
             </div>
             <div>
               <label className={labelClass}>Vagas</label>
               <input
                  type="number"
                  name="minVacancies"
                  placeholder="1+"
                  value={filters.minVacancies}
                  onChange={handleChange}
                  className={inputClass}
               />
             </div>
         </div>
      </div>

      {/* Area */}
      <div className={sectionClass}>
        <h3 className={headingClass}>Área Útil (m²)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className={labelClass}>Mínima</label>
             <input
                type="number"
                name="minArea"
                placeholder="0"
                value={filters.minArea}
                onChange={handleChange}
                className={inputClass}
             />
          </div>
          <div>
             <label className={labelClass}>Máxima</label>
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
      </div>

      {/* Total Area */}
      <div className={sectionClass}>
        <h3 className={headingClass}>Área Terreno (m²)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className={labelClass}>Mínima</label>
             <input
                type="number"
                name="minAreaTotal"
                placeholder="0"
                value={filters.minAreaTotal}
                onChange={handleChange}
                className={inputClass}
             />
          </div>
          <div>
             <label className={labelClass}>Máxima</label>
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
      </div>

      {/* Address */}
      <div className={sectionClass}>
        <h3 className={headingClass}>
            <MapPin size={14} /> Endereços
        </h3>
        <div className="relative">
            <select
              multiple
              name="address"
              value={filters.address}
              onChange={handleAddressChange}
              className={`${inputClass} h-40 pt-2 custom-scrollbar`}
            >
              {addresses.sort().map((addr, i) => (
                <option key={i} value={addr} className="p-1 hover:bg-blue-50 dark:hover:bg-gray-600 rounded cursor-pointer text-sm">
                    {addr}
                </option>
              ))}
            </select>
            <div className="absolute top-2 right-2 pointer-events-none opacity-50">
               <ChevronDown size={16} />
            </div>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
            Segure Ctrl/Cmd para selecionar múltiplos
        </p>
      </div>

    </div>
  );
};
