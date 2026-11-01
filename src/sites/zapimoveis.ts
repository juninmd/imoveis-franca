import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, safeUrl, normalizeText } from '../utils';

const HOST = 'https://www.zapimoveis.com.br';
const PAGE_SIZE = 30;

const buildSite = (tipo: 'venda' | 'aluguel'): Site => {
  const base = `${HOST}/${tipo}/imoveis/sp+franca/`;
  const name = `zapimoveis.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    // axios leva 403 (fingerprint de TLS do Node); o Chromium do projeto passa.
    driver: 'puppet',
    itemsPerPage: PAGE_SIZE,
    // Milhares de anuncios (muitos repetidos nas imobiliarias locais): so as primeiras paginas.
    maxPages: 30,
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}?pagina=${page}` : base }),
    adapter: (html: string) => adapter(html, name),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];

const firstNumber = (text: string): number => {
  const match = text.match(/\d[\d.]*(?:,\d+)?/);
  return match ? getFixValue(match[0]) : 0;
};

const cardText = (card: cheerio.Cheerio, key: string, label: string): string =>
  card.find(`[data-cy="rp-cardProperty-${key}-txt"]`).text().replace(label, '');

export async function adapter(html: string, siteName = 'zapimoveis.com.br'): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const qtd = parseInt($('h1').first().text().split(' ')[0].replace(/\D/g, ''), 10) || 0;

  $('[data-cy="rp-property-cd"]').each((_i, el) => {
    const card = $(el);
    const anchor = card.find('a[href*="/imovel/"]').first();
    const href = anchor.attr('href') || '';
    const priceText = cardText(card, 'price', '');
    const valor = firstNumber(priceText.split('Cond.')[0]);
    if (!href || valor <= 0) return;

    const location = cardText(card, 'location', '');
    // A busca por cidade devolve vizinhas; so Franca interessa.
    if (normalizeText(location.split(',').pop() || '') !== 'franca') return;

    const link = safeUrl(href, HOST);
    if (!link) return;
    link.search = '';
    const area = firstNumber(cardText(card, 'propertyArea', 'Tamanho do imóvel'));
    const titulo = cleanTitle(anchor.attr('title') || '');
    const street = cardText(card, 'street', '').trim();
    const imagens = card.find('img').map((_j, img) => ($(img).attr('src') || '').replace(/dimension=\d+x\d+/, 'dimension=800x600')).get().filter(Boolean);
    const condominio = priceText.match(/Cond\.\s*R\$\s*([\d.]+)/);

    imoveis.push({
      titulo,
      descricao: [titulo, street && !/não informado/i.test(street) ? street : '', condominio ? `Condomínio R$ ${condominio[1]}` : ''].filter(Boolean).join(' · '),
      imagens,
      endereco: normalizeNeighborhoodName(location.split(',')[0]),
      valor,
      area,
      areaTotal: area,
      quartos: firstNumber(cardText(card, 'bedroomQuantity', 'Quantidade de quartos')),
      banheiros: firstNumber(cardText(card, 'bathroomQuantity', 'Quantidade de banheiros')),
      vagas: firstNumber(cardText(card, 'parkingSpacesQuantity', 'Quantidade de vagas de garagem')),
      link: link.toString(),
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: href.match(/id-(\d+)/)?.[1],
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd, html };
}
