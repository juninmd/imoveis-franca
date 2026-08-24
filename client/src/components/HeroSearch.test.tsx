import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSearch } from './HeroSearch';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('HeroSearch', () => {
  const mockSetFilters = vi.fn();
  const defaultFilters = {
    tipo: 'venda' as const,
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    address: [] as string[],
  };
  const addresses = ['Centro', 'Jardim Lima'];

  beforeEach(() => {
    mockSetFilters.mockClear();
  });

  it('renders the Comprar tab as active by default', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);
    const comprarTab = screen.getByRole('tab', { name: /comprar/i });
    const alugarTab = screen.getByRole('tab', { name: /alugar/i });
    expect(comprarTab).toHaveAttribute('aria-selected', 'true');
    expect(alugarTab).toHaveAttribute('aria-selected', 'false');
  });

  it('switches tipo to aluguel on click', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);
    fireEvent.click(screen.getByRole('tab', { name: /alugar/i }));
    expect(mockSetFilters).toHaveBeenCalled();
    const updater = mockSetFilters.mock.calls[0][0];
    expect(updater(defaultFilters).tipo).toBe('aluguel');
  });

  it('reflects the aluguel tab as active when tipo is aluguel', () => {
    render(<HeroSearch filters={{ ...defaultFilters, tipo: 'aluguel' }} setFilters={mockSetFilters} addresses={addresses} />);
    expect(screen.getByRole('tab', { name: /alugar/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText('Aluguel mín.')).toBeInTheDocument();
  });

  it('updates minPrice on input change', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);
    fireEvent.change(screen.getByPlaceholderText('Valor mín.'), { target: { name: 'minPrice', value: '1000' } });
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('lists addresses in the select', () => {
    render(<HeroSearch filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);
    expect(screen.getByText('Jardim Lima')).toBeInTheDocument();
  });
});
