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

  const inputClass = "w-full border-none bg-transparent text-gray-900 dark:text-white px-2 py-3 text-sm outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 font-medium transition-all group-hover:text-blue-900 dark:group-hover:text-blue-100";
  const wrapperClass = "group flex-1 min-w-[140px] border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center px-3 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-gray-800 hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] shadow-inner overflow-hidden relative";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 px-4 sm:px-6 pt-16 pb-24 sm:pb-32">

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[120px] mix-blend-overlay animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[150px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-300/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-5xl mx-auto"
      >
        <motion.h1
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
           className="max-w-3xl mx-auto text-center text-white text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-balance mb-6 drop-shadow-md leading-tight"
        >
          Encontre o imóvel dos seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">sonhos em Franca</span>
        </motion.h1>
        <motion.p
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
           className="text-center text-blue-100/90 dark:text-gray-300 text-lg sm:text-xl mb-12 max-w-2xl mx-auto text-balance font-medium drop-shadow-sm"
        >
          Busque entre centenas de imobiliárias em um só lugar. Simples, rápido e eficiente.
        </motion.p>

        <div className="flex gap-2 justify-center sm:justify-start" role="tablist" aria-label="Finalidade">
          <motion.button whileTap={{ scale: 0.95 }}
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
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
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
          </motion.button>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-b-3xl rounded-tr-3xl p-4 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row flex-wrap gap-4 border border-white/30 dark:border-gray-600/50 ring-1 ring-black/5"
        >
          <div className={clsx(wrapperClass, "min-w-[180px]")}>
            <div className="absolute left-3 transition-colors duration-300 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500">
               <MapPin size={18} />
            </div>
            <select
              name="address"
              value={filters.address[0] || ''}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, address: e.target.value ? [e.target.value] : [] }));
              }}
              className={clsx(inputClass, "cursor-pointer truncate pl-8 pr-8")}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="">Qualquer bairro</option>
              {addresses.map(addr => <option key={addr} value={addr}>{addr}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className={wrapperClass}>
            <div className="absolute left-3 transition-colors duration-300 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500">
               <DollarSign size={18} />
            </div>
            <input
              type="number"
              name="minPrice"
              placeholder={filters.tipo === 'aluguel' ? 'Aluguel mín.' : 'Valor mín.'}
              value={filters.minPrice}
              onChange={handleChange}
              className={clsx(inputClass, "pl-8")}
            />
          </div>

          <div className={wrapperClass}>
            <div className="absolute left-3 transition-colors duration-300 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500">
               <DollarSign size={18} />
            </div>
            <input
              type="number"
              name="maxPrice"
              placeholder={filters.tipo === 'aluguel' ? 'Aluguel máx.' : 'Valor máx.'}
              value={filters.maxPrice}
              onChange={handleChange}
              className={clsx(inputClass, "pl-8")}
            />
          </div>

          <div className={clsx(wrapperClass, "max-w-none sm:max-w-[130px]")}>
            <div className="absolute left-3 transition-colors duration-300 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500">
               <BedDouble size={18} />
            </div>
            <input
              type="number"
              name="minBedrooms"
              placeholder="Quartos"
              value={filters.minBedrooms}
              onChange={handleChange}
              className={clsx(inputClass, "pl-8")}
            />
          </div>

          <motion.button whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 sm:flex-none min-w-[130px] flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-[0.97] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            <Search size={18} className="animate-pulse-slow" /> Buscar
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
