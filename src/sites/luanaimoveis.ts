import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.luanaimoveis.com.br/imoveis/a-venda/franca',
  name: 'luanaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.luanaimoveis.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imovel[] = [];

  const jsonLd = $('script[type="application/ld+json"]');

  if (jsonLd.length > 1) {
      try {
          const list = JSON.parse($(jsonLd[1]).html() || '{}');
          if (list && list.itemListElement) {
              list.itemListElement.forEach((li: any) => {
                 const item = li.item;
                 if (!item || !item.address || !item.offers) return;
                 if (item.address.addressLocality && item.address.addressLocality.toLowerCase().includes('franca')) {

                     let area = 0, quartos = 0;
                     const banheiros = 0, vagas = 0;
                     const nameTokens = item.name.toLowerCase().split(' ');

                     if (item.name.toLowerCase().includes('m²')) {
                         const m2Idx = nameTokens.indexOf('m²');
                         if(m2Idx > 0) area = parseFloat(nameTokens[m2Idx - 1]);
                     }

                     if(item.name.toLowerCase().includes('quarto') || item.name.toLowerCase().includes('quartos')) {
                        const qIdx = nameTokens.findIndex((t: string) => t.startsWith('quarto'));
                        if(qIdx > 0) quartos = parseInt(nameTokens[qIdx - 1]);
                     }

                     const valor = item.offers.price || 0;

                     if (valor > 0) {
                         imoveis.push({
                             titulo: item.name,
                             descricao: '',
                             link: item.url,
                             endereco: normalizeNeighborhoodName(item.address.streetAddress || 'Franca'),
                             valor,
                             area,
                             areaTotal: area,
                             quartos,
                             banheiros,
                             vagas,
                             imagens: item.image || [],
                             precoPorMetro: area > 0 ? valor / area : 0,
                             site: 'luanaimoveis.com.br',
                             entrada: valor * 0.20
                         });
                     }
                 }
              });
          }
      } catch (e) {
          // parse error
      }
  }

  const qtd = imoveis.length;

  return { imoveis, qtd, html };
}
