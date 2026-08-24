import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://zagoimoveisfranca.com.br/comprar',
  name: 'zagoimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 24,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://zagoimoveisfranca.com.br/comprar?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s+imóveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  $('.resultado').each((_i, el) => {
    // get link from parent A tag or check inside foto
    let linkAttr = $(el).parent('a').attr('href') || $(el).attr('onclick');
    if(!linkAttr) {
        linkAttr = $(el).find('a').attr('href');
    }
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://zagoimoveisfranca.com.br${linkAttr}`) : 'https://zagoimoveisfranca.com.br';

    const titulo = $(el).find('h3.tipo').text().trim();
    if (!titulo) return;

    let enderecoRaw = $(el).find('h4.localizacao span').text().trim();
    if (!enderecoRaw) {
        enderecoRaw = $(el).find('.cidade, .bairro').text().trim() || titulo;
    }
    const endereco = normalizeNeighborhoodName(enderecoRaw.split('-')[0].trim());

    const valorText = $(el).find('.valor h5').text().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(valorText || '0');

    const imagens: string[] = [];
    $(el).find('.foto img').each((_i, img) => {
       const src = $(img).attr('src') || $(img).attr('data-src');
       if (src) imagens.push(src.startsWith('http') ? src : `https://zagoimoveisfranca.com.br${src}`);
    });

    const detalhes = $(el).find('.detalhes .detalhe');
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    detalhes.each((_i, det) => {
        const text = $(det).text().toLowerCase();
        if (text.includes('m²')) {
            area = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.').trim()) || 0;
        } else if (text.includes('dorm')) {
            quartos = parseInt(text) || 0;
        } else if (text.includes('banh') || text.includes('suíte')) {
            banheiros += parseInt(text) || 0;
        } else if (text.includes('vaga')) {
            vagas = parseInt(text) || 0;
        }
    });

    const descText = $(el).find('.descricao span').text().toLowerCase();
    if (area === 0) {
        const mArea = descText.match(/(\d+(?:,\d+)?)\s*m²/);
        if (mArea) area = getFixValue(mArea[1]);
    }

    if (valor > 0) {
        imoveis.push({
            titulo,
            descricao: $(el).find('.descricao span').text().trim(),
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
            site: 'zagoimoveisfranca.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
