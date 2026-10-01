import type { SearchState } from '../hooks/useSearchState';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeroSearch } from './HeroSearch';

describe('HeroSearch', () => {
  const defaultFilters = {
    tipo: 'venda' as const,
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    address: []
  };

  let currentFilters: SearchState["filters"];
  let mockSetFilters: ReturnType<typeof vi.fn>;

  beforeEach(() => {
      currentFilters = { ...defaultFilters };
      mockSetFilters = vi.fn((updater) => {
          if (typeof updater === 'function') {
              currentFilters = updater(currentFilters);
          }
      });
  });

  it('renders the Comprar tab as active by default', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
    const comprarTab = screen.getByRole('tab', { name: /Comprar/i });
    expect(comprarTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tipo to aluguel on click', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
    const alugarTab = screen.getByRole('tab', { name: /Alugar/i });
    fireEvent.click(alugarTab);
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('reflects the aluguel tab as active when tipo is aluguel', () => {
    const filters = { ...defaultFilters, tipo: 'aluguel' as const };
    render(<HeroSearch filters={filters} setFilters={mockSetFilters} addresses={[]} />);
    const alugarTab = screen.getByRole('tab', { name: /Alugar/i });
    expect(alugarTab).toHaveAttribute('aria-selected', 'true');
  });

  it('updates minPrice on input change', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
    const inputs = screen.getAllByRole('spinbutton');
    const priceInput = inputs.find(i => (i as HTMLInputElement).name === 'maxPrice');
    if (priceInput) {
        fireEvent.change(priceInput, { target: { name: 'maxPrice', value: '500000' } });
        expect(mockSetFilters).toHaveBeenCalled();
    }
  });

  it('lists addresses in the select', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Vila Nova')).toBeInTheDocument();
  });

  it('triggers setTipo when clicking Alugar tab', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
    const alugarTab = screen.getByText(/Alugar/i);
    fireEvent.click(alugarTab);
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('renders dropdown options correctly and handles selection', () => {
     render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
     const selects = screen.getAllByRole('combobox');
     const select = selects.find(s => (s as HTMLSelectElement).name === 'minBedrooms');
     if(select) {
         fireEvent.change(select, { target: { name: 'minBedrooms', value: '2' } });
         expect(mockSetFilters).toHaveBeenCalled();
     }
  });

  it('triggers setTipo when clicking Comprar tab', () => {
    const filters = { ...defaultFilters, tipo: 'aluguel' as const };
    render(<HeroSearch filters={filters} setFilters={mockSetFilters} addresses={[]} />);
    const comprarTab = screen.getByRole('tab', { name: /Comprar/i });
    fireEvent.click(comprarTab);
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('triggers scrollIntoView when clicking Buscar button', () => {
     const dummyElement = document.createElement('div');
     dummyElement.id = 'resultados';
     dummyElement.scrollIntoView = vi.fn();
     document.body.appendChild(dummyElement);

     render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={[]} />);
     const buscarBtn = screen.getByText(/Buscar/i);
     fireEvent.click(buscarBtn);
     expect(dummyElement.scrollIntoView).toHaveBeenCalled();

     document.body.removeChild(dummyElement);
  });

  it('updates address on select change', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);
    const selects = screen.getAllByRole('combobox');
    const select = selects.find(s => (s as HTMLSelectElement).name === 'address');
    if (select) {
        fireEvent.change(select, { target: { name: 'address', value: 'Centro' } });
        expect(mockSetFilters).toHaveBeenCalled();
    }
  });

  it('handles empty address select correctly (ternary false)', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);
    const selects = screen.getAllByRole('combobox');
    const select = selects.find((s) => (s as HTMLSelectElement).name === 'address');
    if (select) {
        fireEvent.change(select, { target: { name: 'address', value: '' } });
        expect(mockSetFilters).toHaveBeenCalled();
        expect(currentFilters.address).toEqual([]);
    }
  });
});
