const fs = require('fs');
let code = fs.readFileSync('client/src/components/PropertyCardSkeleton.tsx', 'utf8');

code = code.replace(
  '<div className={`${isList ? \'w-32 ml-4\' : \'w-full mt-4\'} h-10 bg-gray-200 dark:bg-gray-700 rounded-xl relative overflow-hidden`}>\n              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />\n          </div>',
  '<div className={`${isList ? \'w-32 ml-4\' : \'w-full mt-4\'} h-11 bg-gray-200 dark:bg-gray-700 rounded-xl relative overflow-hidden flex items-center justify-center gap-2`}>\n              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />\n              <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600 relative z-10" />\n              <div className="w-20 h-3 rounded bg-gray-300 dark:bg-gray-600 relative z-10" />\n          </div>'
);

fs.writeFileSync('client/src/components/PropertyCardSkeleton.tsx', code);
