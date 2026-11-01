import axios from 'axios';
import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';

// Simob (Flexpro): SPA Angular cujo site descobre o proprio tenant em simob.com.br/.../params?host=
// e depois fala com uma API JSON autenticada por um Bearer publico daquele tenant.
const PARAMS_URL = 'https://simob.com.br/v2/imobiliaria/site/params';
const CDN = 'https://cdnmidia.simob.com.br';
const BATCH = 8;
const LISTING_PAGE_SIZE = 500;

interface SimobTenant { urlApi: string; tokenIntegracao: string }
interface SimobCaracteristica { descricao?: string; valor?: string }
interface SimobListed {
  codigo: string; bairro?: string; cidade?: string; endereco?: string; descricaoCategoria?: string;
  valor?: string; descricaoImovel?: string; caracteristicas?: SimobCaracteristica[];
}
interface SimobDetail { imagens?: Array<{ url?: string }>; caracteristicas?: SimobCaracteristica[] }

const FINALIDADE = { venda: 2, aluguel: 1 } as const;
type Tipo = keyof typeof FINALIDADE;

const slug = (text: string): string => normalizeText(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, From: 'site', Accept: 'application/json' });

const numberOf = (list: SimobCaracteristica[], label: RegExp): number => {
  const found = list.find(c => label.test(c.descricao ?? ''));
  return found ? getFixValue(String(found.valor ?? '').replace(/[^\d.,]/g, '')) : 0;
};

const fetchListing = async (tenant: SimobTenant, tipo: Tipo): Promise<SimobListed[]> => {
  const data = JSON.stringify({
    finalidade: FINALIDADE[tipo], offset: { maxResults: LISTING_PAGE_SIZE, firstResult: 0 }, acuracidade: 100, countResults: false,
    considerarPrevisaoSaida: false, calcularValorAbono: false, validade_opcao_venda: false, rangeValue: { max: '', min: '' }, trazerCaracteristicas: 3,
  });
  const res = await axios.post<{ result?: SimobListed[] | Record<string, SimobListed> }>(`${tenant.urlApi}/v2/integracaoApi/imovel/filtro/categoria/caracteristicas`, { data }, { headers: headers(tenant.tokenIntegracao), timeout: 30000 });
  return Object.values(res.data.result ?? {});
};

const fetchDetail = async (tenant: SimobTenant, codigo: string): Promise<SimobDetail> => {
  try {
    const res = await axios.get<{ result?: SimobDetail[] }>(`${tenant.urlApi}/v2/integracaoApi/detalhes/imovel/${codigo}`, { headers: headers(tenant.tokenIntegracao), timeout: 30000, params: { calcularValorAbono: false, considerarPrevisaoSaida: false, validadeOpcaoVenda: false } });
    return res.data.result?.[0] ?? {};
  } catch {
    // sem o detalhe o anuncio continua com a foto de capa e os dados da listagem
    return {};
  }
};

export async function parseSimob(payload: unknown, host: string, siteName: string, tipo: Tipo): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { result?: SimobTenant };
  const tenant = body?.result;
  if (!tenant?.urlApi || !tenant.tokenIntegracao) return { imoveis: [], qtd: 0, json: body };

  const listed = (await fetchListing(tenant, tipo)).filter(item => normalizeText(item.cidade ?? '') === 'franca' && item.codigo);
  const details: SimobDetail[] = [];
  for (let i = 0; i < listed.length; i += BATCH) {
    details.push(...await Promise.all(listed.slice(i, i + BATCH).map(item => fetchDetail(tenant, item.codigo))));
  }

  const imoveis: Imoveis[] = [];
  listed.forEach((item, index) => {
    const valor = getFixValue(String(item.valor ?? '').replace(/[^\d.,]/g, ''));
    if (valor <= 0) return;
    const detail = details[index];
    const traits = [...(item.caracteristicas ?? []), ...(detail.caracteristicas ?? [])];
    const area = numberOf(traits, /^Área (da unidade|constru|útil|privativa)/i);
    const areaTotal = numberOf(traits, /^Área (total|do terreno|terreno)/i) || area;
    const areaPreco = area || areaTotal;
    const titulo = cleanTitle(`${item.descricaoCategoria ?? ''} - ${item.bairro ?? ''}`.replace(/^ - | - $/g, ''));

    imoveis.push({
      titulo,
      descricao: cleanTitle(cheerio.load(item.descricaoImovel ?? '').root().text()),
      imagens: (detail.imagens ?? []).map(img => img.url ? `${CDN}${img.url}` : '').filter(Boolean),
      endereco: normalizeNeighborhoodName(item.bairro ?? ''),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: numberOf(traits, /^Dormit/i),
      banheiros: numberOf(traits, /^Banheiro/i),
      vagas: numberOf(traits, /^Vagas/i),
      link: `https://${host}/imovel/exibir/${slug(`${tipo === 'venda' ? 'venda' : 'locacao'} ${item.descricaoCategoria ?? ''} ${item.bairro ?? ''} ${item.cidade ?? ''}`)}/${item.codigo}`,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.codigo,
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd: imoveis.length, json: body };
}

/** Par venda/aluguel de uma imobiliaria que usa o Simob. A URL do site e o "params" do tenant, de onde o adapter tira API e token. */
export const buildSimobSites = (host: string): Site[] =>
  (['venda', 'aluguel'] as Tipo[]).map(tipo => {
    const name = `${host} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
    const url = `${PARAMS_URL}?host=${host}`;
    return {
      enabled: true, tipo, url, name, driver: 'axios', itemsPerPage: LISTING_PAGE_SIZE, params: [],
      getPaginateParams: () => ({ url }),
      adapter: (payload: unknown) => parseSimob(payload, host, name, tipo),
    } as unknown as Site;
  });
