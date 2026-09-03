import React, { useState, Suspense, memo } from 'react';
import type { Imovel } from '../types';
import { MapPin, Bed, Bath, Car, Ruler, ExternalLink, Image as ImageIcon, Heart, Share2, TrendingDown } from 'lucide-react';
import { useToast } from './ToastContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ImageGallery = React.lazy(() => import('./ImageGallery'));

interface PropertyCardProps {
  imovel: Imovel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  viewMode?: 'grid' | 'list';
}

const FeatureItem = ({ icon: Icon, value, label, suffix = '' }: { icon: React.ElementType, value: number, label: string, suffix?: string }) => {
  const isMissing = !value || value <= 0;
  const displayValue = !isMissing ? `${value}${suffix}` : '-';
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors h-full border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
       <Icon size={18} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
       <div className="flex flex-col items-center text-center">
          <span className={clsx("font-bold text-sm leading-none", isMissing ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100")}>{displayValue}</span>
          <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide leading-tight mt-1">{label}</span>
       </div>
    </div>
  );
};

export const PropertyCard: React.FC<PropertyCardProps> = memo(({ imovel, isFavorite, onToggleFavorite, viewMode = 'grid' }) => {
  const [showImages, setShowImages] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToast } = useToast();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const isBelowAverage = (imovel.valorMedioBairroPorAreaTotal || 0) > 0 && imovel.precoPorMetro < ((imovel.valorMedioBairroPorAreaTotal || 0) / imovel.areaTotal);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(imovel.link);
    addToast('Link copiado para a área de transferência!', 'success');
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={clsx(
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex border border-white/20 dark:border-gray-700/50 group/card h-full transform hover:-translate-y-1 hover:scale-[1.015]",
        viewMode === 'list' ? "flex-col md:flex-row" : "flex-col"
      )}>
        <div
            className={clsx(
              "relative bg-gray-100 dark:bg-gray-800/80 cursor-pointer overflow-hidden isolate",
              viewMode === 'list' ? "w-full md:w-80 h-64 md:h-auto flex-shrink-0" : "w-full h-64"
            )}
            onClick={() => setShowImages(true)}
        >
          {imovel.imagens && imovel.imagens.length > 0 ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
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
            </>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
               <ImageIcon size={48} strokeWidth={1} />
             </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />

          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover/card:translate-x-0 transition-transform duration-300 z-10">
             <button
                onClick={(e) => {
                   e.stopPropagation();
                   onToggleFavorite();
                }}
                className="p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-all shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 border border-white/20 dark:border-gray-700/50"
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-label="Favoritar"
              >
                 <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
             <button
                onClick={handleShare}
                className="group p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-500 transition-all shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 border border-white/20 dark:border-gray-700/50"
                title="Compartilhar"
                aria-label="Compartilhar"
              >
                 <Share2 size={18} className="transition-transform group-hover:rotate-12" />
              </button>
          </div>

          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none z-10">
             {imovel.tipo === 'aluguel' && (
               <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-wider shadow-sm border border-emerald-400/50">
                  Aluguel
               </div>
             )}
             {imovel.site && (
               <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-wider shadow-sm border border-white/20">
                  {imovel.site.replace('www.', '')}
               </div>
             )}
             <AnimatePresence>
               {isBelowAverage && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-gradient-to-r from-green-600 to-emerald-600 backdrop-blur-sm text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5 border border-green-400/50"
                 >
                   <TrendingDown size={14} strokeWidth={3} className="animate-pulse" />
                   Abaixo da Média
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white z-10">
             <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                   {formatCurrency(imovel.valor)}{imovel.tipo === 'aluguel' && <span className="text-sm font-semibold">/mês</span>}
                </span>
                {imovel.precoPorMetro > 0 && (
                  <span className="text-xs font-semibold text-emerald-300 drop-shadow-sm bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm inline-block mt-1 border border-white/10 w-fit">
                    {formatCurrency(imovel.precoPorMetro)}/m²
                  </span>
                )}
             </div>
             {imovel.imagens && imovel.imagens.length > 0 && (
                <div className="bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium border border-white/20 shadow-sm">
                  <ImageIcon size={14} />
                  {imovel.imagens.length}
                </div>
             )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
          <div>
             <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 min-h-[3.5rem] group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors" title={imovel.titulo}>
               {imovel.titulo}
             </h3>
             <div className="flex items-start mt-3 text-gray-500 dark:text-gray-400 text-sm gap-2 group-hover/card:text-gray-700 dark:group-hover/card:text-gray-300 transition-colors">
               <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
               <span className="line-clamp-2 font-medium">{imovel.endereco || "Endereço não informado"}</span>
             </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
             <div className="grid grid-cols-4 gap-2.5 text-center">
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
             className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 backdrop-blur-md text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all font-bold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-[0.98] mt-2 group/btn relative overflow-hidden border border-blue-500/50"
           >
             <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
               Ver Detalhes
               <ExternalLink size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-out" />
           </a>
        </div>
      </motion.div>

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
