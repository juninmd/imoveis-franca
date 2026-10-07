import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

// Site MSysImob (Next.js): a listagem HTML so traz os 12 primeiros imoveis em __NEXT_DATA__ e a
// paginacao e feita no cliente via POST /api/service/consult (Solr). Usamos essa API direto,
// filtrando pela cidade de Franca (idtCity 1) para nao trazer imoveis de outras cidades.
const PAGE_SIZE = 12;

export default {
  driver: 'axios_rest',
  enabled: true,
  tipo: 'venda',
  name: 'locallizegoldimob.com.br',
  url: 'https://locallizegoldimob.com.br/api/service/consult',
  method: 'POST',
  payload: {
    start: 0,
    numRows: PAGE_SIZE,
    type: 'S',
    idtCityList: [1],
    idtDistrictList: [],
    idtCondominiumList: [],
    idtsCategories: [],
    idtsSubCategories: [],
    characteristics: [],
    fieldList: [
      'idtProperty', 'jsonPhotos', 'namStreet', 'namDistrict', 'namCity', 'namCategory', 'namSubCategory',
      'prop_char_1', 'prop_char_2', 'prop_char_5', 'prop_char_12', 'prop_char_95', 'prop_char_176',
      'valSales', 'desTitleSite', 'indType',
    ],
  },
  itemsPerPage: PAGE_SIZE,
  getPaginateParams: (page: number) => ({ payload: { start: (page - 1) * PAGE_SIZE, numRows: PAGE_SIZE } }),
  adapter,
} as Site;

const slug = (s: any) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function adapter(content: any): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  let data = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch (e) {
      return { imoveis: [], qtd: 0, html: content };
    }
  }
  const response = data?.response;
  const docs: any[] = Array.isArray(response?.docs) ? response.docs : [];
  const qtd = Number(response?.numFound) || 0;

  const imoveis: Imoveis[] = docs.map((imv: any) => {
    const valor = Number(imv.valSales) || 0;
    const areaTotal = Number(imv.prop_char_2) || 0;
    const area = Number(imv.prop_char_1) || Number(imv.prop_char_95) || areaTotal;

    const finalidade = imv.indType === 'SL' ? 'venda-e-locacao' : 'venda';
    const cat = slug(imv.namCategory);
    const city = slug(imv.namCity);
    const dist = slug(imv.namDistrict);
    const link = imv.idtProperty && cat && city && dist
      ? `https://locallizegoldimob.com.br/imovel/${finalidade}/${cat}/${city}/${dist}/${imv.idtProperty}`
      : '';

    let imagens: string[] = [];
    try {
      const fotos = typeof imv.jsonPhotos === 'string' ? JSON.parse(imv.jsonPhotos) : imv.jsonPhotos;
      imagens = (fotos || []).filter((f: any) => !f.flgNotShowSite).map((f: any) => f.urlPhoto || f.url).filter(Boolean);
    } catch (e) { /* ignore */ }

    const bairro = normalizeNeighborhoodName(imv.namDistrict || imv.namCity || 'Franca');
    const endereco = imv.namStreet ? `${imv.namStreet}, ${bairro}` : bairro;
    const categoria = imv.namCategory || 'Imóvel';

    return {
      titulo: imv.desTitleSite || `${categoria} à venda em ${bairro}`,
      descricao: '',
      imagens,
      endereco,
      valor,
      area,
      areaTotal,
      quartos: Number(imv.prop_char_5) || 0,
      banheiros: Number(imv.prop_char_176) || 0,
      vagas: Number(imv.prop_char_12) || 0,
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: 'locallizegoldimob.com.br',
      entrada: valor * 0.20,
    };
  }).filter((i: Imoveis) => i.valor > 0 && i.link !== '');

  return { imoveis, qtd, html: '' };
}
