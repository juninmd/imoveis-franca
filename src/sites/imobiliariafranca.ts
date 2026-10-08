import { Site, Imoveis } from '../types';


export default {
  enabled: true,
  name: 'imobiliariafranca.com.br',
  driver: 'axios',
  url: 'https://www.imobiliariafranca.com.br/api/properties?contract=venda&page=1',
  itemsPerPage: 20,
  getPaginateParams: (page: number) => ({ url: `https://www.imobiliariafranca.com.br/api/properties?contract=venda&page=${page}` }),
  adapter: async (json: any) => {
    let results = [];
    if (typeof json === 'string') {
        try {
            json = JSON.parse(json);
        } catch (e) {
            return { imoveis: [], qtd: 0 };
        }
    }

    if (json && json.results) {
        results = json.results;
    } else {
        return { imoveis: [], qtd: 0 };
    }

    const imoveis: Imoveis[] = results.map((imv: any) => {
      let valor = 0;
      if (imv.contracts && imv.contracts.length > 0) {
          const vendaContract = imv.contracts.find((c: any) => c.type === 'Venda');
          if (vendaContract && vendaContract.price_cents) {
              valor = vendaContract.price_cents / 100;
          }
      }

      const imagens = [];
      if (imv.cover_image) {
          imagens.push(`https://www.imobiliariafranca.com.br${imv.cover_image}`);
      }

      const bairro = imv.neighborhood ? imv.neighborhood.trim() : '';
      const cidade = imv.city ? imv.city.trim() : '';
      const endereco = [bairro, cidade].filter(Boolean).join(', ');

      const area = imv.total_area || 0;

      return {
        site: 'imobiliariafranca.com.br',
        titulo: `${imv.type} em ${bairro}`,
        descricao: '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal: area,
        quartos: imv.bedrooms || 0,
        banheiros: imv.bathrooms || 0,
        vagas: imv.garages || 0,
        link: `https://www.imobiliariafranca.com.br/imovel/${imv.code}`,
        entrada: valor * 0.20,
        precoPorMetro: area > 0 ? valor / area : 0
      };
    }).filter((imv: Imoveis) => imv.valor > 0);

    return {
      imoveis,
      qtd: json.total || 0
    };
  }
} as Site;
