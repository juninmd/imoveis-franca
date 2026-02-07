import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from './FilterSidebar';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('FilterSidebar', () => {
  const mockSetFilters = vi.fn();
  const defaultFilters = {
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    minBathrooms: '',
    minVacancies: '',
    minArea: '',
    maxArea: '',
    minAreaTotal: '',
    maxAreaTotal: '',
    address: [] as string[]
  };

  const addresses = ['Centro', 'Jardim Lima', 'Vila Nova'];

  beforeEach(() => {
    mockSetFilters.mockClear();
  });

  it('renders all sections', () => {
    render(<FilterSidebar filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);

    expect(screen.getByText(/Preço \(R\$\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Características/i)).toBeInTheDocument();
    expect(screen.getByText(/Área Útil \(m²\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Área Terreno \(m²\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Endereços/i)).toBeInTheDocument();
  });

  it('updates input values', () => {
    const { container } = render(<FilterSidebar filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);

    const minPriceInput = container.querySelector('input[name="minPrice"]');
    expect(minPriceInput).toBeInTheDocument();

    if (minPriceInput) {
        fireEvent.change(minPriceInput, { target: { name: 'minPrice', value: '1000' } });
        expect(mockSetFilters).toHaveBeenCalled();
    }
  });

  it('toggles address selection', () => {
    render(<FilterSidebar filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);

    const addressButton = screen.getByText('Centro');
    fireEvent.click(addressButton);
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('filters addresses by search', () => {
    render(<FilterSidebar filters={defaultFilters} setFilters={mockSetFilters} addresses={addresses} />);

    const searchInput = screen.getByPlaceholderText('Filtrar bairros...');
    fireEvent.change(searchInput, { target: { value: 'Lima' } });

    expect(screen.getByText('Jardim Lima')).toBeInTheDocument();
    expect(screen.queryByText('Centro')).not.toBeInTheDocument();
  });
});
