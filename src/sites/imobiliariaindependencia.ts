import * as cheerio from 'cheerio';
import { normalizeNeighborhoodName } from '../utils';
import { Imoveis, Site } from '../types';
import axios from 'axios';
import * as https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://imobiliariaindependencia.com.br/venda',
  name: 'imobiliariaindependencia.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [{
    'page': 1,
  }],
  getPaginateParams: (page: number) => ({ url: `https://imobiliariaindependencia.com.br/venda?page=${page}` }),
  adapter,
  waitFor: undefined,
  axiosConfig: {
      httpsAgent: agent
  }
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Total pages
  let qtd = 0;
  const lastPageLink = $('.pagination li a').last().attr('href');
  if (lastPageLink) {
      const match = lastPageLink.match(/page=(\d+)/);
      if (match) {
          qtd = parseInt(match[1]) * 15;
      }
  }

  const imoveis: Imoveis[] = [];
  const cards = $('.card').toArray();

  for (const el of cards) {
    const $el = $(el);
    const linkEl = $el.find('a[href*="imovel/p/"]');
    if (!linkEl.length) continue;

    const linkPath = linkEl.attr('href');
    if (!linkPath) continue;
    const link = linkPath.startsWith('http') ? linkPath : `https://imobiliariaindependencia.com.br${linkPath}`;

    const titulo = $el.find('h3').text().trim();
    const valorText = $el.find('.rate-info h5').text().trim();
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').trim().split(',')[0] || '0');

    // Address often has comma, we need to extract neighborhood if possible
    let endereco = $el.find('.la-map-marker').parent().text().trim();
    endereco = normalizeNeighborhoodName(endereco.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));

    // Fallback neighborhood from title if address is bad
    if (!endereco || endereco === '0' || endereco === ', 0') {
        if (titulo && titulo.toUpperCase() !== 'CENTRO') {
           endereco = normalizeNeighborhoodName(titulo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
        } else if (titulo.toUpperCase() === 'CENTRO') {
            endereco = 'CENTRO';
        }
    }

    try {
        const { data: detailsHtml } = await (axios as any).get(link, { httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $$ = cheerio.load(detailsHtml as string);

        const imagens = new Set<string>();
        $$('img').each((_i, imgEl) => {
            const src = $$(imgEl).attr('src');
            if (src && src.includes('arquivos/')) {
                imagens.add(src);
            }
        });

        let descricao = '';
        $$('p').each((_i, pEl) => {
            const text = $$(pEl).text().trim();
            if (text.length > 50 && !text.includes('Imobiliária')) {
                descricao += text + ' ';
            }
        });
        descricao = descricao.trim();

        let quartos = 0;
        let banheiros = 0;
        let vagas = 0;
        let area = 0;

        // Match from list items in details
        $$('ul li').each((_i, liEl) => {
            const text = $$(liEl).text().trim().toLowerCase();
            if (text.includes('dormitório') || text.includes('quarto')) {
                const match = text.match(/(\d+)/);
                if (match) quartos = parseInt(match[1]);
            }
            if (text.includes('banheiro') || text.includes('suíte')) {
                const match = text.match(/(\d+)/);
                if (match) banheiros = parseInt(match[1]);
            }
            if (text.includes('garagem') || text.includes('vaga')) {
                const match = text.match(/(\d+)/);
                if (match) vagas = parseInt(match[1]);
            }
            if (text.includes('área') || text.includes('m²')) {
                const match = text.match(/([\d.]+)/);
                if (match) area = parseFloat(match[1]);
            }
        });

        // If not found in details, check card
        if (quartos === 0) {
            $el.find('ul li').each((_i, liEl) => {
                const text = $$(liEl).text().toLowerCase();
                if ($$(liEl).find('.fa-bed').length) {
                    quartos = parseInt(text.replace(/[^0-9]/g, '') || '0');
                }
                if (text.includes('m²')) {
                    area = parseFloat(text.replace(/[^0-9.]/g, '') || '0');
                }
            });
        }

        const areaTotal = area;
        const precoPorMetro = areaTotal > 0 ? valor / areaTotal : 0;

        imoveis.push({
          titulo,
          descricao,
          imagens: Array.from(imagens),
          endereco,
          valor,
          area,
          areaTotal,
          quartos,
          banheiros,
          vagas,
          link,
          precoPorMetro,
          site: 'imobiliariaindependencia.com.br',
          entrada: valor * 0.20,
        });
    } catch (e) {
        // Skip failed detail pages
    }
  }

  // If count fails, try to estimate
  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
};
