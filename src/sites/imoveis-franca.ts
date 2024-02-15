import cheerio from 'cheerio';
import { getFixValue } from '../utils';
import { Imoveis, Site } from '../types';

export default {
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
  async adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number }> {
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
} as Site;