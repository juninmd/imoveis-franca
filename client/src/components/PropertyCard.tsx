import React from 'react';
import type { Imovel } from '../types';
import { MapPin, Bed, Bath, Car, Ruler, ExternalLink, Image as ImageIcon, Heart } from 'lucide-react';

interface PropertyCardProps {
  imovel: Imovel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ imovel, isFavorite, onToggleFavorite }) => {
  const [showImages, setShowImages] = React.useState(false);

  const formatCurrency = (value: number) =>
    value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isBelowAverage = imovel.valorMedioBairroPorAreaTotal > 0 && imovel.precoPorMetro < (imovel.valorMedioBairroPorAreaTotal / imovel.areaTotal);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
        <div className="relative h-56 bg-gray-200 dark:bg-gray-700 cursor-pointer group" onClick={() => setShowImages(true)}>
          {imovel.imagens && imovel.imagens.length > 0 ? (
            <img
              src={imovel.imagens[0]}
              alt={imovel.titulo}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
               <ImageIcon size={48} />
             </div>
          )}

          <button
            onClick={(e) => {
               e.stopPropagation();
               onToggleFavorite();
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-colors z-10 shadow-sm"
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
             <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
          </button>

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
             <div className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                {imovel.site}
             </div>
             {isBelowAverage && (
               <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                 Oportunidade
               </div>
             )}
          </div>

          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
             <ImageIcon size={12} />
             {imovel.imagens?.length || 0} fotos
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2" title={imovel.titulo}>
              {imovel.titulo}
            </h3>
            <div className="flex items-start mt-2 text-gray-500 dark:text-gray-400 text-sm gap-1">
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
              <span className="line-clamp-2">{imovel.endereco}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(imovel.valor)}
                </span>
                {imovel.precoPorMetro > 0 && (
                   <span className="text-xs text-gray-400 dark:text-gray-500">
                     {formatCurrency(imovel.precoPorMetro)}/m²
                   </span>
                )}
             </div>

             <div className="grid grid-cols-4 gap-2 text-center text-sm text-gray-600 dark:text-gray-300 mb-4">
               <div className="flex flex-col items-center gap-1">
                 <Bed size={18} className="text-gray-400 dark:text-gray-500" />
                 <span className="font-medium">{imovel.quartos}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <Bath size={18} className="text-gray-400 dark:text-gray-500" />
                 <span className="font-medium">{imovel.banheiros}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <Car size={18} className="text-gray-400 dark:text-gray-500" />
                 <span className="font-medium">{imovel.vagas}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <Ruler size={18} className="text-gray-400 dark:text-gray-500" />
                 <span className="font-medium">{imovel.area}m²</span>
               </div>
             </div>

             <a
               href={imovel.link}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
             >
               Ver Imóvel <ExternalLink size={14} />
             </a>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImages && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowImages(false)}
        >
          <div className="relative max-w-5xl w-full max-h-screen overflow-y-auto bg-black p-4 rounded-lg">
             <button
               onClick={() => setShowImages(false)}
               className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/50 rounded-full"
             >
               <X size={24} />
             </button>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {imovel.imagens.map((img, i) => (
                 <img key={i} src={img} alt={`Foto ${i+1}`} className="w-full h-auto rounded bg-gray-800" loading="lazy" />
               ))}
             </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper for closing icon in modal
function X({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
