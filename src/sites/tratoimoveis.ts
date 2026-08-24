import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.tratoimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&finalidade=0',
  name: 'tratoimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.tratoimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&finalidade=0&pag=${page}` };
  },
  adapter,
} as Site;
// Nota: `locacao_venda=L` (tentativa de variante "alugar") foi testado e descartado — o site
// ignora o parâmetro e retorna um feed de imóveis À VENDA de outras cidades (ex.: Formosa-GO),
// não aluguéis de Franca. Ver .workflow/49-plataforma-moderna-compra-aluguel/progress.md.

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  // Site não expõe mais texto de contagem em <h1>; usa a quantidade de cards encontrados.
  const qtd = $('.row.imovel').length;

  $('.row.imovel').each((_i, el) => {
    let link = '';
    const parentA = $(el).closest('a');
    if (parentA.length > 0) {
      const linkAttr = parentA.attr('href');
      if (linkAttr) link = `https://www.tratoimoveis.com.br${linkAttr}`;
    } else {
      const internalA = $(el).find('a').first();
      const linkAttr = internalA.attr('href');
      if (linkAttr) link = `https://www.tratoimoveis.com.br${linkAttr}`;
    }

    if (!link) return;

    const textNodes = $(el).text().split('\n').map(s => s.trim()).filter(s => s.length > 0);

    let titulo = '';
    let valorStr = '';
    let endereco = '';

    for (const text of textNodes) {
        if (text.includes('R$')) {
            valorStr = text;
        } else if (!titulo && text.length > 2 && !text.includes('Banheiros') && !text.includes('Quartos') && !text.includes('Área') && !text.includes('Vagas')) {
            titulo = text;
        } else if (titulo && !endereco && text.length > 2 && !text.includes('Banheiros') && !text.includes('Quartos') && !text.includes('Área') && !text.includes('Vagas')) {
            endereco = normalizeNeighborhoodName(text);
        }
    }

    if (!endereco) endereco = 'Centro';

    const valor = parseFloat(valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    if (valor <= 0) return;

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.v4-custom-p').each((_k, featEl) => {
       const text = $(featEl).text().toLowerCase().trim();
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

    const imgEl = $(el).find('.swiper-slide img').first();
    let imgUrl = imgEl.attr('src');
    if(!imgUrl) imgUrl = $(el).find('img').first().attr('src');

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
        site: 'tratoimoveis.com.br',
        entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
