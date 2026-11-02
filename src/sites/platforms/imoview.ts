import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';

// Imoview (cdn.imoview.com.br): o site chama POST /retornar-imoveis-disponiveis com um formulario
// grande e recebe {quantidade, lista}. O backend devolve erro 500 se faltar campo do formulario
// ou se numeroregistros passar de 20, entao o corpo abaixo replica o do proprio site.
const PAGE_SIZE = 20;

export interface ImoviewItem {
  codigo: number; codigoauxiliar?: string; tipo?: string; valor?: string; bairro?: string; cidade?: string;
  titulo?: string; numeroquartos?: string; numerobanhos?: string; numerovagas?: string;
  areaprincipal?: string; arealote?: string; urlfotoprincipalp?: string; url_amigavel?: string;
  fotos?: Array<{ urlp?: string }>;
}

type Tipo = 'venda' | 'aluguel';

const baseForm = (finalidade: Tipo): Record<string, string | number> => ({
  finalidade, codigounidade: '', codigocondominio: 0, codigoproprietario: 0, codigocaptador: 0, codigosimovei: 0, codigocidade: 0, codigoregiao: 0,
  'bairros[0][cidade]': '', 'bairros[0][codigo]': '', 'bairros[0][estado]': '', 'bairros[0][estadoUrl]': '', 'bairros[0][nome]': 'Todos', 'bairros[0][nomeUrl]': 'todos-os-bairros', 'bairros[0][regiao]': '',
  endereco: '', edificio: '', numeroquartos: 0, numerovagas: 0, numerobanhos: 0, numerosuite: 0, numerovaranda: 0, numeroelevador: 0,
  valorde: 0, valorate: 0, areade: 0, areaate: 0, areaexternade: 0, areaexternaate: 0, destaque: 0,
  'opcaoimovel[codigo]': 0, 'opcaoimovel[nome]': '', 'opcaoimovel[nomeUrl]': 'todas-as-opcoes', codigoOpcaoimovel: 0,
  numeropagina: 1, numeroregistros: PAGE_SIZE, ordenacao: 'dataatualizacaodesc',
  'condominio[codigo]': 0, 'condominio[nome]': '', 'condominio[nomeUrl]': 'todos-os-condominios',
  // Alguns tenants (ex.: C15) respondem um aviso de PHP em HTML quando estes dois faltam e quando
  // `extras` vai como string (o PHP espera array); por isso `extras` nao e enviado.
  retornomapaapp: 'false', codigoempreendimentomae: '',
});

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

export async function parseImoview(payload: unknown, host: string, siteName: string): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { quantidade?: number, lista?: ImoviewItem[] };
  const imoveis: Imoveis[] = [];

  for (const item of body?.lista ?? []) {
    // Imobiliarias regionais publicam tambem as cidades vizinhas.
    if (normalizeText(item.cidade ?? '') !== 'franca' || !item.url_amigavel) continue;
    const valor = toNumber(item.valor);
    if (valor <= 0) continue;

    const area = toNumber(item.areaprincipal);
    const areaTotal = toNumber(item.arealote) || area;
    const areaPreco = area || areaTotal;
    const titulo = cleanTitle(`${item.tipo ?? ''} - ${item.bairro ?? ''}`.replace(/^ - | - $/g, ''));
    const fotos = (item.fotos ?? []).map(f => f.urlp ?? '').filter(Boolean);

    imoveis.push({
      titulo,
      descricao: cleanTitle(item.titulo ?? ''),
      imagens: fotos.length > 0 ? fotos : (item.urlfotoprincipalp ? [item.urlfotoprincipalp] : []),
      endereco: normalizeNeighborhoodName(item.bairro ?? ''),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: parseInt(item.numeroquartos ?? '', 10) || 0,
      banheiros: parseInt(item.numerobanhos ?? '', 10) || 0,
      vagas: parseInt(item.numerovagas ?? '', 10) || 0,
      link: `https://${host}/imovel/${item.url_amigavel}/${item.codigo}`,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.codigoauxiliar || String(item.codigo),
      tipoImovel: inferTipoImovel(item.tipo ?? '') || undefined,
    });
  }

  // quantidade cobre as cidades vizinhas tambem: e o que define quantas paginas existem.
  return { imoveis, qtd: Number(body?.quantidade) || imoveis.length, json: body };
}

/** Par venda/aluguel de uma imobiliaria Imoview; `host` e o dominio do site (ex.: www.mudare.imb.br). */
export const buildImoviewSites = (host: string, label: string): Site[] =>
  (['venda', 'aluguel'] as Tipo[]).map(tipo => {
    const name = `${label} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
    const url = `https://${host}/retornar-imoveis-disponiveis`;
    return {
      enabled: true, tipo, url, name, driver: 'axios_rest', method: 'POST', itemsPerPage: PAGE_SIZE,
      axiosConfig: {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest', Referer: `https://${host}/${tipo}` },
        // O formulario tem chaves com colchetes ("bairros[0][nome]"): URLSearchParams mantem a chave literal.
        transformRequest: [(data: Record<string, string | number>) => new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)])).toString()],
      },
      payload: baseForm(tipo),
      getPaginateParams: (page: number) => ({ url, payload: { numeropagina: page } }),
      adapter: (payload: unknown) => parseImoview(payload, host, name),
    } as unknown as Site;
  });
