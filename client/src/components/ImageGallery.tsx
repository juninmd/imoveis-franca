import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X as XIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
         onClick={onClose}
         className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
       >
         <XIcon size={24} />
       </button>

       <div className="relative w-full max-w-6xl aspect-video max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {images.length > 1 && (
             <>
                <button
                   onClick={prevImage}
                   className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all z-10 backdrop-blur-sm hover:scale-110"
                >
                   <ChevronLeft size={32} />
                </button>
                <button
                   onClick={nextImage}
                   className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all z-10 backdrop-blur-sm hover:scale-110"
                >
                   <ChevronRight size={32} />
                </button>
             </>
          )}

          <img
             src={images[currentImageIndex]}
             alt={`Foto ${currentImageIndex + 1}`}
             className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium">
             {currentImageIndex + 1} / {images.length}
          </div>
       </div>
    </div>
  );
};

export default ImageGallery;
