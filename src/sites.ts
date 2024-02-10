import cheerio from 'cheerio';
import axios from 'axios';

export interface Imoveis {
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
};

export interface Sites { driver: 'axios' | 'puppet', enabled: boolean, waitFor: string | undefined, disableQuery: string, nome: string, url: string, translateParams: { currentPage: string; maxPrice: string; minPrice: string }, params: any, adapter: (html: string) => Promise<Imoveis[]> }
// Definir os sites de imóveis que serão consultados
export const sites: Sites[] = [
  {
    nome: 'Franca',
    enabled: true,
    url: 'https://imoveisfranca.com.br/comprar/comprar',
    driver: 'axios',
    params: {
      'pagina': 1,
      'tipo': 'comprar',
      'TipoCompra': '11',
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
      const qtd = $('#result').text().trim();
      console.log(qtd);
      const imoveis = $('.card-resultado').map((_i, el) => {
        const titulo = $(el).find('.titulo-resultado-busca').text().trim();
        const endereco = $(el).find('.endereco-resultado-busca').text().trim();
        const valor = $(el).find('.valores-resultado-busca').text().indexOf('Para detalhes') > 0 ? 0 : $(el).find('.valores-resultado-busca > h3').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
        const area = $(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || 0;
        const areaTotal = $(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || 0;
        const quartos = $(el).find('.comodidades-resultado-busca > div:nth-child(2)').text().replace('Quartos', '').trim();
        const banheiros = $(el).find('.comodidades-resultado-busca > div:nth-child(3)').text().replace('Banheiros', '').trim();
        const vagas = $(el).find('.comodidades-resultado-busca > div:nth-child(4)').text().replace('Vagas', '').trim();
        const imagens: string[] = [];
        $(el).find('.imagem-resultado').find('.carousel-inner >.carousel-item > img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });
        const link = $(el).find('.link-resultado').attr('href');
        const precoPorMetro = Number(valor) / Number(areaTotal);
        return {
          titulo,
          imagens,
          endereco,
          valor: Number(valor),
          area: Number(area),
          areaTotal: Number(areaTotal),
          quartos: Number(quartos),
          link,
          banheiros: Number(banheiros),
          vagas: Number(vagas),
          precoPorMetro,
        };
      }).get();
      return imoveis;
    },
    disableQuery: '.pagination .justify-content-center > li:nth-last-child(1).page-item.disabled',
    waitFor: undefined
  },
  {
    driver: 'puppet',
    enabled: true,
    waitFor: undefined,
    url: 'https://www.aacosta.com.br/listagem.jsp',
    nome: 'aacosta',
    params: {
      negociacao: 2,
      tipo: 1,
      cidade: 1,
      ordem: 'preco'
    },
    translateParams: {
      currentPage: 'numpagina',
      maxPrice: undefined,
      minPrice: undefined,
    },
    disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
    async adapter(html): Promise<Imoveis[]> {
      const $ = cheerio.load(html);
      const qtd = $('ul>span.proerty-price.pull-right>h4').text().trim();
      console.log(qtd);

      const imoveis: Imoveis[] = [];

      for (const el of $('div.col-sm-6.col-md-4.p0')) {
        const link = `https://www.aacosta.com.br/${$(el).find('a').attr('href')}`;
        const titulo = $(el).find('h5>a').text().trim();
        const endereco = $(el).find('div.item-entry>span>b').text().trim();
        const valor = $(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0].indexOf('Consulte') > 0 ? 0 : $(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
        const infos = $('div.item-entry>.property-icon').text().replace(/\n/g, '').replace(/ /g, '').replace(/\W/g, ' ').trim().split(' ');
        const quartos = infos[0];
        const vagas = infos[2];

        const imagens: any[] = [$(el).find('a>img[src]').attr('src')];

        const { data: details } = await axios.get(link, { responseEncoding: 'utf8' });
        const $$ = cheerio.load(details);

        const areaTotal = $$('.property-meta.entry-meta.clearfix>div:nth-child(2)').text().replace('.00 m�', '').replace(/\D/g, '');
        const area = $$('.property-meta.entry-meta.clearfix>div:nth-child(3)').text().replace('.00 m�', '').replace(/\D/g, '');
        const banheiros = $$('div.s-property-content>p').text().trim().match(/banheiro/g)?.length || 1;
        const precoPorMetro = Number(valor) / Number(areaTotal);
        imoveis.push({
          titulo,
          imagens,
          endereco,
          areaTotal: Number(areaTotal),
          valor: Number(valor),
          area: Number(area),
          quartos: Number(quartos),
          link,
          banheiros: Number(banheiros),
          vagas: Number(vagas),
          precoPorMetro,
        });
      }
      return imoveis;
    },
  }
];
