import React, { useState, Suspense } from 'react';
import type { Imovel } from '../types';
import { MapPin, Bed, Bath, Car, Ruler, ExternalLink, Image as ImageIcon, Heart, Share2 } from 'lucide-react';
import { useToast } from './Toast';
import { clsx } from 'clsx';

// Lazy load the ImageGallery component
const ImageGallery = React.lazy(() => import('./ImageGallery'));

interface PropertyCardProps {
  imovel: Imovel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ imovel, isFavorite, onToggleFavorite }) => {
  const [showImages, setShowImages] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToast } = useToast();

  const formatCurrency = (value: number) =>
    value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isBelowAverage = imovel.valorMedioBairroPorAreaTotal > 0 && imovel.precoPorMetro < (imovel.valorMedioBairroPorAreaTotal / imovel.areaTotal);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(imovel.link);
    addToast('Link copiado para a área de transferência!', 'success');
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700/50 group/card h-full backdrop-blur-sm">
        <div className="relative h-64 bg-gray-100 dark:bg-gray-700/50 cursor-pointer overflow-hidden" onClick={() => setShowImages(true)}>
          {imovel.imagens && imovel.imagens.length > 0 ? (
            <img
              src={imovel.imagens[0]}
              alt={imovel.titulo}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={clsx(
                "w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
               <ImageIcon size={48} strokeWidth={1} />
             </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity duration-300" />

          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover/card:translate-x-0 transition-transform duration-300">
             <button
                onClick={(e) => {
                   e.stopPropagation();
                   onToggleFavorite();
                }}
                className="p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                 <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
             <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-500 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                title="Compartilhar"
              >
                 <Share2 size={18} />
              </button>
          </div>

          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
             <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-900 dark:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border border-white/20">
                {imovel.site}
             </div>
             {isBelowAverage && (
               <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                 Oportunidade
               </div>
             )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
             <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                   {formatCurrency(imovel.valor)}
                </span>
                {imovel.precoPorMetro > 0 && (
                  <span className="text-xs font-medium text-gray-200 drop-shadow-sm">
                    {formatCurrency(imovel.precoPorMetro)}/m²
                  </span>
                )}
             </div>
             {imovel.imagens && imovel.imagens.length > 0 && (
                <div className="bg-black/40 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium border border-white/10">
                  <ImageIcon size={14} />
                  {imovel.imagens.length}
                </div>
             )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-4">
          <div>
             <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-[3.5rem] hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title={imovel.titulo}>
               {imovel.titulo}
             </h3>
             <div className="flex items-start mt-3 text-gray-500 dark:text-gray-400 text-sm gap-2">
               <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
               <span className="line-clamp-2">{imovel.endereco}</span>
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
             className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] mt-2 group/btn"
           >
             Ver Detalhes
             <ExternalLink size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
           </a>
        </div>
      </div>

      {showImages && imovel.imagens && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>}>
          <ImageGallery
            images={imovel.imagens}
            onClose={() => setShowImages(false)}
          />
        </Suspense>
      )}
    </>
  );
};

const FeatureItem = ({ icon: Icon, value, label, suffix = '' }: { icon: any, value: number, label: string, suffix?: string }) => (
  <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
     <Icon size={20} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
     <div className="flex flex-col -gap-0.5">
        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none">{value}{suffix}</span>
        <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide leading-tight mt-1">{label}</span>
     </div>
  </div>
);
