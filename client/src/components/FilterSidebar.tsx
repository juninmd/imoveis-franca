import React, { useState, useMemo } from 'react';
import { MapPin, Search, Check, DollarSign, Home, Maximize, Grid, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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

const CollapsibleSection: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onReset?: () => void;
  hasValue?: boolean;
}> = ({ title, children, defaultOpen = true, onReset, hasValue }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 mb-4 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between w-full py-2">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-1 text-left outline-none"
        >
            {title}
            {isOpen ? (
            <ChevronUp size={14} className="text-gray-300 dark:text-gray-600" />
            ) : (
            <ChevronDown size={14} className="text-gray-300 dark:text-gray-600" />
            )}
        </button>

        {hasValue && onReset && (
             <button
                onClick={onReset}
                className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1"
                title="Limpar filtro"
             >
                 <RotateCcw size={12} />
             </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters, addresses }) => {
  const [addressSearch, setAddressSearch] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleAddress = (address: string) => {
    setFilters(prev => {
      const current = prev.address;
      const isSelected = current.includes(address);
      if (isSelected) {
        return { ...prev, address: current.filter(a => a !== address) };
      } else {
        return { ...prev, address: [...current, address] };
      }
    });
  };

  const filteredAddresses = useMemo(() => {
    const sorted = [...addresses].sort();
    if (!addressSearch) return sorted;
    return sorted.filter(addr =>
      addr.toLowerCase().includes(addressSearch.toLowerCase())
    );
  }, [addresses, addressSearch]);

  const inputClass = "w-full p-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all hover:border-gray-300 dark:hover:border-gray-500";
  const labelClass = "text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block";

  return (
    <div className="p-5">

      {/* Price */}
      <CollapsibleSection
        title={<><DollarSign size={14} className="text-emerald-500" /> Preço (R$)</>}
        hasValue={!!filters.minPrice || !!filters.maxPrice}
        onReset={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}
      >
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
      </CollapsibleSection>

      {/* Details */}
      <CollapsibleSection
         title={<><Home size={14} className="text-blue-500" /> Características</>}
         hasValue={!!filters.minBedrooms || !!filters.minBathrooms || !!filters.minVacancies}
         onReset={() => setFilters(prev => ({ ...prev, minBedrooms: '', minBathrooms: '', minVacancies: '' }))}
      >
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
               <label className={labelClass}>Banhos</label>
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
      </CollapsibleSection>

      {/* Area */}
      <CollapsibleSection
        title={<><Maximize size={14} className="text-purple-500" /> Área Útil (m²)</>}
        hasValue={!!filters.minArea || !!filters.maxArea}
        onReset={() => setFilters(prev => ({ ...prev, minArea: '', maxArea: '' }))}
      >
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
      </CollapsibleSection>

      {/* Total Area */}
      <CollapsibleSection
        title={<><Grid size={14} className="text-orange-500" /> Área Terreno (m²)</>}
        hasValue={!!filters.minAreaTotal || !!filters.maxAreaTotal}
        onReset={() => setFilters(prev => ({ ...prev, minAreaTotal: '', maxAreaTotal: '' }))}
      >
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
      </CollapsibleSection>

      {/* Address */}
      <CollapsibleSection
        title={<><MapPin size={14} className="text-red-500" /> Endereços</>}
        hasValue={filters.address.length > 0}
        onReset={() => setFilters(prev => ({ ...prev, address: [] }))}
      >
        <div className="space-y-2">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filtrar bairros..."
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    className={clsx(inputClass, "pl-9 py-2")}
                />
            </div>

            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-52 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800/40">
                {filteredAddresses.length > 0 ? (
                    <div className="p-1">
                        {filteredAddresses.map((addr) => {
                            const isSelected = filters.address.includes(addr);
                            return (
                                <button
                                    key={addr}
                                    onClick={() => toggleAddress(addr)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors",
                                        isSelected
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                                        isSelected
                                            ? "bg-blue-500 border-blue-500 text-white"
                                            : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800"
                                    )}>
                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span className="truncate">{addr}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        Nenhum bairro encontrado.
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 px-1">
                <span>{filters.address.length} selecionados</span>
                {filters.address.length > 0 && (
                     <button
                        onClick={() => setFilters(prev => ({ ...prev, address: [] }))}
                        className="text-blue-500 hover:underline cursor-pointer"
                    >
                        Limpar seleção
                     </button>
                )}
            </div>
        </div>
      </CollapsibleSection>

    </div>
  );
};
