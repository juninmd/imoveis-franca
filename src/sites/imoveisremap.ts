import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.imoveisremap.com.br/imoveis/a-venda/franca',
  name: 'imoveisremap.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.imoveisremap.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let schemaData: any = null;
  $('script[type="application/ld+json"]').each((_i, el) => {
      const content = $(el).html();
      if (content && content.includes('ItemList')) {
         try {
             schemaData = JSON.parse(content);
         } catch (e) { /* ignore */ }
      }
  });

  let qtd = 0;

  if (schemaData && schemaData.itemListElement) {
     qtd = schemaData.numberOfItems || 0;

     schemaData.itemListElement.forEach((itemList: any) => {
         const item = itemList.item;
         if (!item) return;

         const titulo = item.name || '';
         const link = item.url || '';
         let valor = 0;
         if (item.offers && item.offers.price) {
             valor = parseFloat(item.offers.price);
         }

         let imagens: string[] = [];
         if (item.image) {
             imagens = Array.isArray(item.image) ? item.image : [item.image];
         }

         let endereco = 'Franca';
         if (item.name && item.name.includes('-')) {
             const parts = item.name.split('-');
             if (parts.length > 1 && parts[1]) {
                endereco = parts[1].split(',')[0].trim();
             }
         }
         endereco = normalizeNeighborhoodName(endereco);

         let area = 0, quartos = 0, banheiros = 0, vagas = 0;

         // extract details by matching the link in the DOM
         if (link) {
             try {
                 const linkPath = new URL(link).pathname;
                 $('a').each((_i, aEl) => {
                     const href = $(aEl).attr('href');
                     if (href && href === linkPath) {
                         const text = $(aEl).parent().text().toLowerCase();
                         const qMatch = text.match(/(\d+)\s*(quartos|dorm)/i);
                         if (qMatch) quartos = parseInt(qMatch[1]);
                         const bMatch = text.match(/(\d+)\s*(banheiros|su[ií]tes?)/i);
                         if (bMatch) banheiros = parseInt(bMatch[1]);
                         const vMatch = text.match(/(\d+)\s*(vagas?|garagem)/i);
                         if (vMatch) vagas = parseInt(vMatch[1]);
                         const aMatch = text.match(/(\d+)\s*m/i);
                         if (aMatch) area = parseInt(aMatch[1]);
                     }
                 });
             } catch (e) { /* ignore */ }
         }

         if (valor > 0 && link && !imoveis.find(i => i.link === link)) {
             imoveis.push({
                 titulo,
                 descricao: '',
                 imagens,
                 endereco,
                 valor,
                 area,
                 areaTotal: area,
                 quartos,
                 link,
                 banheiros,
                 vagas,
                 precoPorMetro: area > 0 ? valor / area : 0,
                 site: 'imoveisremap.com.br',
                 entrada: valor * 0.20
             });
         }
     });
  }

  return { imoveis, qtd: qtd || imoveis.length, html };
}
