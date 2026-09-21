import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tips?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, tips, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center max-w-lg mx-auto"
    >
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ y: { repeat: Infinity, duration: 2, ease: 'easeInOut' }, scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
        className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6 shadow-[0_0_35px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-2 ring-gray-200/50 dark:ring-gray-700/50 transition-shadow hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
      >
          <Icon size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
         {description}
      </p>

      {tips && tips.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-left p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-8 w-full">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">Dicas:</h4>
              <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  {tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
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
