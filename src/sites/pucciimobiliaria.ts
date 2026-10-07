import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

// Site Imoview ("Pucci Imobiliaria"): a listagem (/venda/imoveis/...) e montada no cliente via
// POST /imoveis/ajax/ (form-urlencoded, campos `imovel[...]`). Chamamos esse endpoint direto,
// filtrando pela cidade Franca (codigocidade 2) para nao trazer imoveis de outras cidades.
const PAGE_SIZE = 20;
const BASE = 'https://www.pucciimobiliaria.com.br';

const buildImovel = (page: number) => ({
  finalidade: 'venda',
  codigounidade: '',
  codigosimoveis: '',
  codigoTipo: { codigo: '' },
  codigocidade: 2,
  codigoregiao: 0,
  codigosbairros: 0,
  endereco: 0,
  numeroquartos: 0,
  numerovagas: 0,
  numerobanhos: 0,
  numerosuite: 0,
  valorde: 0,
  valorate: 0,
  areade: 0,
  areaate: 0,
  opcaoimovel: 4,
  ordenacao: 'valordesc',
  codigocondominio: '0',
  numeropagina: page,
  pagina: page, // obrigatorio (o backend responde 500 sem ele)
  numeroregistros: PAGE_SIZE,
});

export default {
  driver: 'axios_rest',
  enabled: true,
  tipo: 'venda',
  name: 'pucciimobiliaria.com.br',
  url: `${BASE}/imoveis/ajax/`,
  method: 'POST',
  payload: { imovel: buildImovel(1) },
  axiosConfig: {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
    },
  },
  itemsPerPage: PAGE_SIZE,
  // getImoveis faz merge raso do payload, entao devolvemos o objeto `imovel` completo.
  getPaginateParams: (page: number) => ({ payload: { imovel: buildImovel(page) } }),
  adapter,
} as Site;

// "R$ 1.250.000,00" -> 1250000 ; "1.234,56" -> 1234.56
const num = (s: any): number => {
  if (typeof s === 'number') return s;
  const n = parseFloat(String(s ?? '').replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export async function adapter(content: any): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  let data = content;
  if (typeof content === 'string') {
    try {
      // O backend PHP as vezes antepoe "Warning" em HTML ao JSON.
      const start = content.indexOf('{');
      data = JSON.parse(start >= 0 ? content.slice(start) : content);
    } catch (e) {
      return { imoveis: [], qtd: 0, html: content };
    }
  }

  const lista: any[] = Array.isArray(data?.lista) ? data.lista : [];
  const qtd = Number(data?.quantidade) || 0;

  const imoveis: Imoveis[] = lista.map((imv: any) => {
    const valor = num(imv.valor);
    const isTerreno = imv.tipo === 'Terreno' || imv.tipo === 'Sitio';
    const areaLote = num(imv.arealote);
    const areaInterna = num(imv.areainterna);
    // areaprincipal pode vir em alqueires (tipomedida "alq."), so serve como m2 quando for "m²"
    const areaPrincipal = imv.tipomedida === 'm²' ? num(imv.areaprincipal) : 0;
    const area = (isTerreno ? areaLote : areaInterna) || areaInterna || areaLote || areaPrincipal;

    const imagens: string[] = Array.isArray(imv.fotos) && imv.fotos.length
      ? imv.fotos.map((f: any) => f.urlp).filter(Boolean)
      : (imv.urlfotoprincipalp ? [imv.urlfotoprincipalp] : []);

    const bairro = normalizeNeighborhoodName(imv.bairro || imv.cidade || 'Franca');
    const rua = imv.endereco && imv.endereco !== '*' ? String(imv.endereco) : '';
    const endereco = rua ? `${rua}, ${bairro}` : bairro;

    return {
      titulo: `${imv.tipo || 'Imóvel'} em ${bairro}`,
      descricao: imv.descricaoFotoPrincipal || '',
      imagens,
      endereco,
      valor,
      area,
      areaTotal: areaLote || area,
      quartos: parseInt(imv.numeroquartos, 10) || 0,
      banheiros: parseInt(imv.numerobanhos, 10) || 0,
      vagas: parseInt(imv.numerovagas, 10) || 0,
      link: imv.codigo && imv.titulo ? `${BASE}/imovel/${imv.titulo}/${imv.codigo}` : '',
      precoPorMetro: area > 0 ? valor / area : 0,
      site: 'pucciimobiliaria.com.br',
      entrada: valor * 0.20,
    };
  }).filter((i: Imoveis) => i.valor > 0 && i.link !== '');

  return { imoveis, qtd, html: '' };
}
