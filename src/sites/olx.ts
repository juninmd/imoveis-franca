import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';

const PAGE_SIZE = 50;

const buildSite = (tipo: 'venda' | 'aluguel'): Site => {
  const base = `https://www.olx.com.br/imoveis/${tipo}/estado-sp/regiao-de-ribeirao-preto/franca`;
  const name = `olx.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    // axios leva 403 (fingerprint de TLS do Node); o Chromium do projeto passa.
    driver: 'puppet',
    itemsPerPage: PAGE_SIZE,
    // Milhares de anuncios; as paginas seguintes so repetem o padrao das primeiras.
    maxPages: 20,
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}?o=${page}` : base }),
    adapter: (html: string) => adapter(html, name),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];

const digits = (text: string): number => parseInt(text.replace(/\D/g, ''), 10) || 0;

export async function adapter(html: string, siteName = 'olx.com.br'): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const qtd = digits(($('body').text().match(/([\d.]+)\s+resultados?/) || [])[1] || '');

  $('section.olx-adcard').each((_i, el) => {
    const card = $(el);
    const anchor = card.find('a[data-testid="adcard-link"]').first();
    const link = anchor.attr('href') || '';
    const valor = getFixValue((card.find('.olx-adcard__price').first().text().match(/R\$\s*([\d.]+(?:,\d+)?)/) || [])[1]);
    if (!link || valor <= 0) return;

    // "Franca, Jardim Veneza": a busca regional devolve outras cidades, so Franca interessa.
    const [cidade, bairro = ''] = card.find('.olx-adcard__location').text().split(',').map(s => s.trim());
    if (normalizeText(cidade) !== 'franca') return;

    let area = 0; let quartos = 0; let banheiros = 0; let vagas = 0;
    card.find('.olx-adcard__detail').each((_j, d) => {
      const label = ($(d).attr('aria-label') || '').toLowerCase();
      const n = digits(label);
      if (label.includes('metros')) area = n;
      else if (label.includes('quarto')) quartos = n;
      else if (label.includes('banheiro')) banheiros = n;
      else if (label.includes('vaga')) vagas = n;
    });

    const titulo = cleanTitle(anchor.attr('title') || anchor.text());
    const badges = card.find('.olx-core-badge').map((_j, b) => $(b).text().trim()).get();
    const imagens = card.find('.olx-adcard__media img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean);

    imoveis.push({
      titulo,
      descricao: [titulo, ...badges, card.find('.olx-adcard__price-info').first().text().trim()].filter(Boolean).join(' · '),
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: area,
      quartos,
      banheiros,
      vagas,
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: link.match(/-(\d+)$/)?.[1],
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd, html };
}
