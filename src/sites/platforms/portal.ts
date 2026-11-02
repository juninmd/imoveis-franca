import { Imoveis, Site } from '../../types';

export type Finalidade = 'venda' | 'aluguel';
export type PortalParser = (html: string, siteName: string, host: string) => Promise<{ imoveis: Imoveis[], qtd: number, html: string }>;

interface PortalConfig {
  host: string;
  /** Dominio sem "www", usado no nome do site (ex.: "casamineira.com.br"). */
  label: string;
  pageSize: number;
  maxPages: number;
  driver: 'axios' | 'puppet';
  parser: PortalParser;
  firstPageUrl: (tipo: Finalidade) => string;
  pageUrl: (tipo: Finalidade, page: number) => string;
  /** Faixas de preco por finalidade: quebra uma busca maior que o teto de paginas do portal em varias buscas menores. */
  bands?: (tipo: Finalidade) => Array<Record<string, number>> | undefined;
  /** Listagens por tipo de imovel (casas, apartamentos...) quando a busca geral passa do teto de paginas. */
  variants?: (tipo: Finalidade) => Array<Record<string, string>> | undefined;
  variantPageUrl?: (tipo: Finalidade, page: number, variant: Record<string, string>) => string;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Monta o par venda/aluguel de um portal. O nome do site e a chave de cache, entao e unico por finalidade. */
export const buildPortalSites = (config: PortalConfig): Site[] =>
  (['venda', 'aluguel'] as Finalidade[]).map(tipo => {
    const name = `${config.label} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
    return {
      enabled: true,
      tipo,
      url: config.firstPageUrl(tipo),
      name,
      driver: config.driver,
      itemsPerPage: config.pageSize,
      // Portais agregadores tem milhares de anuncios: o teto limita o custo de cada scraping.
      maxPages: config.maxPages,
      ...(config.driver === 'axios' ? { axiosConfig: { headers: { 'User-Agent': UA } } } : {}),
      params: config.bands?.(tipo) ?? config.variants?.(tipo) ?? [],
      appendParams: !!config.bands?.(tipo),
      getPaginateParams: (page: number, variant?: Record<string, string>) => ({
        url: variant && config.variantPageUrl ? config.variantPageUrl(tipo, page, variant) : page > 1 ? config.pageUrl(tipo, page) : config.firstPageUrl(tipo),
      }),
      adapter: (html: string) => config.parser(html, name, config.host),
    } as unknown as Site;
  });
