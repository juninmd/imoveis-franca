import * as cheerio from 'cheerio';
import { Imoveis } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, safeUrl, normalizeText } from '../../utils';

const firstNumber = (text: string): number => {
  const match = text.match(/\d[\d.]*(?:,\d+)?/);
  return match ? getFixValue(match[0]) : 0;
};

const cardText = (card: cheerio.Cheerio, key: string, label: string): string =>
  card.find(`[data-cy="rp-cardProperty-${key}-txt"]`).text().replace(label, '');

/** Parser dos cards `rp-property-cd` (grupo ZAP/OLX Brasil: ZAP Imoveis, VivaReal). */
export async function parseZapGroupListings(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
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

    const link = safeUrl(href, host);
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

/**
 * Faixas de preco da venda: o ZAP/VivaReal so entregam ~50 paginas por busca, e Franca tem ~5.350
 * anuncios. Cada faixa cabe nesse limite; as bordas repetem anuncios, que o dedupe por link remove.
 */
export const ZAP_GROUP_SALE_BANDS = [
  { precoMaximo: 150000 }, { precoMinimo: 150000, precoMaximo: 250000 }, { precoMinimo: 250000, precoMaximo: 400000 },
  { precoMinimo: 400000, precoMaximo: 550000 }, { precoMinimo: 550000, precoMaximo: 700000 }, { precoMinimo: 700000, precoMaximo: 900000 },
  { precoMinimo: 900000, precoMaximo: 1200000 }, { precoMinimo: 1200000, precoMaximo: 1800000 }, { precoMinimo: 1800000 },
];
