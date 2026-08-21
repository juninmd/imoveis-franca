import { motion } from 'framer-motion';

export const PropertyCardSkeleton = ({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) => {
  const isList = viewMode === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm overflow-hidden flex border border-gray-100 dark:border-gray-700/50 ${
        isList ? 'flex-col sm:flex-row' : 'flex-col h-full'
      }`}
    >
      {/* Image Placeholder */}
      <div
        className={`relative bg-gray-200 dark:bg-gray-700/80 overflow-hidden shrink-0 ${
          isList ? 'w-full sm:w-72 h-64 sm:h-auto' : 'w-full h-64'
        }`}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {/* Badge Placeholder */}
        <div className="absolute top-3 left-3 w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded-md overflow-hidden">
             <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        {/* Price Placeholder (only in grid or small list) */}
        {!isList && (
          <div className="absolute bottom-4 left-4 w-32 h-8 bg-gray-300 dark:bg-gray-600 rounded-md overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`p-5 flex flex-col flex-1 gap-4 bg-white dark:bg-gray-800 ${isList ? 'justify-between' : ''}`}>
        <div className={isList ? 'flex justify-between items-start' : ''}>
          <div className={isList ? 'flex-1' : ''}>
            {/* Title Placeholder */}
            <div className={`h-7 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative mb-3 ${isList ? 'w-2/3' : 'w-3/4'}`}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            {/* Address Placeholder */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>

            {/* Description Placeholder (list only) */}
            {isList && (
               <div className="hidden sm:block mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
               </div>
            )}
          </div>

          {/* Price Placeholder (list only) */}
          {isList && (
            <div className="hidden sm:block text-right ml-4">
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-md relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 ml-auto relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
          )}
        </div>

        <div className={`mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50 ${isList ? 'flex items-center justify-between' : ''}`}>
          {/* Features Grid Placeholder */}
          <div className={`grid grid-cols-4 gap-2 text-center ${isList ? 'flex-1 max-w-md' : ''}`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <div className="w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            ))}
          </div>

          {/* Button Placeholder */}
          <div className={`${isList ? 'w-32 ml-4' : 'w-full mt-4'} h-10 bg-gray-200 dark:bg-gray-700 rounded-xl relative overflow-hidden`}>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
