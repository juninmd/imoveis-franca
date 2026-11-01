import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, inferTipoImovel } from '../utils';

const HOST = 'https://jlbarcellosimoveis.com.br';
const PAGE_SIZE = 10;

// WordPress + tema Houzez: pagina por /page/N/ e cada card traz a galeria inteira em data-images.
const buildSite = (tipo: 'venda' | 'aluguel'): Site => {
  const base = `${HOST}/finalidade/${tipo}/`;
  const name = `jlbarcellosimoveis.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    driver: 'axios',
    itemsPerPage: PAGE_SIZE,
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}page/${page}/` : base }),
    adapter: (html: string) => adapter(html, name, tipo),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];

// Houzez imprime o preco no formato americano ("R$1,390,000.00"), ao contrario do resto do Brasil.
export const parsePrice = (text: string): number => {
  const match = text.match(/R\$\s*([\d.,]+)/);
  if (!match) return 0;
  const raw = match[1];
  const normalized = /,\d{2}$/.test(raw) ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  return parseFloat(normalized) || 0;
};

const firstInt = (text: string): number => parseInt((text.match(/\d+/) || ['0'])[0], 10);

const galleryOf = (raw: string | undefined, fallback: string | undefined): string[] => {
  let urls: string[] = [];
  try {
    urls = (JSON.parse(raw || '[]') as Array<{ image?: string }>).map(item => item.image || '').filter(Boolean);
  } catch {
    // atributo truncado ou invalido: cai na imagem de capa
  }
  const unique = [...new Set(urls)];
  return unique.length > 0 ? unique : [fallback].filter((url): url is string => !!url);
};

export async function adapter(html: string, siteName = 'jlbarcellosimoveis.com.br', finalidade: 'venda' | 'aluguel' = 'venda'): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const pages = $('.pagination a, .page-numbers').map((_i, a) => parseInt($(a).text(), 10) || 0).get();
  const qtd = pages.length > 0 ? Math.max(...pages) * PAGE_SIZE : $('.item-listing-wrap').length;

  $('.item-listing-wrap').each((_i, el) => {
    const card = $(el);
    const anchor = card.find('.item-title a').first();
    const link = anchor.attr('href') || '';
    const valor = parsePrice(card.find('.item-price').first().text());
    if (!link || valor <= 0) return;

    const titulo = cleanTitle(anchor.text());
    // "Venda/Locacao": o preco exibido e o de venda, entao nao pode entrar na lista de aluguel.
    if (finalidade === 'aluguel' && /venda\s*\/\s*loca/i.test(titulo)) return;
    const area = firstInt(card.find('.h-area .hz-figure').first().text());
    const tipoTexto = cleanTitle(card.find('.h-type').text());
    const corretor = cleanTitle(card.find('.item-author a').first().text());

    imoveis.push({
      titulo,
      descricao: [titulo, tipoTexto, corretor && `Corretor: ${corretor}`].filter(Boolean).join(' · '),
      imagens: galleryOf(card.attr('data-images'), card.find('img').first().attr('src')),
      endereco: cleanTitle(card.find('.item-address').text()).toUpperCase(),
      valor,
      area,
      areaTotal: area,
      quartos: firstInt(card.find('.h-beds .hz-figure').text()),
      banheiros: firstInt(card.find('.h-baths .hz-figure').text()),
      vagas: firstInt(card.find('.h-cars .hz-figure').text()),
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: link.replace(/\/$/, '').split('/').pop(),
      tipoImovel: inferTipoImovel(`${tipoTexto} ${titulo}`) || undefined,
    });
  });

  return { imoveis, qtd, html };
}
