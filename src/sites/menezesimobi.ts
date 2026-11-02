import * as cheerio from 'cheerio';
import { Imoveis } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://menezesimobi.com.br';
const PAGE_SIZE = 12;
const MIN_VALID_PRICE = 100;

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

// Plataforma Univen/Tokko: a listagem mistura a rede regional (Rifaina, Sacramento/MG...), entao
// o filtro por cidade e feito pelo caminho do link ("/sp/franca/"). O total do cabecalho cobre todas
// as cidades e define quantas paginas existem.
export async function parseMenezes(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const aluguel = siteName.endsWith('Alugar');
  const imoveis: Imoveis[] = [];
  const total = parseInt((($('body').text().match(/(\d+)\s+im[oó]veis\s+(?:à venda|para loca)/i) || [])[1]) || '0', 10);

  $('.resultado_novo').each((_i, el) => {
    const card = $(el);
    const path = card.find('a.botao_ver_mais').attr('href') || '';
    if (!/^\/(?:comprar|alugar|comprar-ou-alugar)\/sp\/franca\//.test(path)) return;

    // Cartoes de aluguel podem trazer "VENDA R$ x" e "LOCAÇÃO R$ y" lado a lado.
    let valor = 0;
    card.find('.valor_novo').each((_j, v) => {
      const label = $(v).find('small').text().toLowerCase();
      const price = toNumber($(v).find('h5').text() || $(v).text());
      if (aluguel ? label.includes('loca') : !label.includes('loca')) valor = valor || price;
    });
    // A fonte usa "R$ 1,00" como preco placeholder em anuncios sem valor real.
    if (valor < MIN_VALID_PRICE) return;

    let quartos = 0; let banheiros = 0; let vagas = 0; let area = 0;
    card.find('.detalhe_novo').each((_j, det) => {
      const text = $(det).text().toLowerCase();
      const n = toNumber($(det).find('.icone_numero span').text() || text);
      if (text.includes('quarto') || text.includes('dormit')) quartos = n;
      else if (text.includes('banheiro')) banheiros = n;
      else if (text.includes('vaga')) vagas = n;
      else if (text.includes('m²')) area = Math.max(area, n);
    });

    const titulo = cleanTitle(card.find('.titulo_novo').text());
    const bairro = card.find('.final_card span').text().split(' - ')[0];
    const imagens = card.find('.swiper-slide img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean);
    const referencia = card.find('.flag_ref').text().replace(/^\s*Ref\.?/i, '').trim();

    imoveis.push({
      titulo,
      descricao: cleanTitle(`${titulo} em ${bairro}`),
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: area,
      quartos,
      banheiros,
      vagas,
      link: `${host}${path}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: referencia || undefined,
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd: total || imoveis.length, html };
}

export default buildPortalSites({
  host: HOST,
  label: 'menezesimobi.com.br',
  pageSize: PAGE_SIZE,
  maxPages: 110,
  driver: 'axios',
  parser: parseMenezes,
  firstPageUrl: tipo => `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}/`,
  pageUrl: (tipo, page) => `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}/pagina-${page}/`,
});
