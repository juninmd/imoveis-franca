export interface Imovel {
  site: string;
  titulo: string;
  descricao: string;
  imagens: string[];
  endereco: string;
  valor: number;
  area: number;
  areaTotal: number;
  quartos: number;
  link: string;
  banheiros: number;
  vagas: number;
  precoPorMetro: number;
  entrada: number;
  valorMedioBairroPorAreaTotal: number;
  tipo: 'venda' | 'aluguel' | 'ambos';
}

export interface ApiParsedResponse {
  data: Imovel[];
}
