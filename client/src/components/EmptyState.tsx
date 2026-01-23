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
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center max-w-md mx-auto"
    >
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6 shadow-sm">
          <Icon size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
         {description}
      </p>
      {action && (
          <button
              onClick={action.onClick}
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
              {action.label}
          </button>
      )}
    </motion.div>
  );
};
