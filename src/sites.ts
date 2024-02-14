import cheerio from 'cheerio';
import axios from 'axios';

export interface Imoveis {
  site: string,
  titulo: string,
  imagens: string[],
  endereco: string,
  valor: number,
  area: number,
  areaTotal: number,
  quartos: number,
  link: string,
  banheiros: number,
  vagas: number,
  precoPorMetro: number,
  entrada: Number,
};

export interface Site { name: string, driver: 'axios' | 'puppet', enabled: boolean, waitFor: string | undefined, disableQuery: string, url: string, link?: string, translateParams: { currentPage: string; maxPrice: string; minPrice: string }, params: any, itemsPerPage: number, adapter: (html: string) => Promise<{ imoveis: Imoveis[], qtd: number }> }
// Definir os sites de imóveis que serão consultados
export const sites: Site[] = [
  {
    enabled: true,
    url: 'https://imoveisfranca.com.br/comprar/comprar',
    name: 'imoveisfranca.com.br',
    driver: 'puppet',
    itemsPerPage: 10,
    params: {
      'pagina': 1,
      'tipo': 'comprar',
      'TipoCompra': '11',  // casa
      'localizacao': 'franca',
      'banheiros': '2',
      'vagas': '2',
      'filtro': 1
    },
    translateParams: {
      currentPage: 'pagina',
      maxPrice: 'valorMaximo',
      minPrice: 'valorMinimo',
    },
    adapter: async (html: string) => {
      const $ = cheerio.load(html);
      const qtd = Number($('#result').text().replace(/\D/g, ''));
      const imoveis = $('.card-resultado').map((_i, el) => {
        const tituloRaw = $(el).find('.titulo-resultado-busca').text().toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const titulo = (tituloRaw.indexOf('CASA') >= 0 || tituloRaw.indexOf('PADRAO') >= 0 || tituloRaw.indexOf('SOBRADO') >= 0) ? 'CASA' : tituloRaw;
        const endereco = $(el).find('.endereco-resultado-busca').text().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").split(',')[0];
        const valor = parseFloat(($(el).find('.valores-resultado-busca').text().indexOf('Para detalhes') > 0 ? 0 : $(el).find('.valores-resultado-busca > h3').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0]) || '0');
        const area = getFixValue($(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || '0');
        const areaTotal = getFixValue($(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || '0');
        const quartos = $(el).find('.comodidades-resultado-busca > div:nth-child(2)').text().replace('Quartos', '').trim();
        const banheiros = $(el).find('.comodidades-resultado-busca > div:nth-child(3)').text().replace('Banheiros', '').trim();
        const vagas = $(el).find('.comodidades-resultado-busca > div:nth-child(4)').text().replace('Vagas', '').trim();
        const imagens: string[] = [];
        $(el).find('.imagem-resultado').find('.carousel-inner >.carousel-item > img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });
        const link = $(el).find('.link-resultado').attr('href');
        const precoPorMetro = valor / areaTotal;
        return {
          titulo,
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
          site: 'imoveisfranca.com.br',
          entrada: valor * 0.20,
        };
      }).get();
      return { imoveis, qtd };
    },
    disableQuery: '.pagination .justify-content-center > li:nth-last-child(1).page-item.disabled',
    waitFor: undefined
  },
  {
    driver: 'puppet',
    enabled: true,
    waitFor: undefined,
    name: 'aacosta.com.br',
    url: 'https://www.aacosta.com.br/listagem.jsp',
    itemsPerPage: 10,
    params: {
      negociacao: 2,
      tipo: 1, // casa
      cidade: 1,
      ordem: 'preco'
    },
    translateParams: {
      currentPage: 'numpagina',
      maxPrice: undefined,
      minPrice: undefined,
    },
    disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
    async adapter(html): Promise<{ imoveis: Imoveis[], qtd: number }> {
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

        const areaTotal = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(2)').find('span.property-info-value').text().replace('m�', '').trim());
        const area = getFixValue($$('.property-meta.entry-meta.clearfix>div:nth-child(3)').find('span.property-info-value').text().replace('m�', '').trim());
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
  },
  {
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
    translateParams: {
      currentPage: 'pag',
      maxPrice: undefined,
      minPrice: undefined,
    },
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
  }
];


const getFixValue = (rawArea = '0') => {
  // Se tiver ponto, diferenciar mil de centavo
  if (rawArea.indexOf('.') >= 1) {
    const l = rawArea.split('.')[1].length;
    if (l > 2) {
      rawArea = rawArea.replace(/\./g, '').trim();
    }
    else {
      rawArea = rawArea.replace('.', ',').trim();
    }
  } else if (isNaN(Number(rawArea))) {
    rawArea = '0';
  }
  const parsedArea = parseFloat(rawArea.replace(',', '.').trim() || '0');
  return parsedArea;
}