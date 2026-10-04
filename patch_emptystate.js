const fs = require('fs');
let code = fs.readFileSync('client/src/components/EmptyState.tsx', 'utf8');

// Add glow effect behind icon
code = code.replace(
  '<motion.div\n        whileHover={{ rotate: 5, scale: 1.1 }}',
  '<div className="relative mb-6">\n        <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 blur-2xl rounded-full scale-150 pointer-events-none" />\n      <motion.div\n        whileHover={{ rotate: 5, scale: 1.1 }}'
);

// Close div
code = code.replace(
  '<Icon size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />\n      </motion.div>',
  '<Icon size={48} className="text-gray-400 dark:text-gray-500 relative z-10" strokeWidth={1.5} />\n      </motion.div>\n      </div>'
);

// Remove existing mb-6 on motion.div
code = code.replace('className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6 shadow', 'className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full relative z-10 shadow');

// Update tips container
code = code.replace(
  'className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 mb-8 text-left w-full max-w-sm border border-gray-100 dark:border-gray-700/50"',
  'className="bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-5 mb-8 text-left w-full max-w-sm border border-gray-100/50 dark:border-gray-700/50 shadow-sm"'
);

fs.writeFileSync('client/src/components/EmptyState.tsx', code);
