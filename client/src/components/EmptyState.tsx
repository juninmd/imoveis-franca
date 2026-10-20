import { Search, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  tips?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = 'Nenhum imóvel encontrado',
  description = 'Não encontramos imóveis que correspondam aos filtros selecionados. Tente ajustar sua busca.',
  icon: Icon = Search,
  tips = ['Tente ajustar os filtros', 'Remova algumas restrições de preço', 'Pesquise por outros bairros'],
  action
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-12 text-center bg-white/70 dark:bg-gray-800/70 rounded-2xl backdrop-blur-xl border border-gray-100 dark:border-gray-700 w-full relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-100/20 to-transparent opacity-50 dark:from-primary-900/10 pointer-events-none" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="bg-primary-50 dark:bg-primary-900/30 p-5 rounded-full mb-5 relative z-10 shadow-sm"
      >
        <Icon className="w-10 h-10 text-primary-500" />
      </motion.div>

      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 relative z-10">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 relative z-10 text-base">{description}</p>

      <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300 text-left w-full max-w-sm relative z-10 bg-white/50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-50 dark:border-gray-700/50">
        <span className="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
           💡 Dicas para melhorar sua busca:
        </span>
        <ul className="list-none space-y-2">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
