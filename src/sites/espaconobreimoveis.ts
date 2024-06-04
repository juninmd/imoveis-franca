import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  driver: 'axios_rest',
  enabled: true,
  name: 'espaconobreimoveis.com.br',
  url: 'https://espaconobreimoveis.com.br/busca/Imoveis',
  method: 'POST',
  payload: {
    "busca": {
      "comercializacao": "comprar",
      "cidade": [
        "Franca/SP"
      ]
    },
    "ordem": "recente",
    "skip": 0,
    "limit": 8,
    "modo": "imoveis"
  },
  itemsPerPage: 8,
  getPaginateParams: (page: number) => ({ payload: { skip: (page * 8) - 8, limit: 8 } }),
  adapter,
} as Site;

export async function adapter(json: any): Promise<{ imoveis: Imoveis[], qtd: number, json: any }> {
  const qtd = json.contador;
  const imoveis: Imoveis[] = [];

  const tiraAcentos = function (e) {
    var t = {
      'á': 'a',
      'à': 'a',
      'ä': 'a',
      'â': 'a',
      'ã': 'a',
      'é': 'e',
      'ê': 'e',
      'ë': 'e',
      'è': 'e',
      'í': 'i',
      'ï': 'i',
      '°': '',
      'º': '',
      'õ': 'o',
      'ó': 'o',
      'ô': 'o',
      'ö': 'o',
      'ü': 'u',
      'ú': 'u',
      'ç': 'c',
      'ñ': 'n',
      '[': '_',
      ']': '_'
    };
    return (e = e.toLowerCase()).replace(/[^A-Za-z0-9\[\] ]/g, function (e) {
      return t[e] ||
        e
    }).replace(new RegExp(/[\u0300-\u036f]/g), '');
  };

  const codUri = function (e) {
    return e = tiraAcentos(e),
      e = e.replace(new RegExp('[ , /]', 'g'), '-'),
      e = e.replace(new RegExp('[(, ), .]', 'g'), ''),
      e = e.replace('´', '')
  };

  for (const imovel of json.imoveis) {
    let link = 'https://espaconobreimoveis.com.br/imovel/' + imovel.sigla;
    imovel.comercializacao.venda &&
      imovel.comercializacao.venda.ativa &&
      (link += '-comprar')
    imovel.comercializacao.locacao &&
      imovel.comercializacao.locacao.ativa &&
      (link += '-alugar')
    link += '-' + codUri(imovel.tipo)
    imovel.local.incerto
    imovel.local.bairro &&
      (link += '-' + codUri(imovel.local.bairro))
    imovel.local.cidade &&
      (link += '-' + codUri(imovel.local.cidade));

    const titulo = imovel.tipo.toUpperCase();
    const endereco = normalizeNeighborhoodName(imovel.local.bairro);
    const valor = imovel.comercializacao.venda.preco;
    const quartos = imovel.numeros.dormitorios || 0;
    const banheiros = imovel.numeros.banheiros || 0;
    const vagas = imovel.numeros.vagas || 0;

    const imagens = imovel.midia.imagens.map((q: string) => { return `https://degust.gestaoreal.com.br/imagem-${imovel._id}---${imovel.imobiliaria._id}-${q}` });
    const area = imovel.numeros.areas.construida || imovel.numeros.areas.util || 0;
    const areaTotal = imovel.numeros.areas.terreno || imovel.numeros.areas.total || 0;
    const precoPorMetro = valor / areaTotal;
    const descricao = '';
    imoveis.push({
      titulo,
      descricao,
      imagens,
      endereco,
      valor,
      area: area || areaTotal,
      areaTotal: areaTotal || area,
      quartos: Number(quartos),
      link,
      banheiros: Number(banheiros),
      vagas: Number(vagas),
      precoPorMetro,
      site: 'espaconobreimoveis.com.br',
      entrada: valor * 0.20,
    });
  }
  return { imoveis, qtd, json };
};