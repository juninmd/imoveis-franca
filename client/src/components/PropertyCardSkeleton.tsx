export const PropertyCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm h-full overflow-hidden border border-gray-100 dark:border-gray-700/50 flex flex-col">
      {/* Image Placeholder */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-700 animate-pulse">
         {/* Badge Placeholder */}
         <div className="absolute top-3 left-3 w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded-md" />
         {/* Price Placeholder */}
         <div className="absolute bottom-4 left-4 w-32 h-8 bg-gray-300 dark:bg-gray-600 rounded-md" />
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div>
           {/* Title Placeholder */}
           <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-3" />
           {/* Address Placeholder */}
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
           </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
           {/* Features Grid Placeholder */}
           <div className="grid grid-cols-4 gap-2 text-center">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
              ))}
           </div>
        </div>

        {/* Button Placeholder */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full mt-2 animate-pulse" />
      </div>
    </div>
  );
};
