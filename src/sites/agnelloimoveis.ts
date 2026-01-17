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
  params: [{
    locacao_venda: 'V', // compra em bairros
    "id_cidade[]": 63, // Franca
    finalidade: 0,
    id_tipo_imovel: 12 // compra de casas em bairros
  },
    // {
    //   locacao_venda: 'L', // aluguel em bairros
    //   "id_cidade[]": 63,
    //   finalidade: 0,
    // }
  ],
  getPaginateParams: (page: number) => ({ params: { pag: page } }),
  disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
  adapter,
} as Site;

export async function adapter(html): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const qtd = Number($('h1.titulo_res_busca').text().split('-')[0].replace(/\D/g, ''));
  const imoveis: Imoveis[] = [];
  for (const el of $('div.item.col-sm-6.col-md-4.col-lg-3')) {
    const link = `https://www.agnelloimoveis.com.br/${$(el).find('a').attr('href')}`;
    const titleAttr = $(el).find('a').attr('title');
    const tituloRaw = titleAttr ? titleAttr.replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";
    const titulo = (tituloRaw.indexOf('CASA') >= 0 || tituloRaw.indexOf('SOBRADO') >= 0 || tituloRaw.indexOf('PADRAO') >= 0) ? 'CASA' : tituloRaw;
    const endereco = $(el).find('h3>small').text().trim().replace('Bairro: ', '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const valor = getFixValue($(el).find('div.price>span:nth-last-child(1)').text() || '0');
    const infos = $(el).find('div.amenities>ul.imo-itens>li');
    const quartos = (infos[0] as any)?.attribs['title']?.replace(/\D/g, '') || '';
    const banheiros = (infos[1] as any)?.attribs['title']?.replace(/\D/g, '') || '';
    const vagas = (infos[2] as any)?.attribs['title']?.replace(/\D/g, '') || '';

    const { data: details } = await axios.get(link, {
      responseEncoding: 'latin1',
      headers: {
        'Accept': 'text/html', // Especifica que estamos aceitando HTML
      }
    } as any);
    const $$ = cheerio.load(details as any) as any;

    const imagens: string[] = [];
    $$('.row>div.carousel').find('a>img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });

    const area = getFixValue($$('div.main>div>div>small:contains("A. Construída")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M²', '').trim()) || getFixValue($$('div.main>div>div>small:contains("A. Útil")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M²', '').trim());
    const areaTotal = getFixValue($$('div.main>div>div>small:contains("A. Terreno")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M²', '').trim()) || getFixValue($$('div.main>div>div>small:contains("A. Útil")').parent()[0]?.childNodes[3]?.nodeValue.trim().replace(' M²', '').trim());
    const precoPorMetro = valor / (areaTotal || area);
    const descricao = $$('p#descricao_imovel').text().trim()
    imoveis.push({
      titulo,
      descricao,
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
  return { imoveis, qtd, html };
};