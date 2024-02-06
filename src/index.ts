// Importar as bibliotecas necessárias
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())
import qs from 'qs';

import cheerio from 'cheerio';

console.log('Carregando sites');
// Definir os parâmetros de busca
const valorMinimo = 100000; // em reais
const valorMaximo = 500000; // em reais
const quartos = 3; // número mínimo de quartos
const areaMinima = 50; // em metros quadrados
const areaMaxima = 200; // em metros quadrados

// Definir os sites de imóveis que serão consultados
const sites = [
  {
    nome: 'Franca',
    url: 'https://imoveisfranca.com.br/comprar/comprar',
    params: {
      'pagina': 1,
      'tipo': 'comprar',
      'TipoCompra': '11',
      'localizacao': 'franca',
      'banheiros': '2',
      'vagas': '2',
      'precoMin': 1,
      'filtro': 1
    },
    adapter: (html: string) => {
      // Extrair as informações dos imóveis a partir do HTML
      const $ = cheerio.load(html);
      const imoveis = $('.card-resultado').map((_i, el) => {
        const titulo = $(el).find('.titulo-resultado-busca').text().trim();
        const endereco = $(el).find('.endereco-resultado-busca').text().trim();
        const valor = $(el).find('.valores-resultado-busca').text().indexOf('Para detalhes') > 0 ? 0 : $(el).find('.valores-resultado-busca > h3').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
        const area = $(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || 0;
        const quartos = $(el).find('.comodidades-resultado-busca > div:nth-child(2)').text().replace('Quartos', '').trim();
        const banheiros = $(el).find('.comodidades-resultado-busca > div:nth-child(3)').text().replace('Banheiros', '').trim();
        const vagas = $(el).find('.comodidades-resultado-busca > div:nth-child(4)').text().replace('Vagas', '').trim();
        const imagens: string[] = [];
        $(el).find('.imagem-resultado').find('.carousel-inner >.carousel-item > img[src]').each((q, i) => imagens.push(i.attribs['src']));
        const link = $(el).find('.link-resultado').attr('href');
        const precoPorMetro = Number(valor) / Number(area);
        return {
          titulo,
          //  imagens,
          endereco,
          valor: Number(valor),
          area: Number(area),
          quartos: Number(quartos),
          link,
          banheiros: Number(banheiros),
          vagas: Number(vagas),
          precoPorMetro,
        };
      }).get();
      return imoveis;
    },
  }
];

// Definir uma função que filtra os imóveis de acordo com os parâmetros
const filtrarImoveis = (imoveis: any[]) => {
  return imoveis.filter(imovel => {
    return imovel.valor >= valorMinimo && imovel.valor <= valorMaximo
      && imovel.area >= areaMinima && imovel.area <= areaMaxima
      && imovel.quartos >= quartos;
  });
};

// Definir uma função que ordena os imóveis por precoPorMetro
const ordenarImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

// Definir uma função que gera uma lista das melhores oportunidades de compra
const gerarLista = async () => {
  // Criar um array vazio para armazenar os imóveis encontrados
  let lista: any[] = [];

  // Iniciar o navegador puppeteer
  const browser = await puppeteer.launch();

  // Percorrer os sites de imóveis
  for (const site of sites) {
    try {
      // Criar uma nova página
      const page = await browser.newPage();

      page.setRequestInterception(true);

      page.on('request', interceptedRequest => {
        if (
          !interceptedRequest.method().includes('GET') ||
          interceptedRequest.url().endsWith('.png') ||
          interceptedRequest.url().endsWith('.js') ||
          interceptedRequest.url().endsWith('.css') ||
          interceptedRequest.url().endsWith('.gif') ||
          interceptedRequest.url().endsWith('.jpeg') ||
          interceptedRequest.url().endsWith('.jpg')
        ) {
          interceptedRequest.abort();
        }
        else interceptedRequest.continue();
      });

      // Definir uma variável para controlar o número da página
      let pagina = 1;

      // Definir uma variável para indicar se há mais páginas para buscar
      let temMais = true;

      // Enquanto houver mais páginas para buscar
      while (temMais) {
        if (site.params.pagina) {
          site.params.pagina = pagina;
        }
        // Construir a url com os parâmetros de busca e o número da página
        const url = `${site.url}?${qs.stringify(site.params)} `;

        // Navegar para a url
        await page.goto(url);

        // Esperar o carregamento do conteúdo
        await page.waitForSelector('.row');

        // Obter o HTML da página
        const html = await page.content();

        // Usar o adapter do site para extrair os imóveis do HTML
        const imoveis = site.adapter(html);

        // Filtrar os imóveis de acordo com os parâmetros
        const imoveisFiltrados = filtrarImoveis(imoveis);

        // Adicionar os imóveis filtrados à lista
        lista = lista.concat(imoveisFiltrados);

        // Verificar se há um botão de próxima página
        const disabled = await page.$('.pagination .justify-content-center > li:nth-last-child(1).page-item.disabled');

        // Se houver, incrementar o número da página e continuar o loop
        if (!disabled) {
          pagina++;
          console.info(`Carregando dados da página ${pagina}`);
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

  // Fechar o navegador puppeteer
  await browser.close();

  // Ordenar a lista por valor
  lista = ordenarImoveis(lista);

  // Retornar a lista
  return lista;
};

// Chamar a função e mostrar o resultado no console
gerarLista()
  .then((lista) => {
    console.log(
      'Lista das melhores oportunidades de compra de imóveis em Franca, São Paulo:'
    );
    console.table(lista);
  })
  .catch((error) => {
    console.error(`Erro ao gerar a lista: ${error.message} `);
  });
