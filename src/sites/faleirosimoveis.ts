import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://faleirosimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&id_tipo_imovel=12&finalidade=0',
  name: 'faleirosimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://faleirosimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&id_tipo_imovel=12&finalidade=0&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const qtdText = $('h1').text();
  const qtdMatch = qtdText.match(/(\d+)\s*-\s*imóveis/i) || qtdText.match(/(\d+)\s+imóveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  $('.item').each((_i, el) => {
    const parentA = $(el).find('a').first();
    const linkAttr = parentA.attr('href');
    if (!linkAttr) return;
    const link = `https://faleirosimoveis.com.br/${linkAttr}`;

    const textNodes = $(el).text().split('\n').map(s => s.trim()).filter(s => s.length > 0);

    let titulo = '';
    let valorStr = '';
    let endereco = '';

    for (const text of textNodes) {
        if (text.includes('R$')) {
            valorStr = text;
        } else if (!titulo && text.length > 5 && !text.includes('Banheiros') && !text.includes('Quartos') && !text.includes('Área') && !text.includes('Vagas')) {
            titulo = text;
        } else if (titulo && !endereco && text.length > 3 && !text.includes('Banheiros') && !text.includes('Quartos') && !text.includes('Área') && !text.includes('Vagas')) {
            endereco = normalizeNeighborhoodName(text);
        }
    }

    // Fallback se n achar
    if (!titulo) titulo = $(el).find('img').attr('alt') || 'Imóvel';
    if (!endereco) endereco = 'Centro';

    const valor = parseFloat(valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    if (valor <= 0) return;

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('li').each((_k, featEl) => {
       const text = $(featEl).attr('title')?.toLowerCase() || $(featEl).text().toLowerCase().trim();
       const valMatch = text.match(/\d+/);
       const num = valMatch ? parseInt(valMatch[0]) : 0;

       if (text.includes('área') || text.includes('area') || text.includes('m²')) {
           area = num;
       } else if (text.includes('quarto') || text.includes('dorm')) {
           quartos = num;
       } else if (text.includes('banh')) {
           banheiros = num;
       } else if (text.includes('vaga')) {
           vagas = num;
       }
    });

    const imgEl = $(el).find('img').first();
    const imgUrl = imgEl.attr('src') || imgEl.attr('data-src');
    const imagens = imgUrl ? [imgUrl] : [];

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
        site: 'faleirosimoveis.com.br',
        entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
