import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';

// Colibex: sites de assessoria de imoveis da Caixa/leiloes. O front chama POST /api (formulario)
// e recebe {meta:{total}, items}; os campos *_txt e *_plain vem prontos, os demais sao HTML.
const PAGE_SIZE = 100;

export interface ColibexItem {
  id?: string | number; categoria_nome?: string; cidade?: string; bairro?: string; enderecoPermissao?: string;
  preco_principal_txt?: string; area_m2?: string; quartos_txt?: string; banheiros_txt?: string; vagas_txt?: string;
  referencia_plain?: string; titulo_plain?: string; descricao_html?: string; foto?: string; fotos?: string | string[];
}

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

export async function parseColibex(payload: unknown, host: string, siteName: string): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { meta?: { total?: number }, items?: ColibexItem[] };
  const imoveis: Imoveis[] = [];

  for (const item of body?.items ?? []) {
    // O filtro de cidade da API ja restringe a Franca; a checagem protege contra mudanca de contrato.
    if (!normalizeText(item.cidade ?? '').startsWith('franca') || !item.id) continue;
    const valor = toNumber(item.preco_principal_txt);
    if (valor <= 0) continue;

    const area = toNumber(item.area_m2);
    const fotos = (Array.isArray(item.fotos) ? item.fotos : [item.fotos ?? '']).filter(Boolean);
    const tipoTexto = item.categoria_nome ?? '';
    const titulo = cleanTitle(`${tipoTexto} - ${item.bairro ?? ''}`.replace(/^ - | - $/g, ''));

    imoveis.push({
      titulo,
      descricao: cleanTitle(cheerio.load(item.descricao_html ?? '').root().text()) || cleanTitle(item.titulo_plain ?? ''),
      imagens: fotos.length > 0 ? fotos : (item.foto ? [item.foto] : []),
      endereco: normalizeNeighborhoodName(item.bairro ?? ''),
      valor,
      area,
      areaTotal: area,
      quartos: parseInt(item.quartos_txt ?? '', 10) || 0,
      banheiros: parseInt(item.banheiros_txt ?? '', 10) || 0,
      vagas: parseInt(item.vagas_txt ?? '', 10) || 0,
      link: `https://${host}/detalhes/${item.id}.html`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.referencia_plain || String(item.id),
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: Number(body?.meta?.total) || imoveis.length, json: body };
}

/** Site Colibex de venda (nenhum dos dois conhecidos anuncia locacao em Franca). */
export const buildColibexSite = (host: string): Site => {
  const url = `https://${host}/api`;
  return {
    enabled: true, tipo: 'venda', url, name: host, driver: 'axios_rest', method: 'POST', itemsPerPage: PAGE_SIZE,
    axiosConfig: {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      // A chave "cidade[]" precisa ir literal; URLSearchParams nao a reinterpreta como caminho.
      transformRequest: [(data: Record<string, string | number>) => new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)])).toString()],
    },
    payload: { transacao: 'venda', ordena: 'recentes', pagina: 0, limite: PAGE_SIZE, uf: 'SP', 'cidade[]': 'FRANCA - SP' },
    getPaginateParams: (page: number) => ({ url, payload: { pagina: page - 1 } }),
    adapter: (payload: unknown) => parseColibex(payload, host, host),
  } as unknown as Site;
};
