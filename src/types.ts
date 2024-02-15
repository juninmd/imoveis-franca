
export interface Imoveis {
  site: string,
  titulo: string,
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
};

export interface Site {
  name: string,
  driver: 'axios' | 'puppet' | 'axios_rest',
  enabled: boolean,
  method?: string,
  payload?: any,
  waitFor?: string | undefined,
  disableQuery?: string,
  url: string,
  link?: string,
  translateParams?: { currentPage: string; maxPrice: string; minPrice: string },
  params?: any,
  itemsPerPage: number,
  getPaginateParams: (page: number) => { payload?: any, params?: any },
  adapter: (html: string) => Promise<{
    imoveis: Imoveis[],
    qtd: number
  }>
}