import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X as XIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 50;

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prevImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const nextImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage(e);
    if (e.key === 'ArrowLeft') prevImage(e);
    if (e.key === 'Escape') onClose();
    if (e.key === 'Tab' && dialogRef.current) {
      // Keep Tab inside the modal so focus never lands on the page behind it.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [nextImage, prevImage, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Move focus into the dialog, lock page scroll, and restore both on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // The prev/next buttons are hidden below `sm`, so touch users need a swipe.
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (start === null || end === undefined || images.length < 2) return;
    const delta = end - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) nextImage(); else prevImage();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de imagens"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        ref={closeRef}
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
          <div role="status" aria-live="polite" className="absolute -bottom-10 left-0 right-0 text-center text-white/80 font-medium tracking-wide text-sm bg-black/50 py-1.5 px-4 rounded-full w-max mx-auto shadow-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
