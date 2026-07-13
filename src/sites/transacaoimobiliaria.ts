import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.transacaoimobiliaria.com.br/imobiliaria/franca-sp/imoveis/17',
  name: 'transacaoimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 35,
  params: [],
  getPaginateParams: (page: number) => ({ url: `https://www.transacaoimobiliaria.com.br/imobiliaria/franca-sp/imoveis/17?page=${page}` }),
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s+Imóveis,\s+Franca,\s+SP/i) || bodyText.match(/(\d+)\s+Imóveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  $('.c49-property-card, article.card').each((_i, el) => {
    let linkEl = $(el).find('a[href*="/imoveis/venda"]').first();
    if (linkEl.length === 0) {
       linkEl = $(el).find('a').first();
    }
    const linkAttr = linkEl.attr('href');
    if (!linkAttr) return;

    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.transacaoimobiliaria.com.br${linkAttr}`;

    const titulo = $(el).find('.c49-property-title').text().trim() || $(el).find('h3').text().trim();
    const descricao = $(el).find('.c49-property-resume').text().trim();

    // Neighborhood sometimes in the h3 or .pull-left
    let enderecoRaw = $(el).find('.pull-left').text().trim();
    if (!enderecoRaw || enderecoRaw.length < 3) {
       enderecoRaw = titulo;
    }
    const endereco = normalizeNeighborhoodName(enderecoRaw);

    const valorRaw = $(el).find('.c49-property-value').text().replace('Venda', '').trim();
    const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    // Images
    const imagens: string[] = [];
    $(el).find('.carousel-item img').each((_i, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src) imagens.push(src.startsWith('http') ? src : `https://www.transacaoimobiliaria.com.br${src.startsWith('/') ? '' : '/'}${src}`);
    });
    if (imagens.length === 0) {
        const img = $(el).find('img').first().attr('src');
        if (img) imagens.push(img.startsWith('http') ? img : `https://www.transacaoimobiliaria.com.br${img.startsWith('/') ? '' : '/'}${img}`);
    }

    // Details: area, quartos, banheiros, vagas
    // They are inside div.c49-property-number-wrap
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.c49-property-number-wrap').each((_i, wrap) => {
        const text = $(wrap).find('.c49-property-number').text().toLowerCase().trim();
        if (text.includes('m²')) {
            area = getFixValue(text.replace('m²', '').trim());
        } else if (text.includes('quarto')) {
            quartos = parseInt(text) || 0;
        } else if (text.includes('banh')) {
            banheiros = parseInt(text) || 0;
        } else if (text.includes('vaga')) {
            vagas = parseInt(text) || 0;
        }
    });

    if (link && valor > 0) {
        imoveis.push({
            titulo,
            descricao,
            imagens,
            endereco,
            valor,
            area,
            areaTotal: area,
            quartos,
            link,
            banheiros,
            vagas,
            precoPorMetro: area > 0 ? valor / area : 0,
            site: 'transacaoimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
