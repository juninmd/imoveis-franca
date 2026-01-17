import React, { useState, Suspense } from 'react';
import type { Imovel } from '../types';
import { MapPin, Bed, Bath, Car, Ruler, ExternalLink, Image as ImageIcon, Heart, Share2 } from 'lucide-react';
import { useToast } from './Toast';

// Lazy load the ImageGallery component
const ImageGallery = React.lazy(() => import('./ImageGallery'));

interface PropertyCardProps {
  imovel: Imovel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ imovel, isFavorite, onToggleFavorite }) => {
  const [showImages, setShowImages] = useState(false);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 group/card">
        <div className="relative h-64 bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden" onClick={() => setShowImages(true)}>
          {imovel.imagens && imovel.imagens.length > 0 ? (
            <img
              src={imovel.imagens[0]}
              alt={imovel.titulo}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            />
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
               <ImageIcon size={48} strokeWidth={1.5} />
             </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 translate-x-4 group-hover/card:translate-x-0">
             <button
                onClick={(e) => {
                   e.stopPropagation();
                   onToggleFavorite();
                }}
                className="p-2.5 rounded-full bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm"
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                 <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
             <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-500 transition-colors shadow-sm backdrop-blur-sm"
                title="Compartilhar"
              >
                 <Share2 size={20} />
              </button>
          </div>

          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
             <div className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {imovel.site}
             </div>
             {isBelowAverage && (
               <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                 Oportunidade
               </div>
             )}
          </div>

          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1.5 font-medium">
             <ImageIcon size={14} />
             {imovel.imagens?.length || 0}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-4">
          <div>
            <div className="flex items-baseline gap-2 mb-1">
               <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                 {formatCurrency(imovel.valor)}
               </span>
            </div>
             {imovel.precoPorMetro > 0 && (
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {formatCurrency(imovel.precoPorMetro)}/m²
                </div>
             )}
          </div>

          <div>
             <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-[3rem]" title={imovel.titulo}>
               {imovel.titulo}
             </h3>
             <div className="flex items-start mt-2 text-gray-500 dark:text-gray-400 text-sm gap-1.5">
               <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
               <span className="line-clamp-1">{imovel.endereco}</span>
             </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
             <div className="grid grid-cols-4 gap-2 text-center">
               <FeatureItem icon={Bed} value={imovel.quartos} label="Quartos" />
               <FeatureItem icon={Bath} value={imovel.banheiros} label="Banheiros" />
               <FeatureItem icon={Car} value={imovel.vagas} label="Vagas" />
               <FeatureItem icon={Ruler} value={imovel.area} label="m²" suffix="" />
             </div>
          </div>

          <a
             href={imovel.link}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold text-sm shadow-sm hover:shadow active:scale-[0.98]"
           >
             Ver Detalhes <ExternalLink size={16} />
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
  <div className="flex flex-col items-center gap-1 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
     <Icon size={20} className="text-gray-400 dark:text-gray-500 mb-0.5" strokeWidth={1.5} />
     <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{value}{suffix}</span>
     <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold tracking-wide">{label}</span>
  </div>
);
