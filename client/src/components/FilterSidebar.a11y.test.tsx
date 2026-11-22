import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSidebar } from './FilterSidebar';

const filters = {
  tipo: 'venda' as const,
  minPrice: '', maxPrice: '',
  minBedrooms: '', minBathrooms: '', minVacancies: '',
  minArea: '', maxArea: '',
  minAreaTotal: '', maxAreaTotal: '',
  address: [], sites: [], tipoImovel: [], q: '',
};

const renderSidebar = () =>
  render(<FilterSidebar availableSites={[]} filters={filters} setFilters={vi.fn()} addresses={['Centro', 'Vila Nova']} />);

describe('FilterSidebar a11y', () => {
  it('section toggle exposes its expanded state and the panel it controls', () => {
    renderSidebar();
    const toggle = screen.getByRole('button', { name: /Endereços/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toContainElement(screen.getByRole('textbox', { name: 'Filtrar bairros' }));

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('icon-only clear button for the neighborhood search has an accessible name', () => {
    renderSidebar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar bairros' }), { target: { value: 'cen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca de bairros' }));
    expect(screen.getByRole('textbox', { name: 'Filtrar bairros' })).toHaveValue('');
  });
});
