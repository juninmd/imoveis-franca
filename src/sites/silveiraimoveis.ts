import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://silveiraimoveis.com.br/busca/?finalidade=Venda',
  name: 'silveiraimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://silveiraimoveis.com.br/busca/?finalidade=Venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtd = 0;
  const imoveis: Imoveis[] = [];

  $('.property-thumb-info').each((_i, el) => {

    const linkEl = $(el).find('a').first();
    const linkAttr = linkEl.attr('href') || '';
    const link = linkAttr.startsWith('http') ? linkAttr : `https://silveiraimoveis.com.br${linkAttr}`;

    const titulo = $(el).find('h2').first().text().trim();
    if (!titulo) return;

    let endereco = '';
    const bairro = $(el).find('.bairro').text().replace('-', '').trim();
    if (bairro) {
       endereco = normalizeNeighborhoodName(bairro);
    }

    let valor = 0;
    const priceText = $(el).find('.property-thumb-info-label .preco').text().trim();
    if (priceText.includes('R$')) {
       const raw = priceText.split('R$')[1].replace(/\./g, '').replace(',', '.').trim();
       valor = parseFloat(raw) || 0;
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.amenities li').each((_, infoEl) => {
       const title = $(infoEl).attr('title')?.toLowerCase() || '';
       const text = $(infoEl).text().toLowerCase().trim();

       if (title.includes('quarto') || text.includes('quarto')) {
           quartos = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (title.includes('banheiro') || text.includes('banheiro') || title.includes('suíte')) {
           banheiros = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (title.includes('vaga') || text.includes('vaga')) {
           vagas = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (title.includes('área') || title.includes('area') || text.includes('m²')) {
           area = getFixValue(text.replace('m²', '').trim());
       }
    });

    const imagens: string[] = [];
    const mainImgStyle = $(el).find('.img-destaque-imovel').attr('style');
    if (mainImgStyle && mainImgStyle.includes('url(')) {
       const match = mainImgStyle.match(/url\(['"]?(.*?)['"]?\)/);
       if (match && match[1]) imagens.push(match[1]);
    }
    const dataImage = $(el).find('.img-destaque-imovel').attr('data-image');
    if (dataImage) imagens.push(dataImage);

    if (link && valor > 0 && imagens.length > 0) {
        imoveis.push({
            titulo,
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
            site: 'silveiraimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
