import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.parraimobiliaria.com.br/comprar/Franca/Casa',
  name: 'parraimobiliaria.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => ({ params: { pag: page } }),
  adapter,
  disableQuery: '.pagination .disabled',
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Try to find quantity in text like "81 - imóveis disponíveis"
  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*-\s*imóveis disponíveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  // Iterate over columns that likely contain cards
  // Based on observation: class="col-12 col-sm-6 col-md-4 col-lg-3 mt-2"
  $('div[class*="col-12"][class*="col-sm-6"]').each((_i, el) => {
    // Basic validation to check if it's a property card
    const text = $(el).text();
    if ((!text.includes('Dorm') && !text.includes('Banho')) || !text.includes('R$')) return;

    const linkElement = $(el).find('a').first();
    const linkHref = linkElement.attr('href');
    if (!linkHref) return;
    const link = linkHref.startsWith('http') ? linkHref : `https://www.parraimobiliaria.com.br${linkHref}`;

    // Title usually in h5 or similar, or just text?
    // Text view: "Imóvel mobiliado em excelente localização ... Centro - Franca/SP"
    const titulo = $(el).find('h5, .card-title').text().trim() || 'Casa em Franca';

    // Address often follows title or in a specific class
    const endereco = normalizeNeighborhoodName($(el).find('.address, .endereco, span:contains("Franca/SP")').text().replace('- Franca/SP', '').trim());

    // Price extraction
    const priceText = $(el).text();
    const priceMatch = priceText.match(/R\$\s*([\d.]+),(\d{2})/);
    let valor = 0;
    if (priceMatch) {
        valor = parseFloat(priceMatch[1].replace(/\./g, '') + '.' + priceMatch[2]);
    }

    // Specs
    const quartos = Number(text.match(/(\d+)\s*Dorm/i)?.[1] || 0);
    const banheiros = Number(text.match(/(\d+)\s*Banho/i)?.[1] || 0);
    const vagas = Number(text.match(/(\d+)\s*Garagem/i)?.[1] || 0);
    const areaConstMatch = text.match(/([\d.,]+)\s*m²\s*Const/i);
    const areaTerrMatch = text.match(/([\d.,]+)\s*m²\s*Terreno/i);

    const area = getFixValue(areaConstMatch ? areaConstMatch[1] : '0');
    const areaTotal = getFixValue(areaTerrMatch ? areaTerrMatch[1] : '0');

    const imgRel = $(el).find('img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.parraimobiliaria.com.br${imgRel}`] : [];

    if (valor > 0) {
        imoveis.push({
            titulo,
            descricao: '',
            imagens,
            endereco,
            valor,
            area: area || areaTotal,
            areaTotal: areaTotal || area,
            quartos,
            link,
            banheiros,
            vagas,
            precoPorMetro: (area || areaTotal) > 0 ? valor / (area || areaTotal) : 0,
            site: 'parraimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
