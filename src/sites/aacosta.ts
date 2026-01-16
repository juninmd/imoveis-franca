import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';
import axios from 'axios';

export default {
  driver: 'puppet',
  enabled: true,
  waitFor: undefined,
  name: 'aacosta.com.br',
  url: 'https://www.aacosta.com.br/listagem.jsp',
  itemsPerPage: 10,
  params: [
    // {
    //   negociacao: 1, // aluguel
    //   tipo: 0,
    //   cidade: 1,
    //   ordem: 'preco'
    // },
    {
      negociacao: 2, // compra
      tipo: 1, // casa
      cidade: 1,
      ordem: 'preco'
    }],
  translateParams: {
    currentPage: 'numpagina',
    maxPrice: undefined,
    minPrice: undefined,
  },
  getPaginateParams: (page: number) => ({ params: { numpagina: page } }),
  disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
  adapter,
} as Site

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const qtd = Number($('ul>span.proerty-price.pull-right>h4').text().replace(/\D/g, ''));
  const imoveis: Imoveis[] = [];
  for (const el of $('div.col-sm-6.col-md-4.p0')) {
    const link = `https://www.aacosta.com.br/${$(el).find('a').attr('href')}`;
    const tituloRaw = $(el).find('h5>a').text().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const titulo = (tituloRaw.indexOf('CASA') >= 0 || tituloRaw.indexOf('SOBRADO') >= 0 || tituloRaw.indexOf('PADRAO') >= 0) ? 'CASA' : tituloRaw;
    const endereco = normalizeNeighborhoodName($(el).find('div.item-entry>span>b').text().trim().replace(' Referência:', '').replace('JD.', 'Jardim').replace('RES.', 'Residencial').replace('PQ.', 'Parque').replace('VL.', 'Residencial').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
    const valor = parseFloat(($(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0].indexOf('Consulte') > 0 ? 0 : $(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0]) || '0');
    const infos = $('div.item-entry>.property-icon').text().replace(/\n/g, '').replace(/ /g, '').replace(/\W/g, ' ').trim().split(' ').filter(q => q.trim() !== '');
    const quartos = infos[0];
    const vagas = infos[2];

    const { data: details } = await axios.get(link, {
      responseEncoding: 'latin1',
      headers: {
        'Accept': 'text/html', // Especifica que estamos aceitando HTML
      }
    } as any);
    const $$ = cheerio.load(details as any);

    const imagens: string[] = [];
    $$('#lightgallery').find('a>img[src]').each((_q, i) => { imagens.push((i as any).attribs['src']) });

    const areaTotal = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(2)').find('span.property-info-value').text().trim().replace('m²', '').trim());
    const area = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(3)').find('span.property-info-value').text().trim().replace('m²', '').trim());
    const banheiros = $$('div.s-property-content>p').text().trim().match(/banheiro/g)?.length || getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(5)').find('span.property-info-value').text().trim().trim()) || 1;
    const precoPorMetro = valor / areaTotal;
    const descricao = $$('.s-property-content').text().trim();

    imoveis.push({
      titulo,
      imagens,
      endereco,
      descricao,
      valor,
      area: area,
      areaTotal: areaTotal,
      quartos: Number(quartos),
      link,
      banheiros: Number(banheiros),
      vagas: Number(vagas),
      precoPorMetro,
      site: 'aacosta.com.br',
      entrada: valor * 0.20,
    });
  }
  return { imoveis, qtd, html };
}