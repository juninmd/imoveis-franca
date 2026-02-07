import React, { useState, Suspense, memo } from 'react';
import type { Imovel } from '../types';
import { MapPin, Bed, Bath, Car, Ruler, ExternalLink, Image as ImageIcon, Heart, Share2, TrendingDown } from 'lucide-react';
import { useToast } from './ToastContext';
import { clsx } from 'clsx';

// Lazy load the ImageGallery component
const ImageGallery = React.lazy(() => import('./ImageGallery'));

interface PropertyCardProps {
  imovel: Imovel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  viewMode?: 'grid' | 'list';
}

const FeatureItem = ({ icon: Icon, value, label, suffix = '' }: { icon: React.ElementType, value: number, label: string, suffix?: string }) => (
  <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors h-full">
     <Icon size={18} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
     <div className="flex flex-col items-center text-center">
        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none">{value}{suffix}</span>
        <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide leading-tight mt-1">{label}</span>
     </div>
  </div>
);

export const PropertyCard: React.FC<PropertyCardProps> = memo(({ imovel, isFavorite, onToggleFavorite, viewMode = 'grid' }) => {
  const [showImages, setShowImages] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToast } = useToast();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const isBelowAverage = imovel.valorMedioBairroPorAreaTotal > 0 && imovel.precoPorMetro < (imovel.valorMedioBairroPorAreaTotal / imovel.areaTotal);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(imovel.link);
    addToast('Link copiado para a área de transferência!', 'success');
  };

  return (
    <>
      <div className={clsx(
        "bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex border border-gray-100 dark:border-gray-700/50 group/card h-full",
        viewMode === 'list' ? "flex-col md:flex-row" : "flex-col"
      )}>
        {/* Image Section */}
        <div
            className={clsx(
              "relative bg-gray-100 dark:bg-gray-700/50 cursor-pointer overflow-hidden",
              viewMode === 'list' ? "w-full md:w-72 h-64 md:h-auto flex-shrink-0" : "w-full h-64"
            )}
            onClick={() => setShowImages(true)}
        >
          {imovel.imagens && imovel.imagens.length > 0 ? (
            <img
              src={imovel.imagens[0]}
              alt={imovel.titulo}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={clsx(
                "w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
               <ImageIcon size={48} strokeWidth={1} />
             </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover/card:translate-x-0 transition-transform duration-300 z-10">
             <button
                onClick={(e) => {
                   e.stopPropagation();
                   onToggleFavorite();
                }}
                className="p-2 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-label="Favoritar"
              >
                 <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
             <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-500 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                title="Compartilhar"
                aria-label="Compartilhar"
              >
                 <Share2 size={18} />
              </button>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none z-10">
             <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-900 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border border-white/20">
                {imovel.site}
             </div>
             {isBelowAverage && (
               <div className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                 <TrendingDown size={12} strokeWidth={3} />
                 Oportunidade
               </div>
             )}
          </div>

          {/* Price & Image Count */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white z-10">
             <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                   {formatCurrency(imovel.valor)}
                </span>
                {imovel.precoPorMetro > 0 && (
                  <span className="text-xs font-medium text-gray-300 drop-shadow-sm bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm inline-block mt-1">
                    {formatCurrency(imovel.precoPorMetro)}/m²
                  </span>
                )}
             </div>
             {imovel.imagens && imovel.imagens.length > 0 && (
                <div className="bg-black/40 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium border border-white/10">
                  <ImageIcon size={12} />
                  {imovel.imagens.length}
                </div>
             )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          <div>
             <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-[3.5rem] group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors" title={imovel.titulo}>
               {imovel.titulo}
             </h3>
             <div className="flex items-start mt-3 text-gray-500 dark:text-gray-400 text-sm gap-2">
               <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
               <span className="line-clamp-2">{imovel.endereco || "Endereço não informado"}</span>
             </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
             <div className="grid grid-cols-4 gap-2 text-center">
               <FeatureItem icon={Bed} value={imovel.quartos} label="Quartos" />
               <FeatureItem icon={Bath} value={imovel.banheiros} label="Banhos" />
               <FeatureItem icon={Car} value={imovel.vagas} label="Vagas" />
               <FeatureItem icon={Ruler} value={imovel.area} label="m²" suffix="" />
             </div>
          </div>

          <a
             href={imovel.link}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold text-sm shadow hover:shadow-md active:scale-[0.98] mt-2 group/btn"
           >
             Ver Detalhes
             <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
           </a>
        </div>
      </div>

      {showImages && imovel.imagens && (
        <Suspense fallback={null}>
          <ImageGallery
            images={imovel.imagens}
            onClose={() => setShowImages(false)}
          />
        </Suspense>
      )}
    </>
  );
});

PropertyCard.displayName = 'PropertyCard';
