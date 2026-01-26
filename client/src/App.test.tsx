import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the API to avoid network calls and React Query errors
vi.mock('./api', () => ({
  fetchImoveis: vi.fn().mockImplementation(async () => {
    // Add a small delay to simulate network if needed, or return immediately
    return [
      {
        titulo: 'Casa Teste',
        valor: 500000,
        area: 100,
        quartos: 3,
        banheiros: 2,
        vagas: 2,
        endereco: 'CENTRO',
        link: 'http://test.com',
        precoPorMetro: 5000,
        imagens: [],
        site: 'TestSite'
      }
    ];
  }),
}));

// Mock scroll functions
window.scrollTo = vi.fn();

// Mock react-virtuoso to render items immediately
vi.mock('react-virtuoso', () => ({
  VirtuosoGrid: ({ totalCount, itemContent }: { totalCount: number; itemContent: (index: number) => React.ReactNode }) => (
    <div data-testid="virtuoso-grid">
      {Array.from({ length: totalCount }).map((_, index) => (
        <div key={index}>{itemContent(index)}</div>
      ))}
    </div>
  ),
}));

describe('App Component', () => {
  it('renders and displays title', async () => {
    render(<App />);

    // Check for main title
    expect(screen.getByText('Imóveis Franca')).toBeInTheDocument();

    // It might show loading first
    // expect(screen.getByText('Carregando...')).toBeInTheDocument();

    // Check if property is loaded (async)
    await waitFor(() => {
       expect(screen.getByText('Casa Teste')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
