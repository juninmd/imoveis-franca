import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ImageGallery from './ImageGallery';

const images = ['a.jpg', 'b.jpg', 'c.jpg'];

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('ImageGallery', () => {
  it('is announced as a modal dialog and moves focus to the close button', () => {
    render(<ImageGallery images={images} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: 'Galeria de imagens' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('Fechar galeria')).toHaveFocus();
  });

  it('locks page scroll while open and restores focus and scroll on unmount', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<ImageGallery images={images} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('keeps Tab focus inside the dialog', () => {
    render(<ImageGallery images={images} onClose={() => {}} />);
    const close = screen.getByLabelText('Fechar galeria');
    const next = screen.getByLabelText('Próxima imagem');
    next.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(next).toHaveFocus();
  });

  it('navigates with arrow keys and closes on Escape', () => {
    const onClose = vi.fn();
    render(<ImageGallery images={images} onClose={onClose} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('status')).toHaveTextContent('3 / 3');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('changes image on horizontal swipe and ignores short touches', () => {
    render(<ImageGallery images={images} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 190 }] });
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3');
    fireEvent.touchStart(dialog, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 200 }] });
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
  });

  it('does not crash on an empty image list', () => {
    render(<ImageGallery images={[]} onClose={() => {}} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
