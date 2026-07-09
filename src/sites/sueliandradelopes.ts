import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.sueliandradelopes.com.br/imovel/?finalidade=venda',
  name: 'sueliandradelopes.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => ({ url: `https://www.sueliandradelopes.com.br/imovel/?finalidade=venda&pag=${page}` }),
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtd = 0;

  const imoveis: Imoveis[] = [];
  $('.imovelcard').each((_i, el) => {
    const linkPath = $(el).attr('data-link');
    const link = linkPath ? `https://www.sueliandradelopes.com.br${linkPath}` : '';

    const tagText = $(el).find('.imovelcard__info__tag').text().trim();
    const tituloRaw = $(el).find('.imovelcard__info__ref').text().split('-')[1]?.trim() || 'Casa';
    const titulo = tituloRaw.toUpperCase();

    const enderecoRaw = $(el).find('.imovelcard__info__local').text().trim();
    const endereco = normalizeNeighborhoodName(enderecoRaw.split(',')[0]);

    const valorRaw = $(el).find('.imovelcard__valor__valor').text().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(valorRaw || '0');

    let quartos = 0;
    let banheiros = 0;
    let vagas = 0;
    let area = 0;
    let areaTotal = 0;

    $(el).find('.imovelcard__info__feature').each((_idx, featureEl) => {
      const text = $(featureEl).text().trim().toLowerCase();
      const num = Number($(featureEl).find('b').text().trim()) || 0;
      if (text.includes('dormit')) quartos = num;
      if (text.includes('banheiro')) banheiros = num;
      if (text.includes('vaga')) vagas = num;
      if (text.includes('área') || text.includes('area')) {
         const areaVal = getFixValue(text.replace(/.*?m²/, '').replace(/[^\d.,]/g, '').trim());
         area = areaVal || getFixValue($(featureEl).find('b').text());
         areaTotal = area;
      }
    });

    const imagens: string[] = [];
    let mainImg = $(el).find('.imovelcard__img img').attr('src');
    if (!mainImg || mainImg.includes('data:image')) {
       mainImg = $(el).find('.imovelcard__img img').attr('data-src');
    }
    if (mainImg) {
      imagens.push(mainImg.startsWith('http') ? mainImg : `https://www.sueliandradelopes.com.br${mainImg}`);
    }

    if (link && valor > 0 && tagText.toLowerCase().includes('venda')) {
      imoveis.push({
        titulo,
        descricao: '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal,
        quartos,
        link,
        banheiros,
        vagas,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'sueliandradelopes.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd, html };
}
