export interface Imoveis {
  site: string,
  titulo: string,
  descricao: string,
  imagens: string[],
  endereco: string,
  valor: number,
  area: number,
  areaTotal: number,
  quartos: number,
  link: string,
  banheiros: number,
  vagas: number,
  precoPorMetro: number,
  entrada: number,
  valorMedioBairroPorAreaTotal?: number; // Novo atributo
  tipo?: 'venda' | 'aluguel' | 'ambos', // Finalidade: comprar, alugar ou ambos
  codigo?: string, // Referencia do anuncio no site de origem
  tipoImovel?: string, // casa, apartamento, terreno, comercial, rural...
};

export interface Site {
  name: string,
  driver: 'axios' | 'puppet' | 'axios_rest',
  enabled: boolean,
  tipo?: 'venda' | 'aluguel' | 'ambos', // Finalidade do site; default 'ambos' quando ausente
  method?: string,
  payload?: any,
  waitFor?: string | undefined,
  axiosConfig?: any,
  disableQuery?: string,
  url: string,
  link?: string,
  translateParams?: { currentPage: string; maxPrice: string; minPrice: string },
  params?: any[],
  appendParams?: boolean, // Anexa `params` a URL devolvida por getPaginateParams (faixas de preco em portais)
  itemsPerPage: number,
  maxPages?: number, // Teto de paginas para portais enormes (milhares de anuncios)
  getPaginateParams: (page: number, params?: any) => { payload?: any, params?: any, path?: any, url?: string },
  adapter: (html: string) => Promise<{
    imoveis: Imoveis[],
    qtd: number,
    html?: string,
    json?: any,
  }>
}

export interface BaseQueryParams {
  minPrice: number,
  maxPrice: number,
  quartos: number,
  minArea: number,
  maxArea: number,
  maxPages?: number,
}