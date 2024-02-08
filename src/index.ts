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
const sites: { enabled: boolean, waitFor: string, disableQuery: string, nome: string, url: string, params: any, adapter: (html: string) => any }[] = [
  {
    nome: 'Franca',
    enabled: false,
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
      const $ = cheerio.load(html);
      const qtd = $('#result').text().trim();
      console.log(qtd);
      const imoveis = $('.card-resultado').map((_i, el) => {
        const titulo = $(el).find('.titulo-resultado-busca').text().trim();
        const endereco = $(el).find('.endereco-resultado-busca').text().trim();
        const valor = $(el).find('.valores-resultado-busca').text().indexOf('Para detalhes') > 0 ? 0 : $(el).find('.valores-resultado-busca > h3').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
        const area = $(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || 0;
        const areaTotal = $(el).find('.comodidades-resultado-busca > div:nth-child(1)').text().replace('m²', '').trim() || 0;
        const quartos = $(el).find('.comodidades-resultado-busca > div:nth-child(2)').text().replace('Quartos', '').trim();
        const banheiros = $(el).find('.comodidades-resultado-busca > div:nth-child(3)').text().replace('Banheiros', '').trim();
        const vagas = $(el).find('.comodidades-resultado-busca > div:nth-child(4)').text().replace('Vagas', '').trim();
        const imagens: string[] = [];
        $(el).find('.imagem-resultado').find('.carousel-inner >.carousel-item > img[src]').each((_q, i) => { imagens.push(i.attribs['src']) });
        const link = $(el).find('.link-resultado').attr('href');
        const precoPorMetro = Number(valor) / Number(areaTotal);
        return {
          titulo,
          imagens,
          endereco,
          valor: Number(valor),
          area: Number(area),
          areaTotal: Number(areaTotal),
          quartos: Number(quartos),
          link,
          banheiros: Number(banheiros),
          vagas: Number(vagas),
          precoPorMetro,
        };
      }).get();
      return imoveis;
    },
    disableQuery: '.pagination .justify-content-center > li:nth-last-child(1).page-item.disabled',
    waitFor: '.row'
  },
  {
    enabled: true,
    waitFor: '#list-type',
    url: 'https://www.aacosta.com.br/listagem.jsp',
    nome: 'aacosta',
    params: {
      negociacao: 2,
      tipo: 1,
      cidade: 1,
      ordem: 'preco',
    },
    disableQuery: '.pagination>ul>li:nth-last-child(1)>a:not([href])',
    async adapter(html) {
      const $ = cheerio.load(html);
      const qtd = $('ul>span.proerty-price.pull-right>h4').text().trim();
      console.log(qtd);

      const imoveis: any[] = [];

      for (const el of $('div.col-sm-6.col-md-4.p0')) {
        const link = `https://www.aacosta.com.br/${$(el).find('a').attr('href')}`;
        const titulo = $(el).find('h5>a').text().trim();
        const endereco = $(el).find('div.item-entry>span>b').text().trim();
        const valor = $(el).find('div.item-entry>span.proerty-price').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
        const infos = $('div.item-entry>.property-icon').text().replace(/\n/g, '').replace(/ /g, '').replace(/\W/g, ' ').trim().split(' ');
        const quartos = infos[0];
        const vagas = infos[2];

        const imagens: any[] = [$(el).find('a>img[src]').attr('src')];

        const { data: details } = await axios.get('https://www.aacosta.com.br/Imovel.jsp?codimovel=3199');
        const $$ = cheerio.load(details);

        const areaTotal = $$('.property-meta.entry-meta.clearfix>div:nth-child(2)').text().replace('.00 m�', '').replace(/\D/g, '');
        const area = $$('.property-meta.entry-meta.clearfix>div:nth-child(3)').text().replace('.00 m�', '').replace(/\D/g, '');
        const banheiros = $$('div.s-property-content>p').text().trim().match(/banheiro/g)?.length || 1;
        const precoPorMetro = Number(valor) / Number(areaTotal);
        imoveis.push({
          titulo,
          imagens,
          endereco,
          areaTotal: Number(areaTotal),
          valor: Number(valor),
          area: Number(area),
          quartos: Number(quartos),
          link,
          banheiros: Number(banheiros),
          vagas: Number(vagas),
          precoPorMetro,
        });
      }
      return imoveis;
    },
  }

];

