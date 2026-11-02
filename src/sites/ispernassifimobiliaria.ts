import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';

// Isper Nassif: o front chama POST assets/ajax/imoveis.php?option=buscarimoveis e recebe
// [[itens], {Paginas}, {Total}]. "offset" e deslocamento em itens (9 por pagina); o catalogo
// inclui imoveis negociados, entao cada finalidade so aceita itens marcados "disponivel".
const HOST = 'https://www.ispernassifimobiliaria.com.br';
const IMG_HOST = 'https://ispernassifimobiliaria.com.br/adm';
const API = `${HOST}/assets/ajax/imoveis.php?option=buscarimoveis`;
const PAGE_SIZE = 9;

type Tipo = 'venda' | 'aluguel';

export interface IsperItem {
  IDImovel?: number | string; Codigo?: string; Cidade?: string; Bairro?: string; TipoImovel?: string;
  DisponibilidadeVenda?: string; DisponibilidadeAluguel?: string; ValorVenda?: number | string; ValorLocacao?: number | string;
  NumeroDormitorios?: number | string; NumeroBanheiros?: number | string; NumeroVagasGaragem?: number | string;
  AreaTotal?: number | string; AreaPrivativa?: number | string; AreaUtil?: number | string;
  TituloSite?: string | null; DescricaoSite?: string | null; ImagemPrincipal?: string | null;
}

const num = (v: unknown): number => Number(v) || 0;
// Parte das descricoes vem em base64 (HTML); o resto ja vem em texto.
const decodeDescription = (raw: string): string => /^[A-Za-z0-9+/]{16,}={0,2}$/.test(raw) ? Buffer.from(raw, 'base64').toString('utf8') : raw;

export async function parseIsper(payload: unknown, siteName: string, tipo: Tipo): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as [IsperItem[]?, { Paginas?: string }?, { Total?: number }?];
  const imoveis: Imoveis[] = [];

  for (const item of body?.[0] ?? []) {
    const disponivel = (tipo === 'venda' ? item.DisponibilidadeVenda : item.DisponibilidadeAluguel) === 'disponível';
    const valor = num(tipo === 'venda' ? item.ValorVenda : item.ValorLocacao);
    if (!item.IDImovel || !disponivel || valor <= 0 || normalizeText(item.Cidade ?? '') !== 'franca') continue;

    const area = num(item.AreaPrivativa) || num(item.AreaUtil) || num(item.AreaTotal);
    const tipoTexto = item.TipoImovel ?? '';
    const bairro = item.Bairro ?? '';

    imoveis.push({
      titulo: cleanTitle(item.TituloSite || `${tipoTexto} - ${bairro}`.replace(/^ - | - $/g, '')),
      descricao: cleanTitle(cheerio.load(decodeDescription(item.DescricaoSite ?? '')).root().text()),
      imagens: item.ImagemPrincipal ? [`${IMG_HOST}/${item.ImagemPrincipal}`] : [],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: num(item.AreaTotal) || area,
      quartos: num(item.NumeroDormitorios),
      banheiros: num(item.NumeroBanheiros),
      vagas: num(item.NumeroVagasGaragem),
      link: `${HOST}/imovel.php?id=${item.IDImovel}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.Codigo || String(item.IDImovel),
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: num(body?.[2]?.Total) || imoveis.length, json: body };
}

const build = (tipo: Tipo): Site => {
  const name = `ispernassifimobiliaria.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true, tipo, url: API, name, driver: 'axios_rest', method: 'POST', itemsPerPage: PAGE_SIZE,
    axiosConfig: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    payload: { codigo: '', valorminimo: '', valormaximo: '', offset: 0 },
    getPaginateParams: (page: number) => ({ url: API, payload: { offset: (page - 1) * PAGE_SIZE } }),
    adapter: (payload: unknown) => parseIsper(payload, name, tipo),
  } as unknown as Site;
};

export default [build('venda'), build('aluguel')];
