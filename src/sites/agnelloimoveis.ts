import axios from 'axios';
import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue } from '../utils';

export default {
  driver: 'puppet',
  enabled: true,
  waitFor: '#property-listing',
  name: 'agnelloimoveis.com.br',
  url: 'https://www.agnelloimoveis.com.br/pesquisa-de-imoveis/',
  itemsPerPage: 16,
  params: {
    locacao_venda: 'V',
    "id_cidade[]": 63,
    "id_tipo_imovel[]": 12,
    finalidade: 'residencial',
  },
  getPaginateParams: (page: number) => ({ params: { pag: page } }),
  disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
  async adapter(html): Promise<{ imoveis: Imoveis[], qtd: number }> {
    const $ = cheerio.load(html);
    const qtd = Number($('h1.titulo_res_busca').text().split('-')[0].replace(/\D/g, ''));
    const imoveis: Imoveis[] = [];
    for (const el of $('div.item.col-sm-6.col-md-4.col-lg-3')) {
      const link = `https://www.agnelloimoveis.com.br/${$(el).find('a').attr('href')}`;
      const tituloRaw = $(el).find('a').attr('title').replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const titulo = (tituloRaw.indexOf('CASA') >= 0 || tituloRaw.indexOf('SOBRADO') >= 0 || tituloRaw.indexOf('PADRAO') >= 0) ? 'CASA' : tituloRaw;
      const endereco = $(el).find('h3>small').text().trim().replace('Bairro: ', '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      const valor = getFixValue($(el).find('div.price>span').text() || '0');
      const infos = $(el).find('div.amenities>ul.imo-itens>li');
      const quartos = infos[0].attribs['title'].replace(/\D/g, '');
      const banheiros = infos[1].attribs['title'].replace(/\D/g, '');
      const vagas = infos[2].attribs['title'].replace(/\D/g, '');

      const { data: details } = await axios.get(link, {
        headers: {
          'Accept-Encoding': 'identity'
        }
      });
      const $$ = cheerio.load(details);

      const imagens: string[] = [];
      $$('.row>div.carousel').find('a>img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });

      const area = getFixValue($$('div.main>div>div>small:contains("A. Constru�da")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M�', '').trim()) || getFixValue($$('div.main>div>div>small:contains("A. �til")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M�', '').trim());
      const areaTotal = getFixValue($$('div.main>div>div>small:contains("A. Terreno")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M�', '').trim()) || getFixValue($$('div.main>div>div>small:contains("A. �til")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M�', '').trim());
      const precoPorMetro = valor / (areaTotal || area);
      imoveis.push({
        titulo,
        imagens,
        endereco,
        valor,
        area: area || areaTotal,
        areaTotal: areaTotal || area,
        quartos: Number(quartos),
        link,
        banheiros: Number(banheiros),
        vagas: Number(vagas),
        precoPorMetro,
        site: 'agnelloimoveis.com.br',
        entrada: valor * 0.20,
      });
    }
    return { imoveis, qtd };
  },
} as Site;