import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: false,
  tipo: 'venda',
  url: 'https://www.luanaimoveis.com.br/imoveis/a-venda',
  name: 'luanaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.luanaimoveis.com.br/imoveis/a-venda?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;

  const scriptTags = $('script[type="application/ld+json"]');
  scriptTags.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      if (json['@type'] === 'ItemList' && json.itemListElement) {
        qtd = json.itemListElement.length;
        json.itemListElement.forEach((item: any) => {
           if(item.item && item.item['@type'] === 'RealEstateListing') {
             const titulo = item.item.name || '';
             const link = item.item.url;

             let enderecoStr = '';
             let bairro = 'Franca';
             if (item.item.address) {
                 bairro = item.item.address.streetAddress || 'Franca';
                 enderecoStr = normalizeNeighborhoodName(bairro);
             }

             // Check if it's in Franca since we are searching globally on the site
             // if (!titulo.toLowerCase().includes('franca') && !enderecoStr.toLowerCase().includes('franca') && bairro.toLowerCase() !== 'franca') {
             //     return; // Uncomment to strict filter, let's include anything the site gives us for now or rely on the site's default results
             // }

             let valor = 0;
             if (item.item.offers && item.item.offers.price) {
                 valor = typeof item.item.offers.price === 'string' ? getFixValue(item.item.offers.price) : item.item.offers.price;
             }

             let imagens: string[] = [];
             if (item.item.image) {
                 if (Array.isArray(item.item.image)) {
                     imagens = item.item.image;
                 } else if (typeof item.item.image === 'string') {
                     imagens = [item.item.image];
                 }
             }

             if (link && valor > 0) {
                 imoveis.push({
                     titulo,
                     descricao: titulo,
                     imagens,
                     endereco: enderecoStr,
                     valor,
                     area: 0,
                     areaTotal: 0,
                     quartos: 0,
                     link,
                     banheiros: 0,
                     vagas: 0,
                     precoPorMetro: 0,
                     site: 'luanaimoveis.com.br',
                     entrada: valor * 0.20
                 });
             }
           }
        });
      }
    } catch(e) {
      // ignore JSON parse errors from invalid script tags
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? (qtd > 0 ? 50 : 0) : 0, html };
}
