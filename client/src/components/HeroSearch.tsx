import React from 'react';
import { Search, Tag, Key } from 'lucide-react';
import { clsx } from 'clsx';

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

  const inputClass = "flex-1 min-w-[140px] border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 px-4 sm:px-6 pt-8 pb-16 sm:pb-20">
      <h1 className="max-w-2xl mx-auto text-center text-white text-2xl sm:text-3xl font-extrabold tracking-tight text-balance mb-6">
        Encontre o imóvel certo em Franca, entre dezenas de imobiliárias, num só lugar.
      </h1>

      <div className="max-w-3xl mx-auto">
        <div className="flex gap-1" role="tablist" aria-label="Finalidade">
          <button
            type="button"
            role="tab"
            aria-selected={filters.tipo === 'venda'}
            onClick={() => setTipo('venda')}
            className={clsx(
              "flex items-center gap-1.5 px-6 py-3 rounded-t-xl text-sm font-bold transition-colors",
              filters.tipo === 'venda'
                ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300"
                : "bg-white/15 text-white/80 hover:bg-white/25"
            )}
          >
            <Tag size={15} /> Comprar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.tipo === 'aluguel'}
            onClick={() => setTipo('aluguel')}
            className={clsx(
              "flex items-center gap-1.5 px-6 py-3 rounded-t-xl text-sm font-bold transition-colors",
              filters.tipo === 'aluguel'
                ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300"
                : "bg-white/15 text-white/80 hover:bg-white/25"
            )}
          >
            <Key size={15} /> Alugar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-xl rounded-tr-xl p-4 shadow-2xl flex flex-wrap gap-2.5">
          <select
            name="address"
            value={filters.address[0] || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value ? [e.target.value] : [] }))}
            className={inputClass}
          >
            <option value="">Todos os bairros</option>
            {addresses.map(addr => <option key={addr} value={addr}>{addr}</option>)}
          </select>
          <input
            type="number"
            name="minPrice"
            placeholder={filters.tipo === 'aluguel' ? 'Aluguel mín.' : 'Valor mín.'}
            value={filters.minPrice}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="number"
            name="maxPrice"
            placeholder={filters.tipo === 'aluguel' ? 'Aluguel máx.' : 'Valor máx.'}
            value={filters.maxPrice}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="number"
            name="minBedrooms"
            placeholder="Quartos"
            value={filters.minBedrooms}
            onChange={handleChange}
            className={clsx(inputClass, "max-w-[110px]")}
          />
          <button
            type="button"
            onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