// Definir uma função que filtra os imóveis de acordo com os parâmetros
const filtrarImoveis = (imoveis: any[]) => {
  return imoveis.filter(imovel => {
    return imovel.valor >= valorMinimo && imovel.valor <= valorMaximo
      && imovel.areaTotal >= areaMinima && imovel.areaTotal <= areaMaxima
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
  for (const site of sites.filter(q => q.enabled)) {
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
          site.params.numpagina = pagina;
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
        const imoveis: any[] = (await site.adapter(html));
        imoveis.forEach(q => q.url = url);

        // Filtrar os imóveis de acordo com os parâmetros
        const imoveisFiltrados = filtrarImoveis(imoveis);

        // Adicionar os imóveis filtrados à lista
        lista = lista.concat(imoveisFiltrados);

        // Verificar se há um botão de próxima página
        const disabled = await page.$(site.disableQuery);

        // Se houver, incrementar o número da página e continuar o loop
        if (!disabled && imoveis.length > 0) {
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

// Importar o módulo http do nodejs
import http from "http";
import axios from 'axios';

// Criar um servidor http
const server = http.createServer(async (_req, res) => {
  // Definir o conteúdo da resposta como html
  res.setHeader("Content-Type", "text/html charset=utf-8");

  const lista = await gerarLista();
  console.log(
    'Lista das melhores oportunidades de compra de imóveis em Franca, São Paulo:'
  );

  // Definir o estilo css da tabela
  const style = `
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
      }

      th, td {
        border: 1px solid black;
        padding: 10px;
        text-align: left;
      }

      th {
        background-color: #4CAF50;
        color: white;
      }

      tr:nth-child(even) {
        background-color: #f2f2f2;
      }

      a {
        color: blue;
        text-decoration: none;
      }

      a:hover {
        color: red;
        text-decoration: underline;
      }

      img {
        max-width: 300px;
        max-height: 300px;
      }
    </style>
  `;

  // Definir o cabeçalho da tabela com os nomes das colunas
  const header = `
    <tr>
      <th>Imagem</th>
      <th>Título</th>
      <th>Endereço</th>
      <th>Valor (R$)</th>
      <th>Área (m²)</th>
      <th>Quartos</th>
      <th>Banheiros</th>
      <th>Vagas</th>
      <th>Preço por metro (R$)</th>
      <th>Link</th>
    </tr>
  `;

  // Definir o corpo da tabela com os dados do payload
  let body = "";
  for (let item of lista) {
    body += `
      <tr>
        <td><img src="${item.imagens[0]}" /></td>
        <td>${item.titulo}</td>
        <td>${item.endereco}</td>
        <td>${item.valor.toLocaleString("pt-BR")}</td>
        <td>${item.area}</td>
        <td>${item.quartos}</td>
        <td>${item.banheiros}</td>
        <td>${item.vagas}</td>
        <td>${item.precoPorMetro.toLocaleString("pt-BR")}</td>
        <td><a href="${item.link}" target="_blank">Ver mais</a></td>
      </tr>
    `;
  }

  // Definir o html da tabela com o estilo, o cabeçalho e o corpo
  const table = `
    <meta charset="UTF-8"/>
    <table>
      ${style}
      ${header}
      ${body}
    </table>
  `;

  // Escrever o html da tabela na resposta
  res.write(table);

  // Encerrar a resposta
  res.end();
});

// Definir a porta do servidor
const port = 3000;

// Iniciar o servidor na porta definida
server.listen(port, () => {
  console.log(`Servidor rodando http://localhost:${port}`);
});
