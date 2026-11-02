import * as cheerio from 'cheerio';
import { Imoveis } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://www.lcastroimoveis.com.br';
const PAGE_SIZE = 20;

// Cartoes server-side (Vue "inline-template"): a galeria vem como JSON no atributo `lazy-images`,
// o preco fica em --price-sale ou --price-rent e as metricas em ".composition" (Area, Quartos...).
export async function parseLCastro(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const aluguel = siteName.endsWith('Alugar');
  const imoveis: Imoveis[] = [];
  const total = parseInt(($('body').text().match(/([\d.]+)\s+Im[oó]veis/i) || [])[1]?.replace(/\./g, '') ?? '0', 10);

  $('section.property-card-search').each((_i, el) => {
    const card = $(el);
    const path = card.find('a.__link').attr('href') || '';
    const location = cleanTitle(card.find('.property-card-search--location').text());
    // O catalogo cobre cidades vizinhas: o local vem como "BAIRRO, CIDADE - UF".
    const [bairroTexto, cidadeTexto = ''] = location.split(/,\s*(?=[^,]*$)/);
    const valor = getFixValue(card.find(aluguel ? '.property-card-search--price-rent .price' : '.property-card-search--price-sale .price').first().text().replace(/[^\d.,]/g, ''));
    if (!path || valor <= 0 || normalizeText(cidadeTexto.replace(/\s*-\s*[a-z]{2}\s*$/i, '')) !== 'franca') return;

    const metric = (name: string): number => {
      const node = card.find('.composition').filter((_j, c) => $(c).find('.name-composition').text().trim().toLowerCase() === name);
      return getFixValue(node.find('.number').first().text().replace(/[^\d.,]/g, ''));
    };
    const [tipoTexto, ref] = cleanTitle(card.find('.property-card-search--title').text()).split(/\s*-\s*REF:\s*/i);
    let imagens: string[] = [];
    try {
      const lazy = card.find('slide-images-lazy').attr('v-bind:lazy-images') || '[]';
      imagens = (JSON.parse(lazy) as Array<{ url?: string }>).map(i => i.url ?? '').filter(Boolean);
    } catch { /* galeria ilegivel nao justifica perder o anuncio */ }
    const area = metric('área');

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairroTexto}`),
      descricao: cleanTitle(card.find('.property-card-search--description').text()),
      imagens,
      endereco: normalizeNeighborhoodName(bairroTexto),
      valor,
      area,
      areaTotal: area,
      quartos: metric('quartos'),
      banheiros: metric('banheiros'),
      vagas: metric('vagas'),
      link: `${host}/${path.replace(/^\//, '')}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: ref || undefined,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: total || imoveis.length, html };
}

export default buildPortalSites({
  host: HOST,
  label: 'lcastroimoveis.com.br',
  pageSize: PAGE_SIZE,
  maxPages: 40,
  driver: 'axios',
  parser: parseLCastro,
  firstPageUrl: tipo => `${HOST}/${tipo === 'venda' ? 'a-venda' : 'para-alugar'}`,
  pageUrl: (tipo, page) => `${HOST}/${tipo === 'venda' ? 'a-venda' : 'para-alugar'}?pagina=${page}`,
});
