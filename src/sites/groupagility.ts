import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.groupagility.com.br/imoveis/a-venda/franca-sp',
  name: 'groupagility.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.groupagility.com.br/imoveis/a-venda/franca-sp?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const match = html.match(/__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (!match) return { imoveis: [], qtd: 0, html };

  const data = JSON.parse(match[1]);
  const pageProps = data.props?.pageProps;
  if (!pageProps || !pageProps.imoveis) return { imoveis: [], qtd: 0, html };

  const sourceImoveis = pageProps.imoveis || [];

  let qtd = sourceImoveis.length;
  if (pageProps.pagination && pageProps.pagination.totalItems) {
      qtd = pageProps.pagination.totalItems;
  } else if (pageProps.total) {
      qtd = pageProps.total;
  }

  const imoveis: Imoveis[] = sourceImoveis.map((imv: any) => {
    const valor = imv.imv_preco_venda || 0;
    const area = imv.imv_area_util || imv.imv_area_total || 0;

    // Fallback URL construct
    // They have url_amiga property
    const link = imv.url_amiga || `https://www.groupagility.com.br/imovel/${imv.id}`;

    const imagens: string[] = (imv.fotos || []).map((f: any) => f.fullsize || f.imvft_url || '').filter((url: string) => url);

    const endereco = normalizeNeighborhoodName(imv.imv_bairro || imv.imv_endereco || 'Franca');

    return {
        titulo: imv.imv_titulo || `Imóvel à venda em ${endereco}`,
        descricao: imv.imv_obs || '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal: imv.imv_area_total || area,
        quartos: imv.imv_qtd_dorm || 0,
        banheiros: imv.imv_qtd_banheiros || 0,
        vagas: imv.imv_qtd_vagas || 0,
        link,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'groupagility.com.br',
        entrada: valor * 0.20
    }
  }).filter((i: any) => i.valor > 0);

  return { imoveis, qtd, html };
}
