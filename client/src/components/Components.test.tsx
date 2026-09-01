import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';
import { ToastProvider } from './ToastContext';
import { EmptyState } from './EmptyState';
import { ScrollToTop } from './ScrollToTop';
import { Search } from 'lucide-react';

const mockImovel = {
  id: '1',
  titulo: 'Test Property',
  valor: 100000,
  tipo: 'venda',
  quartos: 2,
  banheiros: 1,
  vagas: 1,
  area: 50,
  areaTotal: 50,
  link: 'http://test.com',
  imagens: ['http://test.com/img.jpg'],
  precoPorMetro: 2000,
  site: 'test.com',
  endereco: 'Test Address'
};

const mockToast = vi.fn();
vi.mock('./ToastContext', async () => {
  const actual = await vi.importActual('./ToastContext');
  return {
    ...actual,
    useToast: () => ({ addToast: mockToast })
  };
});

describe('PropertyCard', () => {
  it('renders property details', () => {
    render(<PropertyCard imovel={mockImovel} isFavorite={false} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders empty state', () => {
    render(<EmptyState icon={Search} title="No results" description="Try again" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});

describe('ScrollToTop', () => {
  it('renders correctly', () => {
    render(<ScrollToTop />);
  });
});
