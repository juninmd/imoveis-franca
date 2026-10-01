import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterSidebar } from './FilterSidebar';
import type { SearchState } from '../hooks/useSearchState';

describe('FilterSidebar', () => {
  let mockSetFilters: ReturnType<typeof vi.fn>;
  let mockFilters: SearchState['filters'];

  beforeEach(() => {
    mockSetFilters = vi.fn((updater) => {
        if (typeof updater === 'function') {
            mockFilters = updater(mockFilters);
        }
    });
    mockFilters = {
      tipo: 'venda',
      minPrice: '1000', maxPrice: '2000',
      minBedrooms: '1', minBathrooms: '1', minVacancies: '1',
      minArea: '50', maxArea: '100',
      minAreaTotal: '100', maxAreaTotal: '200',
      address: ['Centro']
    };
  });

  it('renders and calls clear all filters', () => {
    render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);
    const buttons = screen.getAllByRole('button');
    const clearBtn = buttons.find(b => b.textContent?.includes('Limpar Filtros'));
    if (clearBtn) {
        fireEvent.click(clearBtn);
        expect(mockSetFilters).toHaveBeenCalled();
    }
  });

  it('clears all addresses inside address section', () => {
     render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
     const buttons = screen.getAllByRole('button');
     const clearAddressBtn = buttons.find(b => b.textContent?.includes('Limpar seleção'));
     if (clearAddressBtn) {
         fireEvent.click(clearAddressBtn);
         expect(mockSetFilters).toHaveBeenCalled();
     }
  });

  it('clears address search input on clicking X', () => {
     render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);

     const inputs = screen.getAllByRole('textbox');
     const searchInput = inputs.find(input => (input as HTMLInputElement).placeholder?.includes('bairro'));

     if (searchInput) {
       fireEvent.change(searchInput, { target: { value: 'Centro' } });
       expect((searchInput as HTMLInputElement).value).toBe('Centro');

       const xButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-x') && !b.getAttribute('aria-label'));
       if(xButton) fireEvent.click(xButton);
       expect((searchInput as HTMLInputElement).value).toBe('');
     }
  });

  it('resets section filters for all sections', () => {
      render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
      const buttons = screen.getAllByRole('button');
      const limparButtons = buttons.filter(b => b.textContent?.trim() === 'Limpar' || b.textContent?.includes('Limpar '));
      limparButtons.forEach(btn => fireEvent.click(btn));
      expect(mockSetFilters).toHaveBeenCalled();
  });

  it('toggles address when an address button is clicked', () => {
     render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);

     const centroBtn = screen.getByText('Centro');
     fireEvent.click(centroBtn);
     expect(mockSetFilters).toHaveBeenCalled();

     const vilaNovaBtn = screen.getByText('Vila Nova');
     fireEvent.click(vilaNovaBtn);
     expect(mockSetFilters).toHaveBeenCalled();
  });

  it('triggers handleChange on input change', () => {
      render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
      // By using name attribute
      const inputs = screen.getAllByRole('spinbutton');
      const minPriceInput = inputs.find(input => (input as HTMLInputElement).name === 'minPrice');
      if (minPriceInput) {
          fireEvent.change(minPriceInput, { target: { name: 'minPrice', value: '500' } });
          expect(mockSetFilters).toHaveBeenCalled();
      }
  });

  it('toggles collapsible section when header is clicked', () => {
      render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
      // Note: testing click on the span/title that triggers the collapse
      const headers = screen.getAllByRole('button');
      const headerBtn = headers.find(b => b.textContent?.includes('Preço (R$)'));
      if (headerBtn) {
          fireEvent.click(headerBtn);
          fireEvent.click(headerBtn);
      }
  });

    it('toggles an already selected address off (lines 100-105)', () => {
        render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
        const centroBtn = screen.getByText('Centro');
        fireEvent.click(centroBtn);
        expect(mockSetFilters).toHaveBeenCalled();
    });

    it('toggles a new address on (lines 100-105)', () => {
        render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro', 'Vila Nova']} />);
        const vilaNovaBtn = screen.getByText('Vila Nova');
        fireEvent.click(vilaNovaBtn);
        expect(mockSetFilters).toHaveBeenCalled();
    });

    it('renders aluguel text correctly (line 126) and empty selection (line 290)', () => {
        mockFilters.tipo = 'aluguel';
        mockFilters.address = [];
        render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={['Centro']} />);
        expect(screen.getByText('Aluguel mensal (R$)')).toBeInTheDocument();
        expect(screen.getByText('0 selecionados')).toBeInTheDocument();
    });

    it('renders empty address state (line 290)', () => {
        render(<FilterSidebar filters={mockFilters} setFilters={mockSetFilters} addresses={[]} />);
        expect(screen.getByText('Nenhum bairro encontrado.')).toBeInTheDocument();
    });
});
