import * as cheerio from 'cheerio';
import { Imoveis } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://matrizimobiliaria.com.br';
const PAGE_SIZE = 24;
const MIN_VALID_PRICE = 100;

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

// Matriz Imobiliaria (Vista + template proprio "card-imovel"): a carteira cobre a regiao inteira,
// entao a cidade no titulo decide o que nao e de Franca. A ultima pagina vem dos links de paginacao.
export async function parseMatriz(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const pages = $('a[href*="pagina="]').map((_i, a) => parseInt(($(a).attr('href') || '').match(/pagina=(\d+)/)?.[1] ?? '0', 10)).get();

  $('.card-imovel').each((_i, el) => {
    const card = $(el);
    const link = card.find('a.card-imovel__link').attr('href') || '';
    // Franca vem sem cidade ("Jardim Adelinha"); so as outras trazem "Bairro, Cidade".
    const [bairroTexto, cidadeTexto = 'Franca'] = cleanTitle(card.find('.card-imovel__titulo').text()).split(/,\s*(?=[^,]*$)/);
    // "Preco sob consulta" nao tem numero: cai no filtro de preco minimo.
    const valor = toNumber((card.find('.card-imovel__preco').first().text().match(/R\$\s*([\d.,]+)/) || [])[1]);
    if (!link || valor < MIN_VALID_PRICE || normalizeText(cidadeTexto) !== 'franca') return;

    // Metricas: cada bloco tem o rotulo ("Quartos", "Vagas", "Área") e o valor logo depois.
    const metric = (label: RegExp): number => {
      const box = card.find('.grid > div').filter((_j, d) => label.test($(d).find('span').first().text())).first();
      return toNumber(box.find('span').eq(1).text());
    };
    const area = metric(/^\s*[ÁA]rea/i);
    const tipoTexto = cleanTitle(card.find('.card-imovel__categoria').text());
    const imagens = [...new Set(card.find('img.card-imovel__img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean))];
    const codigo = (card.attr('data-codigo') || card.find('.card-imovel__codigo').text().replace(/\D/g, '')) || undefined;

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairroTexto}`),
      descricao: cleanTitle(card.find('img.card-imovel__img').attr('alt') || ''),
      imagens,
      endereco: normalizeNeighborhoodName(bairroTexto),
      valor,
      area,
      areaTotal: area,
      quartos: Math.trunc(metric(/^\s*Quartos/i)),
      banheiros: 0,
      vagas: Math.trunc(metric(/^\s*Vagas/i)),
      link: link.startsWith('http') ? link : `${host}${link}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: (pages.length > 0 ? Math.max(...pages) : 1) * PAGE_SIZE, html };
}

const base = (tipo: string) => `${HOST}/imoveis/${tipo === 'venda' ? 'venda' : 'aluguel'}/todos`;

export default buildPortalSites({
  host: HOST,
  label: 'matrizimobiliaria.com.br',
  pageSize: PAGE_SIZE,
  maxPages: 60,
  driver: 'axios',
  parser: parseMatriz,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}?pagina=${page}`,
});
