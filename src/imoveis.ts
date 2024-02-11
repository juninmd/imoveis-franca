// Importar as bibliotecas necessárias
import qs from 'qs';
import axios from 'axios';
import { puppetAdapter } from './puppeter';
import { exec } from 'child_process';
import { Imoveis, Sites, sites } from './sites';

// Definir os parâmetros de busca
const queryParams = {
  minPrice: 100000,
  maxPrice: 5000000,
  quartos: 2,
  minArea: 50,
  maxArea: 2000,
  maxPage: undefined,
  currentPage: 1,
}

// Definir uma função que filtra os imóveis de acordo com os parâmetros
const filtrarImoveis = (imoveis: Imoveis[]) => {
  const { maxPrice, minPrice, quartos, minArea, maxArea } = queryParams;
  return imoveis.filter(imovel => {
    return imovel.valor >= minPrice && imovel.valor <= maxPrice
      && imovel.areaTotal >= minArea && imovel.areaTotal <= maxArea
      && imovel.quartos >= quartos;
  });
};

// Definir uma função que ordena os imóveis por precoPorMetro
const ordenarImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

// Definir uma função que gera uma lista das melhores oportunidades de compra
export const gerarLista = async () => {
  // Criar um array vazio para armazenar os imóveis encontrados
  let lista: Imoveis[] = [];

  // Iniciar o navegador puppeteer
  const { page, browser } = await puppetAdapter();

  for (const site of sites.filter(q => q.enabled)) {
    try {
      // Definir uma variável para controlar o número da página
      queryParams.currentPage = 1;

      // Definir uma variável para indicar se há mais páginas para buscar
      let temMais = true;

      // Enquanto houver mais páginas para buscar
      while (temMais) {

        Object.keys(site.translateParams).forEach((param => {
          const paramName = site.translateParams[param];
          if (paramName) {
            site.params[paramName] = queryParams[param];
          }
        }));

        const url = `${site.url}?${qs.stringify(site.params)} `;
        const html = await retrieveHtml(page, url, site);
        const imoveis: any[] = (await site.adapter(html));
        imoveis.forEach(q => q.url = url);
        const imoveisFiltrados = filtrarImoveis(imoveis);
        lista = lista.concat(imoveisFiltrados);

        const disabled = await page.$(site.disableQuery);
        // Se houver, incrementar o número da página e continuar o loop
        if (!disabled && imoveis.length > 0 && (queryParams.maxPage === undefined || queryParams.maxPage !== undefined && queryParams.currentPage <= queryParams.maxPage)) {
          queryParams.currentPage++;
          console.info(`Carregando dados da página ${queryParams.currentPage}`);
        } else {
          // Se não houver, encerrar o loop
          temMais = false;
        }
      }
    } catch (error) {
      // Em caso de erro, mostrar uma mensagem no console
      console.error(`Erro ao consultar o site ${site.nome}: ${error.message} `);
    }
  }

  await browser.close();
  lista = ordenarImoveis(lista);
  return lista;
};

async function retrieveHtml(page, url: string, site: Sites) {
  console.info(url);
  if (site.driver === 'puppet') {
    await page.goto(url.trim());

    if (site.waitFor) {
      await page.waitForSelector(site.waitFor);
    }

    const html = await page.content();
    return html;
  }

  const { data: html } = await axios.get(url, { responseEncoding: 'utf8' });
  if (site.waitFor == undefined || html.indexOf(site.waitFor) >= 0) {
    return html;
  }
  throw new Error(`Html content not found`);
}

exec('open http://localhost:3000');