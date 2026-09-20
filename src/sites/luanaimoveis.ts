import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.luanaimoveis.com.br/imoveis/a-venda/franca',
  name: 'luanaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.luanaimoveis.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  let qtd = 0;

  try {
      const scriptMatch = html.match(/<script[^>]*>([\s\S]*?window\.\$MC[\s\S]*?)<\/script>/);
      if (scriptMatch) {
           const scriptContent = scriptMatch[1];
           const startIdx = scriptContent.indexOf('concat({');
           if (startIdx > -1) {
                const str = scriptContent.substring(startIdx + 7);
                let brackets = 0;
                let endIdx = -1;
                for (let i = 0; i < str.length; i++) {
                    if (str[i] === '{') brackets++;
                    else if (str[i] === '}') {
                        brackets--;
                        if (brackets === 0) {
                            endIdx = i + 1;
                            break;
                        }
                    }
                }
                if (endIdx > -1) {
                    const jsonStr = str.substring(0, endIdx);
                    const data = JSON.parse(jsonStr);
                    let items: any[] = [];
                    const search = (o: any) => {
                        if(!o || typeof o !== 'object') return;
                        if(Array.isArray(o) && o.length > 0 && o[0].neighborhood && o[0].code) {
                            items = o;
                            return;
                        }
                        if(o.listings && Array.isArray(o.listings) && o.listings.length > 0 && o.listings[0].code) {
                            items = o.listings;
                            return;
                        }
                        for(const key in o) {
                            if(items.length > 0) break;
                            search(o[key]);
                        }
                    }
                    search(data);

                    if (items.length > 0) {
                        qtd = items.length;
                        for(const item of items) {
                            const link = `https://www.luanaimoveis.com.br/imovel/${item.url}`;
                            const titulo = item.title || `Imóvel em ${item.address?.neighborhood || ''}`;
                            let valor = 0;
                            if (item.prices && item.prices.length > 0) {
                                valor = item.prices[0].price || 0;
                            }
                            const endereco = normalizeNeighborhoodName(item.address?.neighborhood || '');
                            let area = 0, quartos = 0, banheiros = 0, vagas = 0;
                            if (item.details && Array.isArray(item.details)) {
                               const aDetail = item.details.find((d: any) => d.name === 'area');
                               if(aDetail) area = parseInt(aDetail.value, 10) || 0;
                               const qDetail = item.details.find((d: any) => d.name === 'bedrooms');
                               if(qDetail) quartos = parseInt(qDetail.value, 10) || 0;
                               const bDetail = item.details.find((d: any) => d.name === 'bathrooms');
                               if(bDetail) banheiros = parseInt(bDetail.value, 10) || 0;
                               const vDetail = item.details.find((d: any) => d.name === 'garages');
                               if(vDetail) vagas = parseInt(vDetail.value, 10) || 0;
                            }
                            let imagens: string[] = [];
                            if (item.images && Array.isArray(item.images)) {
                                imagens = item.images.map((img: any) => img.url).filter(Boolean);
                            }

                            if (valor > 0) {
                                imoveis.push({
                                    titulo,
                                    descricao: '',
                                    imagens,
                                    endereco,
                                    valor,
                                    area,
                                    areaTotal: area,
                                    quartos,
                                    banheiros,
                                    vagas,
                                    link,
                                    precoPorMetro: area > 0 ? valor / area : 0,
                                    site: 'luanaimoveis.com.br',
                                    entrada: valor * 0.2
                                });
                            }
                        }
                    }
                }
           }
      }
  } catch(e) {
      console.warn("Could not parse JSON for luanaimoveis.com.br");
  }

  return { imoveis, qtd, html };
}
