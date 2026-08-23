import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X as XIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);

  const prevImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const nextImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage(e);
    if (e.key === 'ArrowLeft') prevImage(e);
    if (e.key === 'Escape') onClose();
  }, [nextImage, prevImage, onClose]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
        aria-label="Fechar galeria"
      >
        <XIcon size={24} />
      </button>

      <div
        className="relative w-full max-w-5xl max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={prevImage}
            className="absolute left-2 sm:left-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 hidden sm:flex"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <img
          src={images[currentImageIndex]}
          alt={`Imagem ${currentImageIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain select-none rounded-lg shadow-2xl"
          loading="eager"
        />

        {images.length > 1 && (
          <button
            onClick={nextImage}
            className="absolute right-2 sm:right-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 hidden sm:flex"
            aria-label="Próxima imagem"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {images.length > 1 && (
          <div className="absolute -bottom-10 left-0 right-0 text-center text-white/80 font-medium tracking-wide text-sm bg-black/50 py-1.5 px-4 rounded-full w-max mx-auto shadow-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
