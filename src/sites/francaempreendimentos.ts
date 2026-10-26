import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.francaempreendimentos.com.br/imoveis',
  name: 'francaempreendimentos.com.br',
  driver: 'puppet',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.francaempreendimentos.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtd = 0; // Wix sites might require client-side render or API extraction, defaulting to 0 if not found
  const imoveis: Imoveis[] = [];

  // Parse elements if any render
  $('[data-testid="linkElement"]').each((_, el) => {
      const linkAttr = $(el).attr('href');
      if (linkAttr && linkAttr.includes('/imovel/')) {
          imoveis.push({
             titulo: 'Imóvel Franca Empreendimentos',
             descricao: '',
             imagens: [],
             endereco: 'Franca, SP',
             valor: 0,
             area: 0,
             areaTotal: 0,
             quartos: 0,
             link: linkAttr,
             banheiros: 0,
             vagas: 0,
             precoPorMetro: 0,
             site: 'francaempreendimentos.com.br',
             entrada: 0
          });
      }
  });

  return { imoveis, qtd, html };
}
