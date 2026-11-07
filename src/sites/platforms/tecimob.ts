import axios from 'axios';
import { Imoveis, Site } from '../../types';
import { cleanTitle, extractDescriptionFromHtml, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../../utils';

const API = 'https://api-sites.tecimob.com.br/api/properties';
const DETAIL_CONCURRENCY = 8;

export type Tipo = 'venda' | 'aluguel';

// Tecimob (SPA): a API publica identifica o site pelo cabecalho x-domain e devolve o catalogo
// inteiro numa chamada. As fotos so existem no detalhe de cada imovel.
interface TecimobArea { value?: string }
interface TecimobRoom { value?: number }
interface TecimobProperty {
  id: string;
  price?: string;
  reference?: string;
  transaction?: string;
  title_formatted?: string;
  description?: string;
  url?: string;
  address?: { formatted?: string };
  areas?: { built_area?: TecimobArea; total_area?: TecimobArea };
  rooms?: { bedroom?: TecimobRoom; bathroom?: TecimobRoom; garage?: TecimobRoom };
}

const FRANCA = /Franca\/SP\s*$/i;

const fetchImages = async (id: string, domain: string): Promise<string[]> => {
  try {
    const { data } = await axios.get<{ data?: { images_extra?: Array<{ file_url?: { large?: string } }> } }>(`${API}/${id}`, { headers: { 'x-domain': domain, Accept: 'application/json' }, timeout: 30000 });
    return (data.data?.images_extra ?? []).map(image => image.file_url?.large).filter((url): url is string => !!url);
  } catch {
    // sem fotos de um imovel nao justifica perder o anuncio
    return [];
  }
};

// `transaction` ausente (catalogos antigos) vale para qualquer finalidade; presente, precisa casar.
const matchesTipo = (item: TecimobProperty, tipo: Tipo): boolean =>
  !item.transaction || item.transaction.toLowerCase().includes(tipo);

export async function parseTecimob(payload: unknown, domain: string, siteName: string, tipo: Tipo): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { data?: TecimobProperty[] };
  // A busca regional devolve Rifaina, Sacramento/MG etc.; so Franca interessa.
  const items = (body?.data ?? []).filter(item => FRANCA.test(item.address?.formatted ?? '') && item.url && matchesTipo(item, tipo));
  // Lotes pequenos: sao ~200 chamadas de detalhe e a API nao precisa ser martelada.
  const galleries: string[][] = [];
  for (let i = 0; i < items.length; i += DETAIL_CONCURRENCY) {
    galleries.push(...await Promise.all(items.slice(i, i + DETAIL_CONCURRENCY).map(item => fetchImages(item.id, domain))));
  }
  const imoveis: Imoveis[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const valor = getFixValue((item.price ?? '').replace(/[^\d.,]/g, ''));
    if (valor <= 0) continue;

    const titulo = cleanTitle(item.title_formatted ?? '');
    const area = getFixValue(item.areas?.built_area?.value ?? '0');
    const areaTotal = getFixValue(item.areas?.total_area?.value ?? '0') || area;
    const areaPreco = area || areaTotal;
    const bairro = (item.address?.formatted ?? '').replace(/\s*[-–,]\s*Franca\/SP\s*$/i, '');
    const descricao = extractDescriptionFromHtml(item.description ?? '');

    imoveis.push({
      titulo,
      descricao,
      imagens: galleries[index],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: item.rooms?.bedroom?.value ?? 0,
      banheiros: item.rooms?.bathroom?.value ?? 0,
      vagas: item.rooms?.garage?.value ?? 0,
      link: `https://${domain}/imovel/${item.url}`,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.reference,
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  }

  return { imoveis, qtd: imoveis.length, json: body };
}

/** Um site por finalidade; o nome e a chave de cache, entao precisa ser unico por finalidade. */
export const buildTecimobSites = (domain: string, label: string, tipos: Tipo[] = ['venda', 'aluguel']): Site[] =>
  tipos.map(tipo => {
    const name = `${label} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
    return {
      enabled: true, tipo, url: API, name, driver: 'axios_rest', method: 'GET', itemsPerPage: 1000,
      axiosConfig: { headers: { 'x-domain': domain, Accept: 'application/json' } },
      params: [],
      getPaginateParams: () => ({ url: API }),
      adapter: (payload: unknown) => parseTecimob(payload, domain, name, tipo),
    } as unknown as Site;
  });
