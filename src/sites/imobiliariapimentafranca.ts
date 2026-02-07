import cheerio from 'cheerio';
import { getFixValue, normalizeNeighborhoodName } from '../utils';
import { Imoveis, Site } from '../types';
import axios from 'axios';

export default {
  enabled: true,
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
  const qtd = Number($('.cabecalho > div:nth-child(1) > strong:nth-child(1)').text().replace(/\D/g, ''));

  const imoveis: Imoveis[] = [];
  for (const el of $('.item-lista')) {
    const titulo = $(el).find('div.item-lista:nth-child(2) > div:nth-child(2) > a:nth-child(1) > small:nth-child(2)').text();
    const endereco = normalizeNeighborhoodName($(el).find('div:nth-child(2) > a:nth-child(1) > h3:nth-child(1)').text().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").split(',')[0]);
    const valor = parseFloat(($(el).find('div.desc-item-lista > ul:nth-child(2) > a:nth-child(1) > li:nth-child(1)').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0]) || '0');
    const area = getFixValue($(el).find('.icones.ico2').find('a[data-tooltip="Área"]').text().replace('m²', '').trim() || '0');
    const areaTotal = getFixValue($(el).find('.icones.ico2').find('a[data-tooltip="Área"]').text().replace('m²', '').trim() || '0');
    const quartos = $(el).find('.icones.ico2').find('a[data-tooltip="Dormitórios"]').text().trim();
    const banheiros = $(el).find('.icones.ico2').find('a[data-tooltip="Banheiros"]').text().trim();
    const vagas = $(el).find('.icones.ico2').find('a[data-tooltip="Vagas"]').text().trim();
    const link = 'https://www.imobiliariapimentafranca.com.br' + $(el).find('a.btver.cor0').attr('href');

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