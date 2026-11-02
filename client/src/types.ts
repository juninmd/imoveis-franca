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
  codigo?: string;
  tipoImovel?: string;
}

export interface ApiParsedResponse {
  data: Imovel[];
}
