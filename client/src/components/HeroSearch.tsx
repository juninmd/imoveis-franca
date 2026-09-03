import React from 'react';
import { Search, Tag, Key, MapPin, DollarSign, BedDouble } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface HeroFilters {
  tipo: 'venda' | 'aluguel';
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  address: string[];
}

interface HeroSearchProps<T extends HeroFilters> {
  filters: T;
  // Aceita o setter genérico de useState do Home.tsx, que carrega campos extras (preço, área...)
  // além dos exibidos aqui no hero.
  setFilters: (updater: (prev: T) => T) => void;
  addresses: string[];
}

export function HeroSearch<T extends HeroFilters>({ filters, setFilters, addresses }: HeroSearchProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const setTipo = (tipo: 'venda' | 'aluguel') => {
    setFilters(prev => ({ ...prev, tipo }));
  };

  const inputClass = "w-full border-none bg-transparent text-gray-900 dark:text-white px-2 py-1.5 text-sm outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500";
  const wrapperClass = "flex-1 min-w-[140px] border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center px-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 shadow-inner";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-800 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 px-4 sm:px-6 pt-12 pb-20 sm:pb-24">

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px] animate-pulse" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <h1 className="max-w-2xl mx-auto text-center text-white text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance mb-4 drop-shadow-sm">
          Encontre o imóvel dos seus sonhos em Franca
        </h1>
        <p className="text-center text-blue-100 dark:text-gray-300 text-base sm:text-lg mb-10 max-w-xl mx-auto text-balance">
          Busque entre dezenas de imobiliárias em um só lugar. Simples, rápido e eficiente.
        </p>

        <div className="flex gap-2 justify-center sm:justify-start" role="tablist" aria-label="Finalidade">
          <button
            type="button"
            role="tab"
            aria-selected={filters.tipo === 'venda'}
            onClick={() => setTipo('venda')}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-t-xl text-sm font-bold transition-all relative overflow-hidden",
              filters.tipo === 'venda'
                ? "bg-white/95 dark:bg-gray-800/95 text-blue-700 dark:text-blue-400 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
                : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            )}
          >
            {filters.tipo === 'venda' && <motion.div layoutId="activeTabIndicator" className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}
            <Tag size={16} /> Comprar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.tipo === 'aluguel'}
            onClick={() => setTipo('aluguel')}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-t-xl text-sm font-bold transition-all relative overflow-hidden",
              filters.tipo === 'aluguel'
                ? "bg-white/95 dark:bg-gray-800/95 text-blue-700 dark:text-blue-400 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
                : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            )}
          >
            {filters.tipo === 'aluguel' && <motion.div layoutId="activeTabIndicator" className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}
            <Key size={16} /> Alugar
          </button>
        </div>

        <motion.div
          layout
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl p-4 sm:p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 border border-white/20 dark:border-gray-700/50"
        >
          <div className={clsx(wrapperClass, "min-w-[180px]")}>
            <MapPin size={16} className="text-gray-400 dark:text-gray-500 ml-1" />
            <select
              name="address"
              value={filters.address[0] || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value ? [e.target.value] : [] }))}
              className={clsx(inputClass, "cursor-pointer truncate pr-8")}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="">Qualquer bairro</option>
              {addresses.map(addr => <option key={addr} value={addr}>{addr}</option>)}
            </select>
            {/* Custom dropdown arrow to replace native one since we hid it */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className={wrapperClass}>
            <DollarSign size={16} className="text-gray-400 dark:text-gray-500 ml-1" />
            <input
              type="number"
              name="minPrice"
              placeholder={filters.tipo === 'aluguel' ? 'Aluguel mín.' : 'Valor mín.'}
              value={filters.minPrice}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className={wrapperClass}>
            <DollarSign size={16} className="text-gray-400 dark:text-gray-500 ml-1" />
            <input
              type="number"
              name="maxPrice"
              placeholder={filters.tipo === 'aluguel' ? 'Aluguel máx.' : 'Valor máx.'}
              value={filters.maxPrice}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className={clsx(wrapperClass, "max-w-none sm:max-w-[120px]")}>
            <BedDouble size={16} className="text-gray-400 dark:text-gray-500 ml-1" />
            <input
              type="number"
              name="minBedrooms"
              placeholder="Quartos"
              value={filters.minBedrooms}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <Search size={18} /> Buscar
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
