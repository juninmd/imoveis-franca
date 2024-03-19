import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue } from '../utils';
import axios from 'axios';

export default {
  driver: 'puppet',
  enabled: true,
  waitFor: undefined,
  name: 'aacosta.com.br',
  url: 'https://www.aacosta.com.br/listagem.jsp',
  itemsPerPage: 10,
  params: [{
    negociacao: 1, // aluguel
    tipo: 0,
    cidade: 1,
    ordem: 'preco'
  },
  {
    negociacao: 2, // compra
    tipo: 0,
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
  async adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number }> {
    const $ = cheerio.load(html);
    const qtd = Number($('ul>span.proerty-price.pull-right>h4').text().replace(/\D/g, ''));
    const imoveis: Imoveis[] = [];
    for (const el of $('div.col-sm-6.col-md-4.p0')) {
      const link = `https://www.aacosta.com.br/${$(el).find('a').attr('href')}`;
      const tituloRaw = $(el).find('h5>a').text().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const titulo = (tituloRaw.indexOf('CASA') >= 0 || tituloRaw.indexOf('SOBRADO') >= 0 || tituloRaw.indexOf('PADRAO') >= 0) ? 'CASA' : tituloRaw;
      const endereco = $(el).find('div.item-entry>span>b').text().trim().replace(' Referência:', '').replace('JD.', 'Jardim').replace('RES.', 'Residencial').replace('PQ.', 'Parque').replace('VL.', 'Residencial').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      const valor = parseFloat(($(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0].indexOf('Consulte') > 0 ? 0 : $(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0]) || '0');
      const infos = $('div.item-entry>.property-icon').text().replace(/\n/g, '').replace(/ /g, '').replace(/\W/g, ' ').trim().split(' ');
      const quartos = infos[0];
      const vagas = infos[2];

      const { data: details } = await axios.get(link, {
        headers: {
          'Accept-Encoding': 'identity'
        }
      });
      const $$ = cheerio.load(details);

      const imagens: string[] = [];
      $$('#lightgallery').find('a>img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });

      const areaTotal = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(2)').find('span.property-info-value').text().trim().replace('m�', '').trim());
      const area = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(3)').find('span.property-info-value').text().trim().replace('m�', '').trim());
      const banheiros = $$('div.s-property-content>p').text().trim().match(/banheiro/g)?.length || 1;
      const precoPorMetro = valor / areaTotal;
      imoveis.push({
        titulo,
        imagens,
        endereco,
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
    return { imoveis, qtd };
  },
} as Site