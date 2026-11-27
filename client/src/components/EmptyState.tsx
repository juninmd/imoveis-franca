import { Search, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, EmptyState as SonidoEmptyState } from '@juninmd/sonido';

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
  title = 'Nenhum imóvel encontrado nesta busca',
  description = 'Não encontramos imóveis que correspondam aos filtros selecionados. Tente ajustar sua busca.',
  icon: Icon = Search,
  tips = ['Tente ajustar os filtros', 'Remova algumas restrições de preço', 'Pesquise por outros bairros'],
  action
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-8 text-center bg-white/70 dark:bg-gray-800/70 rounded-2xl backdrop-blur-xl border border-gray-100 dark:border-gray-700 w-full relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/20 to-transparent opacity-50 dark:from-blue-900/10 pointer-events-none" />

      <SonidoEmptyState
        title={title}
        titleAs="h3"
        icon={<Icon className="w-7 h-7" aria-hidden="true" />}
        description={
          <>
            {description}
            {tips.length > 0 && (
              <span className="empty-state__tips mt-5 grid gap-2 text-left" role="list">
                <span className="font-semibold text-gray-800 dark:text-gray-200" role="listitem">
                  💡 Dicas para melhorar sua busca:
                </span>
                {tips.map((tip, idx) => (
                  <span key={idx} className="flex items-start gap-2" role="listitem">
                    <span aria-hidden="true" className="font-bold text-blue-600 dark:text-blue-400">•</span>
                    <span>{tip}</span>
                  </span>
                ))}
              </span>
            )}
          </>
        }
        action={action && (
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        className="empty-state-sonido relative z-10 w-full"
      />
    </motion.div>
  );
}
