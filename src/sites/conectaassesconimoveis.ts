import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.conectaassesconimoveis.com.br/imoveis/a-venda/franca-sp?order=mais_relevantes',
  name: 'conectaassesconimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => ({ url: `https://www.conectaassesconimoveis.com.br/imoveis/a-venda/franca-sp?order=mais_relevantes&page=${page}` }),
  adapter,
  waitFor: 'body'
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s+Imóveis\s+à\s+venda/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  $('a[href*="/imovel/"]').each((_i, el) => {
    const linkAttr = $(el).attr('href');
    if (!linkAttr) return;

    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.conectaassesconimoveis.com.br${linkAttr}`;

    // Check if we already have it to avoid duplicates
    if (imoveis.find(i => i.link === link)) return;

    const li = $(el).closest('li');
    if (li.length === 0) return;

    let titulo = li.find('h2, h3').first().text().trim();
    if (!titulo) titulo = li.text().split('R$')[0].trim().substring(0, 50); // Fallback

    // Address - extract from link
    // e.g. /imovel/apartamento/venda/franca/sp/sao-jose/AP0023_CONECT
    const urlParts = link.split('/');
    let neighborhoodFromUrl = '';
    for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i].toLowerCase() === 'sp' && i + 1 < urlParts.length) {
            neighborhoodFromUrl = urlParts[i+1].replace(/-/g, ' ');
            break;
        }
    }
    const endereco = normalizeNeighborhoodName(neighborhoodFromUrl || titulo);

    // Price
    const valorRaw = li.text().match(/R\$\s*[\d.,]+/);
    const valor = valorRaw ? parseFloat(valorRaw[0].replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) : 0;

    // Images
    const imagens: string[] = [];
    li.find('img').each((_i, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        // ignore small icons
        if (src && src.includes('http') && !src.includes('fallback') && !src.includes('svg')) {
            imagens.push(src);
        }
    });

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const detailsText = li.text().toLowerCase();

    const areaMatch = detailsText.match(/(\d+)\s*m²/);
    if (areaMatch) area = parseInt(areaMatch[1]);

    const quartosMatch = detailsText.match(/(\d+)\s*quarto/);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = detailsText.match(/(\d+)\s*banheiro/);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = detailsText.match(/(\d+)\s*vaga/);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    if (link && valor > 0) {
        imoveis.push({
            titulo: titulo || 'Imóvel em Franca',
            descricao: '',
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
            site: 'conectaassesconimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
