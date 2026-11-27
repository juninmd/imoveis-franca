// Trechos literais de origin/master:client/src/components/FilterSidebar.tsx.
// Copiados sem alteração de markup; só os handlers viraram no-ops.
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

const inputClass =
  'w-full p-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all hover:border-gray-300 dark:hover:border-gray-500 focus:bg-white dark:focus:bg-gray-700 shadow-inner';
const labelClass =
  'text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block cursor-pointer';

export function LegacyPriceFields() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Mínimo</label>
        <input type="number" name="minPrice" placeholder="0" defaultValue="250000" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Máximo</label>
        <input type="number" name="maxPrice" placeholder="Ilimitado" defaultValue="600000" className={inputClass} />
      </div>
    </div>
  );
}

export function LegacyAddressSearch() {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Filtrar bairros..."
        aria-label="Filtrar bairros"
        defaultValue="Jardim"
        className={clsx(inputClass, 'pl-9 pr-8 py-2')}
      />
      <button
        type="button"
        aria-label="Limpar busca de bairros"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function LegacyTipoChips() {
  const items = ['casa', 'apartamento', 'terreno', 'comercial'];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de imóvel">
      {items.map((tipo) => (
        <button
          key={tipo}
          type="button"
          aria-pressed={tipo === 'casa'}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors',
            tipo === 'casa'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400',
          )}
        >
          {tipo}
        </button>
      ))}
    </div>
  );
}

export function LegacyClearAll() {
  return (
    <button
      type="button"
      className="w-full py-3 px-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-700 dark:hover:text-white font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] border border-red-100 dark:border-red-900/30 group"
    >
      <X size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300 text-red-500" />
      <span className="text-red-600 dark:text-red-400 dark:group-hover:text-white font-medium">Limpar Todos os Filtros</span>
    </button>
  );
}
