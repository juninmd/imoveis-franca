import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyCard } from './PropertyCard';
import { ToastProvider } from './Toast';
import type { Imovel } from '../types';

const imovel = (over: Partial<Imovel> = {}): Imovel => ({
  site: 'exemplo.com.br', titulo: 'Casa no Centro', descricao: '', imagens: [], endereco: 'CENTRO',
  valor: 350000, area: 90, areaTotal: 180, quartos: 3, link: 'https://exemplo.com.br/1',
  banheiros: 2, vagas: 1, precoPorMetro: 1944, entrada: 70000,
  valorMedioBairroPorAreaTotal: 0, tipo: 'venda', ...over,
});

const renderCard = (over: Partial<Imovel> = {}) =>
  render(
    <ToastProvider>
      <PropertyCard imovel={imovel(over)} isFavorite={false} onToggleFavorite={vi.fn()} />
    </ToastProvider>,
  );

describe('PropertyCard', () => {
  it('aponta para o anúncio quando o link é http(s)', () => {
    renderCard();
    expect(screen.getByRole('link', { name: /Ver Detalhes/ })).toHaveAttribute('href', 'https://exemplo.com.br/1');
  });

  it('não renderiza href para um link com esquema perigoso', () => {
    // O servidor já descarta esses anúncios, mas uma resposta gravada no cache antes deste
    // deploy ainda chega aqui. O React neutraliza o `javascript:` sozinho — o que se corrige
    // aqui é prometer um "Ver Detalhes" que não abre nada.
    renderCard({ link: 'javascript:alert(1)' });

    expect(screen.queryByRole('link', { name: /Ver Detalhes/ })).not.toBeInTheDocument();
    const cta = screen.getByText('Link indisponível').closest('a');
    expect(cta).not.toHaveAttribute('href');
    expect(cta).toHaveAttribute('aria-disabled', 'true');
  });

  it('renderiza o card inteiro mesmo com link inválido', () => {
    renderCard({ link: 'javascript:alert(1)' });
    expect(screen.getByText('Casa no Centro')).toBeInTheDocument();
  });
});
