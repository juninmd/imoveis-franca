import * as cheerio from 'cheerio';
import { getFixValue, normalizeNeighborhoodName } from '../utils';
import { Imoveis, Site } from '../types';
import axios from 'axios';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.imobiliariapimentafranca.com.br/imovel',
  name: 'imobiliariapimentafranca.com.br',
  driver: 'puppet',
  itemsPerPage: 8,
  params: [{
    'pag': 1,
    'tipo': 'casa',
    'finalidade': 'venda',
    'cidade': 'Franca'
  }],
  getPaginateParams: (page: number) => ({ params: { pag: page } }),
  adapter,
  disableQuery: 'div.lista_imoveis_paginacao > a:nth-last-child(1).lipagina-btn-paginacao-atual',
  waitFor: undefined
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const qtd = Number((html.match(/var count = (\d+);/) || [])[1] || '0');

  const imoveis: Imoveis[] = [];
  for (const el of $('#listar_grade .imovel-item')) {
    const titulo = $(el).find('.item_info h3 a').text().trim();
    const endereco = normalizeNeighborhoodName($(el).find('.item_address p:contains("Bairro:")').text().replace('Bairro:', '').trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ""));
    const valor = parseFloat(($(el).find('.item_prices dd').first().text().replace('R$', '').replace(/\./g, '').trim().split(',')[0]) || '0');
    const area = getFixValue($(el).find('path[d^="M174.9 494.1"]').closest('span').find('.carac-name-list').text().replace('m²', '').trim() || '0');
    const areaTotal = getFixValue($(el).find('path[d^="M174.9 494.1"]').closest('span').find('.carac-name-list').text().replace('m²', '').trim() || '0');
    const quartos = $(el).find('path[d^="M32 32c17.7 0 32 14.3 32 32V320H288V160"]').closest('span').find('.carac-name-list').text().trim();
    const banheiros = $(el).find('path[d^="M24 0C10.7 0 0 10.7 0 24S10.7 48 24 48h8V196.9"]').closest('span').find('.carac-name-list').text().trim();
    const vagas = $(el).find('path[d^="M135.2 117.4L109.1 192H402.9"]').closest('span').find('.carac-name-list').text().trim();
    const link = 'https://www.imobiliariapimentafranca.com.br' + $(el).find('.item_info h3 a').attr('href');

    const { data: details } = await axios.get(link, {
      responseEncoding: 'latin1',
      headers: {
        'Accept': 'text/html', // Especifica que estamos aceitando HTML
      }
    } as any);

    const $$ = cheerio.load(details as any) as any;
    const imagens: string[] = [];
    $$('#gallery-1').find('a.rsImg > img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });
    const descricao = $$('div.item-imovel').text().trim();

    const precoPorMetro = valor / areaTotal;

    imoveis.push({
      titulo,
      descricao,
      imagens,
      endereco,
      valor: (valor),
      area: area,
      areaTotal: areaTotal,
      quartos: Number(quartos),
      link,
      banheiros: Number(banheiros),
      vagas: Number(vagas),
      precoPorMetro,
      site: 'imobiliariapimentafranca.com.br',
      entrada: valor * 0.20,
    });
  };
  return { imoveis, qtd, html };
};
