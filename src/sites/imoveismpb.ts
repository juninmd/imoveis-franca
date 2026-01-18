import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';
import axios from 'axios';

// Define adapter first
export const adapter = async (html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> => {
  const $ = cheerio.load(html);
  const qtd = Number($('span.h-money').first().text().replace(/\D/g, '')) || 0;

  const imoveis: Imoveis[] = [];

  // We grab links from the listing page
  const anchors = $('a[href*="/imovel/"]');
  const links = new Set<string>();
  anchors.each((_, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('/venda/') || href.includes('/locacao/') || href.includes('/aluguel/'))) {
       links.add(href);
    }
  });

  for (const link of links) {
    const fullLink = link.startsWith('http') ? link : `https://imoveismpb.com.br${link}`;

    // Fetch details
    try {
        const { data: detailsHtml } = await axios.get(fullLink, {
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });
        const $$ = cheerio.load(detailsHtml as string);

        const titulo = $$('h1.text-8.font-weight-bold').text().trim().toUpperCase();
        const enderecoRaw = $$('div.col-md-12.mb-4 > p.text-4').text().trim() || $$('span.text-muted').first().text().trim();
        const endereco = normalizeNeighborhoodName(enderecoRaw.split(',')[0]);

        const valorRaw = $$('span.text-color-primary.font-weight-bold.text-6').text() || $$('div.col-md-4.summary > div.price').text();
        const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

        const descricao = $$('div.imovel-descricao').text().trim();

        const imagens: string[] = [];
        $$('div.thumb-gallery-detail a img').each((_, img) => {
            const src = $(img).attr('src');
            if (src) imagens.push(src);
        });

        const areaTotal = getFixValue($$('li:contains("total")').last().text().replace('total', '').replace('m²', '').trim());
        const area = getFixValue($$('li:contains("útil")').last().text().replace('útil', '').replace('m²', '').trim());
        const quartos = parseInt($$('li:contains("quartos")').last().text()) || parseInt($$('li:contains("quarto")').last().text()) || 0;
        const banheiros = parseInt($$('li:contains("banheiros")').last().text()) || parseInt($$('li:contains("banheiro")').last().text()) || 0;
        const vagas = parseInt($$('li:contains("vaga")').last().text()) || 0;

        imoveis.push({
            site: 'imoveismpb.com.br',
            titulo,
            descricao,
            imagens,
            endereco,
            valor,
            area,
            areaTotal,
            quartos,
            banheiros,
            vagas,
            link: fullLink,
            precoPorMetro: area > 0 ? valor / area : 0,
            entrada: valor * 0.2
        });
    } catch (err) {
        console.error(`Error scraping details for ${fullLink}`, err);
    }
  }

  return { imoveis, qtd, html };
}

const common = {
  driver: 'axios',
  enabled: true,
  itemsPerPage: 20,
  adapter,
  translateParams: {
    currentPage: 'pag',
    maxPrice: undefined,
    minPrice: undefined,
  },
  getPaginateParams: (page: number) => ({ params: { pag: page } }),
}

export const mpbComprar: Site = {
    ...common,
    name: 'imoveismpb.com.br - Comprar',
    url: 'https://imoveismpb.com.br/comprar/todos',
    params: [{ tipo: 'comprar' }]
} as any;

export const mpbAlugar: Site = {
    ...common,
    name: 'imoveismpb.com.br - Alugar',
    url: 'https://imoveismpb.com.br/alugar/todos',
    params: [{ tipo: 'alugar' }]
} as any;

export default [mpbComprar, mpbAlugar];
