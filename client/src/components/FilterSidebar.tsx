import React, { useState, useMemo, useId } from 'react';
import { Home, DollarSign, Maximize, MapPin, X, Check, Grid, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, SearchField, TextField } from '@juninmd/sonido';
import { TIPOS_IMOVEL } from '../hooks/useSearchState';

interface FilterSidebarProps {
  filters: {
    tipo: 'venda' | 'aluguel';
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
    sites: string[];
    tipoImovel: string[];
    q: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<FilterSidebarProps['filters']>>;
  addresses: string[];
  availableSites: string[];
}

const CollapsibleSection = ({
    title,
    children,
    defaultOpen = true,
    hasValue = false,
    onReset
}: {
    title: React.ReactNode,
    children: React.ReactNode,
    defaultOpen?: boolean,
    hasValue?: boolean,
    onReset?: () => void
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const panelId = useId();

    return (
        <div className="border-b border-gray-100 dark:border-gray-700/50 py-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? panelId : undefined}
                    className="flex-1 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm group"
                >
                    <motion.div
                        initial={false}
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-blue-500"
                        aria-hidden="true"
                    >
                        ▶
                    </motion.div>
                    {title}
                    {hasValue && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                </button>
                {hasValue && onReset && (
                     <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReset();
                        }}
                     >
                        Limpar
                     </Button>
                )}
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 pb-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters, addresses, availableSites }) => {
  const [addressSearch, setAddressSearch] = useState('');
  const [siteSearch, setSiteSearch] = useState('');

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

const toggleTipoImovel = (tipoImovel: string) => {
    setFilters(prev => {
      const current = prev.tipoImovel || [];
      return { ...prev, tipoImovel: current.includes(tipoImovel) ? current.filter(t => t !== tipoImovel) : [...current, tipoImovel] };
    });
  };

/* v8 ignore start */
  const toggleSite = (site: string) => {
    setFilters(prev => {
      const current = prev.sites || [];
      const isSelected = current.includes(site);
      if (isSelected) {
        return { ...prev, sites: current.filter((s: string) => s !== site) };
      } else {
        return { ...prev, sites: [...current, site] };
      }
    });
  };

/* v8 ignore stop */
  const filteredAddresses = useMemo(() => {
    const sorted = [...addresses].sort();
    if (!addressSearch) return sorted;
    return sorted.filter(addr =>
      addr.toLowerCase().includes(addressSearch.toLowerCase())
    );
  }, [addresses, addressSearch]);

  const filteredSites = useMemo(() => {
    const allSites = availableSites || [];
    const sorted = [...allSites].sort();
    if (!siteSearch) return sorted;
    return sorted.filter(site =>
      site.toLowerCase().includes(siteSearch.toLowerCase())
    );
  }, [availableSites, siteSearch]);

  return (
    <div className="flex flex-col h-full"><div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 font-bold text-gray-800 dark:text-gray-200 shadow-sm flex justify-between items-center"><span>Filtros</span>{filters.minPrice || filters.maxPrice || filters.minBedrooms || filters.minBathrooms || filters.minVacancies || filters.minArea || filters.maxArea || filters.minAreaTotal || filters.maxAreaTotal || filters.address.length > 0 || (filters.tipoImovel || []).length > 0 || filters.q ? <Button variant="link" size="xs" onClick={() => setFilters({tipo: "venda", minPrice: "", maxPrice: "", minBedrooms: "", minBathrooms: "", minVacancies: "", minArea: "", maxArea: "", minAreaTotal: "", maxAreaTotal: "", address: [], sites: [], tipoImovel: [], q: ""})}>Limpar</Button> : null}</div><div className="p-5 space-y-2 flex-1 overflow-y-auto">

      {/* Price */}
      <CollapsibleSection
        title={<><DollarSign size={14} className="text-emerald-500" /> {filters.tipo === 'aluguel' ? 'Aluguel mensal (R$)' : 'Preço (R$)'}</>}
        hasValue={!!filters.minPrice || !!filters.maxPrice}
        onReset={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <TextField
            compact
            className="filter-field"
            label="Mínimo"
            type="number"
            name="minPrice"
            placeholder="0"
            value={filters.minPrice}
            onChange={handleChange}
          />
          <TextField
            compact
            className="filter-field"
            label="Máximo"
            type="number"
            name="maxPrice"
            placeholder="Ilimitado"
            value={filters.maxPrice}
            onChange={handleChange}
          />
        </div>
      </CollapsibleSection>

      {/* Details */}
      <CollapsibleSection
         title={<><Home size={14} className="text-blue-500" /> Características</>}
         hasValue={!!filters.minBedrooms || !!filters.minBathrooms || !!filters.minVacancies}
         onReset={() => setFilters(prev => ({ ...prev, minBedrooms: '', minBathrooms: '', minVacancies: '' }))}
      >
         <div className="grid grid-cols-3 gap-3">
             <TextField
                compact
                className="filter-field"
                label="Quartos"
                type="number"
                name="minBedrooms"
                placeholder="2+"
                value={filters.minBedrooms}
                onChange={handleChange}
             />
             <TextField
                compact
                className="filter-field"
                label="Banhos"
                type="number"
                name="minBathrooms"
                placeholder="1+"
                value={filters.minBathrooms}
                onChange={handleChange}
             />
             <TextField
                compact
                className="filter-field"
                label="Vagas"
                type="number"
                name="minVacancies"
                placeholder="1+"
                value={filters.minVacancies}
                onChange={handleChange}
             />
         </div>
      </CollapsibleSection>

      {/* Area */}
      <CollapsibleSection
        title={<><Maximize size={14} className="text-purple-500" /> Área Útil (m²)</>}
        hasValue={!!filters.minArea || !!filters.maxArea}
        onReset={() => setFilters(prev => ({ ...prev, minArea: '', maxArea: '' }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <TextField
            compact
            className="filter-field"
            label="Mínima"
            type="number"
            name="minArea"
            placeholder="0"
            value={filters.minArea}
            onChange={handleChange}
          />
          <TextField
            compact
            className="filter-field"
            label="Máxima"
            type="number"
            name="maxArea"
            placeholder="Max"
            value={filters.maxArea}
            onChange={handleChange}
          />
        </div>
      </CollapsibleSection>

      {/* Total Area */}
      <CollapsibleSection
        title={<><Grid size={14} className="text-orange-500" /> Área Terreno (m²)</>}
        hasValue={!!filters.minAreaTotal || !!filters.maxAreaTotal}
        onReset={() => setFilters(prev => ({ ...prev, minAreaTotal: '', maxAreaTotal: '' }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <TextField
            compact
            className="filter-field"
            label="Mínima"
            type="number"
            name="minAreaTotal"
            placeholder="0"
            value={filters.minAreaTotal}
            onChange={handleChange}
          />
          <TextField
            compact
            className="filter-field"
            label="Máxima"
            type="number"
            name="maxAreaTotal"
            placeholder="Max"
            value={filters.maxAreaTotal}
            onChange={handleChange}
          />
        </div>
      </CollapsibleSection>

      {/* Address */}
      <CollapsibleSection
        title={<><MapPin size={14} className="text-red-500" /> Endereços</>}
        hasValue={filters.address.length > 0}
        onReset={() => setFilters(prev => ({ ...prev, address: [] }))}
      >
        <div className="space-y-2">
            <SearchField
                className="filter-search"
                label="Filtrar bairros"
                clearLabel="Limpar busca de bairros"
                placeholder="Filtrar bairros..."
                value={addressSearch}
                onChange={setAddressSearch}
            />

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
                     <Button variant="link" size="xs" onClick={() => setFilters(prev => ({ ...prev, address: [] }))}>
                        Limpar seleção
                     </Button>
                )}
            </div>
        </div>
      </CollapsibleSection>

      {/* Tipo de imóvel e busca por palavra */}
      <CollapsibleSection
        title={<><Search size={14} className="text-teal-500" /> Tipo e palavra-chave</>}
        hasValue={(filters.tipoImovel || []).length > 0 || !!filters.q}
        onReset={() => setFilters(prev => ({ ...prev, tipoImovel: [], q: '' }))}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de imóvel">
            {TIPOS_IMOVEL.map(tipo => {
              const selected = (filters.tipoImovel || []).includes(tipo);
              return (
                <Button
                  key={tipo}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTipoImovel(tipo)}
                  variant={selected ? 'primary' : 'secondary'}
                  appearance={selected ? 'solid' : 'outline'}
                  size="xs"
                  className="capitalize"
                >
                  {tipo}
                </Button>
              );
            })}
          </div>
          <SearchField
            className="filter-search"
            label="Buscar por palavra-chave"
            placeholder="Ex.: piscina, edícula, código"
            maxLength={100}
            value={filters.q || ''}
            onChange={value => setFilters(prev => ({ ...prev, q: value }))}
          />
        </div>
      </CollapsibleSection>

/* v8 ignore start */
      {/* Sites */}
      <CollapsibleSection
        title={<><Home size={14} className="text-indigo-500" /> Imobiliárias</>}
        hasValue={(filters.sites || []).length > 0}
        onReset={() => setFilters(prev => ({ ...prev, sites: [] }))}
      >
        <div className="space-y-2">
            <SearchField
                className="filter-search"
                label="Filtrar imobiliárias"
                clearLabel="Limpar busca de imobiliárias"
                placeholder="Filtrar imobiliárias..."
                value={siteSearch}
                onChange={setSiteSearch}
            />

            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-52 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800/40">
                {filteredSites.length > 0 ? (
                    <div className="p-1">
                        {filteredSites.map((site) => {
                            const isSelected = (filters.sites || []).includes(site);
                            return (
                                <button
                                    key={site}
                                    onClick={() => toggleSite(site)}
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
                                    <span className="truncate">{site}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        Nenhuma imobiliária encontrada.
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 px-1">
                <span>{(filters.sites || []).length} selecionadas</span>
                {(filters.sites || []).length > 0 && (
                     <Button variant="link" size="xs" onClick={() => setFilters(prev => ({ ...prev, sites: [] }))}>
                        Limpar seleção
                     </Button>
                )}
            </div>
        </div>
      </CollapsibleSection>

      </div><div className="sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700/50">
        <Button
          variant="danger"
          appearance="outline"
          size="md"
          className="w-full"
          onClick={() => setFilters({
            tipo: 'venda',
            minPrice: '', maxPrice: '',
            minBedrooms: '', minBathrooms: '', minVacancies: '',
            minArea: '', maxArea: '', minAreaTotal: '', maxAreaTotal: '',
            address: [], sites: [], tipoImovel: [], q: ''
          })}
          iconStart={<X size={16} strokeWidth={2.5} />}
        >
          Limpar Todos os Filtros
        </Button>
      </div>
    </div>
  );
};
