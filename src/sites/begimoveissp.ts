import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const HOST = 'https://www.begimoveissp.com.br';
const SITE_NAME = 'begimoveissp.com.br';

// Imobiliaria de Sao Paulo (Kenlo) que tambem anuncia em Franca; a pagina da cidade traz o
// catalogo inteiro num JSON-LD ItemList (nome, url, foto de capa e preco).
export default {
  enabled: true,
  tipo: 'ambos',
  url: `${HOST}/imoveis/franca`,
  name: SITE_NAME,
  driver: 'axios',
  itemsPerPage: 100,
  params: [],
  getPaginateParams: () => ({ url: `${HOST}/imoveis/franca` }),
  adapter,
} as Site;

interface ListingLd { name?: string; url?: string; image?: string[]; offers?: { price?: number | string; businessFunction?: string } }

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  $('script[type="application/ld+json"]').each((_i, script) => {
    let json: { '@type'?: string, itemListElement?: Array<{ item?: ListingLd }> };
    try {
      json = JSON.parse($(script).contents().text());
    } catch {
      return;
    }
    if (json['@type'] !== 'ItemList') return;

    for (const { item } of json.itemListElement ?? []) {
      const name = item?.name ?? '';
      const valor = getFixValue(String(item?.offers?.price ?? '0'));
      if (!item?.url || valor <= 0 || !/Franca - SP/i.test(name)) continue;

      // "Casa de 106 m² na Rua X - Residencial Zanetti - Franca - SP, à venda por R$ 490.000"
      const [head] = name.split(/,\s*(?:à venda|para alugar|para locação)/i);
      const parts = head.split(' - ');
      const bairro = parts.length >= 4 ? parts[parts.length - 3] : '';
      const tipoTexto = (head.match(/^(\w+)/) || [])[1] ?? '';
      const area = getFixValue((head.match(/([\d.,]+)\s*m²/) || [])[1] ?? '0');
      const quartos = parseInt((item.url.match(/(\d+)-quartos?/) || [])[1] ?? '', 10) || 0;
      const aluguel = /LeaseOut|alugar|loca/i.test(`${item.offers?.businessFunction ?? ''} ${name}`);

      imoveis.push({
        titulo: cleanTitle(`${tipoTexto} - ${bairro}`.replace(/ - $/, '')),
        descricao: cleanTitle(name),
        imagens: item.image ?? [],
        endereco: normalizeNeighborhoodName(bairro),
        valor,
        area,
        areaTotal: area,
        quartos,
        banheiros: 0,
        vagas: 0,
        link: item.url,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: SITE_NAME,
        entrada: valor * 0.20,
        tipo: aluguel ? 'aluguel' : 'venda',
        codigo: item.url.split('/').pop(),
        tipoImovel: inferTipoImovel(tipoTexto) || undefined,
      });
    }
  });

  return { imoveis, qtd: imoveis.length, html };
}
