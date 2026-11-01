import axios from 'axios';
import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const DOMAIN = 's2iinteligenciaimobiliaria.com.br';
const API = 'https://api-sites.tecimob.com.br/api/properties';
const SITE_NAME = DOMAIN;
const DETAIL_CONCURRENCY = 8;

// Tecimob (SPA): a API publica identifica o site pelo cabecalho x-domain e devolve o catalogo
// inteiro numa chamada. As fotos so existem no detalhe de cada imovel.
export default {
  enabled: true,
  tipo: 'venda',
  url: API,
  name: SITE_NAME,
  driver: 'axios_rest',
  method: 'GET',
  itemsPerPage: 1000,
  axiosConfig: { headers: { 'x-domain': DOMAIN, Accept: 'application/json' } },
  params: [],
  getPaginateParams: () => ({ url: API }),
  adapter,
} as unknown as Site;

interface TecimobArea { value?: string }
interface TecimobRoom { value?: number }
interface TecimobProperty {
  id: string;
  price?: string;
  reference?: string;
  title_formatted?: string;
  description?: string;
  url?: string;
  address?: { formatted?: string };
  areas?: { built_area?: TecimobArea; total_area?: TecimobArea };
  rooms?: { bedroom?: TecimobRoom; bathroom?: TecimobRoom; garage?: TecimobRoom };
}

const FRANCA = /Franca\/SP\s*$/i;

const headers = { 'x-domain': DOMAIN, Accept: 'application/json' };

const fetchImages = async (id: string): Promise<string[]> => {
  try {
    const { data } = await axios.get<{ data?: { images_extra?: Array<{ file_url?: { large?: string } }> } }>(`${API}/${id}`, { headers, timeout: 30000 });
    return (data.data?.images_extra ?? []).map(image => image.file_url?.large).filter((url): url is string => !!url);
  } catch {
    // sem fotos de um imovel nao justifica perder o anuncio
    return [];
  }
};

export async function adapter(payload: unknown): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { data?: TecimobProperty[] };
  // A busca regional devolve Rifaina, Sacramento/MG etc.; so Franca interessa.
  const items = (body?.data ?? []).filter(item => FRANCA.test(item.address?.formatted ?? '') && item.url);
  // Lotes pequenos: sao ~200 chamadas de detalhe e a API nao precisa ser martelada.
  const galleries: string[][] = [];
  for (let i = 0; i < items.length; i += DETAIL_CONCURRENCY) {
    galleries.push(...await Promise.all(items.slice(i, i + DETAIL_CONCURRENCY).map(item => fetchImages(item.id))));
  }
  const imoveis: Imoveis[] = [];

  items.forEach((item, index) => {
    const valor = getFixValue((item.price ?? '').replace(/[^\d.,]/g, ''));
    if (valor <= 0) return;

    const titulo = cleanTitle(item.title_formatted ?? '');
    const area = getFixValue(item.areas?.built_area?.value ?? '0');
    const areaTotal = getFixValue(item.areas?.total_area?.value ?? '0') || area;
    const areaPreco = area || areaTotal;
    const bairro = (item.address?.formatted ?? '').replace(/\s*[-–,]\s*Franca\/SP\s*$/i, '');

    imoveis.push({
      titulo,
      descricao: cleanTitle(cheerio.load(item.description ?? '').root().text()),
      imagens: galleries[index],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: item.rooms?.bedroom?.value ?? 0,
      banheiros: item.rooms?.bathroom?.value ?? 0,
      vagas: item.rooms?.garage?.value ?? 0,
      link: `https://${DOMAIN}/imovel/${item.url}`,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: SITE_NAME,
      entrada: valor * 0.20,
      codigo: item.reference,
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd: imoveis.length, json: body };
}
