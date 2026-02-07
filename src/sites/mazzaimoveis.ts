import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://mazzaimoveis.com.br/imoveis/a-venda/casa/franca',
  name: 'mazzaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => ({ url: `https://mazzaimoveis.com.br/imoveis/a-venda/casa/franca/pagina-${page}/` }),
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Try to find quantity in text like "Casa - 44 resultados encontrados."
  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*resultados encontrados/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];
  $('.resultado').each((_i, el) => {
    const tipo = $(el).find('.info_imoveis .tipo').text().trim();
    const bairro = $(el).find('.info_imoveis .bairro').text().trim();
    const titulo = `${tipo} ${bairro}`;
    const endereco = normalizeNeighborhoodName(bairro);

    const valorRaw = $(el).find('.valor h5').text().trim();
    const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    const areaRaw = $(el).find('.detalhe[title="Área"] span').first().text().trim();
    const area = getFixValue(areaRaw);

    const quartosRaw = $(el).find('.detalhe[title="Dormitórios"] span').text().trim();
    const quartos = Number(quartosRaw) || 0;

    const banheirosRaw = $(el).find('.detalhe[title="Banheiros"] span').text().trim();
    const banheiros = Number(banheirosRaw) || 0;

    const vagasRaw = $(el).find('.detalhe[title="Vagas"] span').text().trim();
    const vagas = Number(vagasRaw) || 0;

    const linkRel = $(el).find('.foto a').attr('href');
    const link = linkRel ? (linkRel.startsWith('http') ? linkRel : `https://mazzaimoveis.com.br${linkRel}`) : '';

    const imgRel = $(el).find('.foto img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://mazzaimoveis.com.br${imgRel}`] : [];

    if (link && valor > 0) {
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
            site: 'mazzaimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
