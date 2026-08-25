import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://altagalleria.com.br/comprar/todos',
  name: 'altagalleria.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://altagalleria.com.br/comprar/todos?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  // O site devolve o html principal em next.js mas sem o payload real diretamente no NEXT_DATA que testamos, entao tentamos ver se tem imoveis no json.
  const match = html.match(/__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (!match) return { imoveis: [], qtd: 0, html };

  const data = JSON.parse(match[1]);

  // They are putting properties under props.initialState.result.propertys ? or sometimes it's empty
  // We'll map the correct names from MSysImob based on code review: valSales, idtProperty, namDistrict, jsonPhotos
  const sourceImoveis = data?.props?.initialState?.result?.propertys || data?.props?.pageProps?.initialState?.result?.propertys || [];

  let qtd = sourceImoveis.length;
  if (data?.props?.initialState?.result?.pagination?.total) {
      qtd = data?.props?.initialState?.result?.pagination?.total;
  } else if (data?.props?.pageProps?.initialState?.result?.pagination?.total) {
      qtd = data?.props?.pageProps?.initialState?.result?.pagination?.total;
  }

  const imoveis: Imoveis[] = sourceImoveis.map((imv: any) => {
    const valor = imv.valSales || imv.valSale || imv.sale_value || 0;
    const area = imv.numUsefulArea || imv.numTotalArea || imv.useful_area || imv.total_area || 0;

    let link = '';
    const code = imv.idtProperty || imv.code;
    const cat = String(imv.namCategory || imv.category || '').toLowerCase().replace(/\s+/g, '-');
    const city = String(imv.namCity || imv.city || '').toLowerCase().replace(/\s+/g, '-');
    const dist = String(imv.namDistrict || imv.district || '').toLowerCase().replace(/\s+/g, '-');

    if (cat && city && dist && code) {
      link = `https://altagalleria.com.br/imovel/venda/${cat}/${city}/${dist}/${code}`;
    }

    let imagens: string[] = [];
    if (imv.jsonPhotos) {
       try {
           const fotos = typeof imv.jsonPhotos === 'string' ? JSON.parse(imv.jsonPhotos) : imv.jsonPhotos;
           imagens = fotos.map((f: any) => f.url || f).filter(Boolean);
       } catch (e) { /* ignore */ }
    } else if (imv.photos) {
       imagens = imv.photos.map((p: any) => p.url).filter(Boolean);
    }

    const endereco = normalizeNeighborhoodName(imv.namDistrict || imv.district || imv.namCity || imv.city || 'Franca');

    return {
        titulo: imv.namTitle || imv.title || `${imv.namCategory || imv.category || 'Imóvel'} em ${endereco}`,
        descricao: imv.txtDescription || imv.description || '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal: imv.numTotalArea || imv.total_area || area,
        quartos: imv.numBedrooms || imv.bedroom || 0,
        banheiros: imv.numBathrooms || imv.bathroom || 0,
        vagas: imv.numGarage || imv.garage || 0,
        link,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'altagalleria.com.br',
        entrada: valor * 0.20
    }
  }).filter((i: any) => i.valor > 0 && i.link !== '');

  return { imoveis, qtd, html };
}
