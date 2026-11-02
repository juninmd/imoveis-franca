import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

// N&B Imoveis (ASP classico, UTF-8): carteira pequena, so de Franca, numa unica pagina por
// finalidade (V/L). O cartao traz bairro, tipo, preco e a miniatura; a foto cheia fica em "grande".
const HOST = 'https://nbimobiliaria.com.br';

type Tipo = 'venda' | 'aluguel';

export async function parseNb(html: string, siteName: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  $('#imoveis .imovel').each((_i, el) => {
    const card = $(el);
    const path = card.find('a[href*="exibeimovel.asp"]').first().attr('href') || '';
    const valor = getFixValue(card.find('.property-price h4').text().replace(/[^\d.,]/g, ''));
    if (!path || valor <= 0) return;

    const [bairroTexto, tipoTexto = ''] = card.find('.appartment-name h5').text().split('|');
    const bairro = cleanTitle(bairroTexto.replace(/^\s*Bairro:/i, ''));
    const tipo = cleanTitle(tipoTexto.replace(/^\s*Finalidade:/i, ''));
    const thumb = card.find('img').attr('src') || '';

    imoveis.push({
      titulo: cleanTitle(`${tipo} - ${bairro}`.replace(/^ - | - $/g, '')),
      descricao: '',
      imagens: thumb ? [`${HOST}/${thumb.replace('/pequena/', '/grande/')}`] : [],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: 0,
      areaTotal: 0,
      quartos: 0,
      banheiros: 0,
      vagas: 0,
      link: `${HOST}/${path}`,
      precoPorMetro: 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: path.match(/imovel=(\d+)/)?.[1],
      tipoImovel: inferTipoImovel(tipo) || undefined,
    });
  });

  return { imoveis, qtd: imoveis.length, html };
}

const build = (tipo: Tipo): Site => {
  const name = `nbimobiliaria.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  const url = `${HOST}/imoveis.asp?negocio=${tipo === 'venda' ? 'V' : 'L'}`;
  return {
    enabled: true, tipo, url, name, driver: 'axios', itemsPerPage: 100, params: [],
    getPaginateParams: () => ({ url }),
    adapter: (html: string) => parseNb(html, name),
  } as unknown as Site;
};

export default [build('venda'), build('aluguel')];
