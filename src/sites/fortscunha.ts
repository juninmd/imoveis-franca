import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 1000, // pagina unica: o site lista todos os imoveis em /imoveis
  params: [],
  getPaginateParams: () => {
    return { url: `https://www.fortscunha.com.br/imoveis` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  $('.single-project').each((_i, el) => {
    const link = $(el).find('.overlay a').first().attr('href') || $(el).find('.lower-content h5 a').attr('href');
    if (!link) return;

    const tipo = $(el).find('.lower-content2').text().trim().toLowerCase();
    if (tipo && !tipo.includes('vend')) return;

    // "Franca - Jardim Paineiras" / "Saída para Ibiraci - Sp"
    const loc = $(el).find('.lower-content').clone().children().remove().end().text().replace(/\s+/g, ' ').trim();
    const [cidade, ...resto] = loc.split(/\s*-\s*/);
    if (!/^franca$/i.test(cidade.trim())) return;
    const endereco = normalizeNeighborhoodName(resto.join(' - ').trim() || 'Franca');

    const valorStr = $(el).find('.valor-pacote').text().replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(valorStr) || 0;
    if (valor <= 0) return;

    let quartos = 0, banheiros = 0, vagas = 0, area = 0;
    $(el).find('.valores-imovel').each((_j, feat) => {
      const num = parseInt($(feat).text().replace(/\s+/g, ' ').trim()) || 0;
      if ($(feat).find('.fa-bed').length) quartos = num;
      else if ($(feat).find('.fa-bath').length) banheiros = num;
      else if ($(feat).find('.fa-car').length) vagas = num;
      else if ($(feat).find('.fa-arrows').length) area = getFixValue($(feat).text().replace(/m²/g, '').replace(/\s/g, ''));
    });

    const titulo = $(el).find('.lower-content h5 a').text().trim();
    const imgStr = $(el).find('.img-box img').attr('src');
    const imagens: string[] = imgStr ? [encodeURI(imgStr.startsWith('http') ? imgStr : `https://www.fortscunha.com.br/${imgStr.replace(/^\//, '')}`)] : [];

    imoveis.push({
      titulo: titulo || `Imóvel em ${endereco}`,
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
      site: 'fortscunha.com.br',
      entrada: valor * 0.20
    });
  });

  return { imoveis, qtd: imoveis.length, html };
}
