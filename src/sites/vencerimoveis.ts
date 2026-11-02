import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const SITE_NAME = 'vencerimoveis.com.br';
// _fields corta os campos do WordPress que nao usamos; o catalogo inteiro (~60 itens) cabe em uma pagina.
const API = 'https://www.vencerimoveis.com.br/wp-json/wp/v2/estate?per_page=100&_fields=id,link,title,content,class_list,acf_fields';

// WordPress (tema MyHome): o tipo, a cidade e o bairro so existem como classes de taxonomia
// ("cidade-franca-sp", "bairro-jardim-natal"); o catalogo traz Rifaina e Cristais Paulista tambem.
export interface VencerItem {
  id?: number; link?: string; title?: { rendered?: string }; content?: { rendered?: string }; class_list?: string[];
  acf_fields?: { [key: string]: unknown; estate_gallery?: Array<{ url?: string }> | false };
}

const slug = (classes: string[], prefix: string): string => classes.find(c => c.startsWith(prefix))?.slice(prefix.length) ?? '';
const num = (v: unknown): number => getFixValue(String(v ?? '').replace(/[^\d.,]/g, ''));

export async function parseVencer(payload: unknown): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as VencerItem[];
  const imoveis: Imoveis[] = [];

  for (const item of Array.isArray(body) ? body : []) {
    const classes = item.class_list ?? [];
    const acf = item.acf_fields ?? {};
    const valor = num(acf.estate_attr_price);
    if (!item.id || !item.link || valor <= 0 || !classes.includes('cidade-franca-sp')) continue;

    const texto = cleanTitle(cheerio.load(item.content?.rendered ?? '').root().text());
    const area = num(acf['estate_attr_property-size']);
    const areaTotal = num(acf['estate_attr_lot-size']) || area;
    const areaPreco = area || areaTotal;
    const bairro = slug(classes, 'bairro-').replace(/-/g, ' ');
    const tipoTexto = slug(classes, 'tipo-imovel-');
    const gallery = Array.isArray(acf.estate_gallery) ? acf.estate_gallery : [];

    imoveis.push({
      titulo: cleanTitle(item.title?.rendered ?? ''),
      descricao: texto,
      imagens: gallery.map(g => (g.url ?? '').replace(/\?v=\d+$/, '')).filter(Boolean),
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: parseInt(String(acf.estate_attr_bedrooms ?? ''), 10) || 0,
      banheiros: parseInt(String(acf.estate_attr_bathrooms ?? ''), 10) || 0,
      vagas: parseInt((texto.match(/(\d+)\s*vagas?/i) || [])[1] ?? '', 10) || 0,
      link: item.link,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: SITE_NAME,
      entrada: valor * 0.20,
      codigo: String(item.id),
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: imoveis.length, json: body };
}

export default {
  enabled: true, tipo: 'venda', url: API, name: SITE_NAME, driver: 'axios_rest', method: 'GET', itemsPerPage: 100, params: [],
  getPaginateParams: () => ({ url: API }),
  adapter: parseVencer,
} as unknown as Site;
