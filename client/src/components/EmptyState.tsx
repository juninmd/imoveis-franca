import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, tips, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center max-w-lg mx-auto"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 blur-2xl rounded-full scale-150 pointer-events-none" />
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ y: { repeat: Infinity, duration: 2, ease: 'easeInOut' }, scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
        className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full relative z-10 shadow-[0_0_35px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-2 ring-gray-200/50 dark:ring-gray-700/50 transition-shadow hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
      >
          <Icon size={48} className="text-gray-400 dark:text-gray-500 relative z-10" strokeWidth={1.5} />
      </motion.div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
         {description}
      </p>

      {tips && tips.length > 0 && (
        <div className="bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-5 mb-8 text-left w-full max-w-sm border border-gray-100/50 dark:border-gray-700/50 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-1 rounded-md">💡</span> Dicas para melhorar a busca:
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5 text-lg leading-none">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {action && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
              {action.label}
          </motion.button>
      )}
    </motion.div>
  );
};
