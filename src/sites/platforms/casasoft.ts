import { Imoveis, Site } from '../../types';
import { cleanTitle, normalizeNeighborhoodName, normalizeText } from '../../utils';

export interface CasasoftConfig {
  clientId: string;
  name: string;
}

export const buildCasasoftSites = ({ clientId, name }: CasasoftConfig): Site[] => {
  return [
    {
      enabled: true,
      tipo: 'venda',
      name,
      url: `https://apiimoveisv3.casasoftsig.com/api/v3/imoveis/pesquisa`,
      driver: 'axios_rest',
      method: 'GET',
      itemsPerPage: 100, // Not strictly 100 but pagination controls this if requested correctly
      getPaginateParams: (page: number) => ({
        url: `https://apiimoveisv3.casasoftsig.com/api/v3/imoveis/pesquisa?filtro.clienteid=${clientId}&filtro.tipodivulgacao=v&pagina=${page}&maximo=100`
      }),
      adapter: (payload: any) => parseCasasoft(payload, name, clientId, 'v')
    },
    {
      enabled: true,
      tipo: 'aluguel',
      name,
      url: `https://apiimoveisv3.casasoftsig.com/api/v3/imoveis/pesquisa`,
      driver: 'axios_rest',
      method: 'GET',
      itemsPerPage: 100,
      getPaginateParams: (page: number) => ({
        url: `https://apiimoveisv3.casasoftsig.com/api/v3/imoveis/pesquisa?filtro.clienteid=${clientId}&filtro.tipodivulgacao=l&pagina=${page}&maximo=100`
      }),
      adapter: (payload: any) => parseCasasoft(payload, name, clientId, 'l')
    }
  ] as Site[];
};

export async function parseCasasoft(payload: any, siteName: string, _clientId: string, tipo: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  let body = payload;
  if (typeof payload === 'string') {
    try {
      body = JSON.parse(payload);
    } catch(e) {}
  }

  const imoveis: Imoveis[] = [];
  const items = body?.data?.resultado || [];
  const qtd = body?.data?.total || 0;

  for(const item of items) {
    if (!item.imovelCidade || normalizeText(item.imovelCidade) !== 'franca') continue;

    const valor = tipo === 'v' ? (item.imovelValorVenda || 0) : (item.imovelValorLocacao || 0);
    if (valor <= 0) continue;

    const area = item.imovelAreaUtil || item.imovelAreaTotal || 0;
    const areaTotal = item.imovelAreaTotal || item.imovelAreaUtil || area;
    const bairro = normalizeNeighborhoodName(item.imovelBairro || 'Franca');

    const slugify = (str: string) => normalizeText(str || '').replace(/\s+/g, '-');
    const finalidade = tipo === 'v' ? 'venda' : 'locacao';

    // https://www.imobiliariaatual.com.br/imovel/apartamento/venda/franca/jardim-santo-agostinho/15230.15183
    const link = `https://www.${siteName}/imovel/${slugify(item.imovelTipoDescricao)}/${finalidade}/franca/${slugify(item.imovelBairro)}/${item.imovelReferencia}`;

    imoveis.push({
      titulo: cleanTitle(`${item.imovelTipoDescricao} em ${bairro}`),
      descricao: '',
      imagens: (item.fotos || []).map((f: any) => f.arquivoURL).filter(Boolean),
      endereco: bairro,
      valor,
      area,
      areaTotal,
      quartos: item.imovelQuartos || 0,
      banheiros: item.imovelBanheiros || 0,
      vagas: item.imovelVagas || 0,
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.2,
      codigo: item.imovelReferencia
    });
  }

  return { imoveis, qtd, html: '' };
}
