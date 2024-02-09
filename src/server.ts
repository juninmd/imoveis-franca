import http from "http";
import { gerarLista } from './imoveis';

// Definir a porta do servidor
const port = 3000;

// Criar um servidor http
const server = http.createServer(async (_req, res) => {
  // Definir o conteúdo da resposta como html
  res.setHeader("Content-Type", "text/html");

  const lista = await gerarLista();
  console.log(
    'Lista das melhores oportunidades de compra de imóveis em Franca, São Paulo:'
  );

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
        max-height: 110px;
      }

      .lightbox {
        display: none;
        position: fixed;
        z-index: 999;
        width: auto;
        height: auto;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        margin: auto;
        background: rgba(0, 0, 0, 0.8);
        text-align: center;
      }

      .lightbox img {
        max-width: 80%;
        max-height: 80%;
        margin-top: 5%;
      }
    </style>
  `;

  // Definir o cabeçalho da tabela com os nomes das colunas
  const header = `
    <thead>
      <tr>
        <th>Imagem</th>
        <th>Título</th>
        <th>Endereço</th>
        <th>Valor (R$)</th>
        <th>Área (m²)</th>
        <th>Área Terreno (m²)</th>
        <th>Quartos</th>
        <th>Banheiros</th>
        <th>Vagas</th>
        <th>Preço por metro (R$)</th>
        <th>Link</th>
      </tr>
    </thead>
  `;

  // Definir o corpo da tabela com os dados do payload
  let body = "<tbody>";
  for (let item of lista) {
    body += `
      <tr>
       <td><a href="#" onclick="showImage('${item.imagens[0]}')"><img src="${item.imagens[0]}" /></a></td>
        <td>${item.titulo}</td>
        <td>${item.endereco}</td>
        <td>${item.valor.toLocaleString("pt-BR")}</td>
        <td>${item.area}</td>
        <td>${item.areaTotal}</td>
        <td>${item.quartos}</td>
        <td>${item.banheiros}</td>
        <td>${item.vagas}</td>
        <td>${item.precoPorMetro}</td>
        <td><a href="${item.link}" target="_blank">Ver mais</a></td>
      </tr>
    `;
  }
  body += "</tbody>";

  // Definir o html da tabela
  const table = `
    <meta charset="UTF-8"/>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.2/css/bulma.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/v/bm/jq-3.7.0/dt-1.13.8/b-2.4.2/b-html5-2.4.2/b-print-2.4.2/r-2.5.0/sc-2.3.0/datatables.min.css" rel="stylesheet">
    <script type="text/javascript" charset="utf8" src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
    <script src="https://cdn.datatables.net/v/bm/jq-3.7.0/dt-1.13.8/b-2.4.2/b-html5-2.4.2/b-print-2.4.2/r-2.5.0/sc-2.3.0/datatables.min.js"></script>
    <script>
     function showImage(imageUrl) {
        $('.lightbox').html('<img src="' + imageUrl + '">').fadeIn();
      }

      function hideImage() {
        $('.lightbox').fadeOut();
      }

      $(document).ready(function() {
        $('table').DataTable();
      });
       $(document).mouseup(function(e) {
        var container = $('.lightbox');
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          container.fadeOut();
        }
      });
    </script>
    <html class="dark">
      <table>
        ${style}
        ${header}
        ${body}
      </table>
       <div class="lightbox" onClick="hideImage()"></div>
    </html>
  `;

  // Escrever o html da tabela na resposta
  res.write(table);

  // Encerrar a resposta
  res.end();
});

// Iniciar o servidor na porta definida
server.listen(port, () => {
  console.log(`Servidor rodando http://localhost:${port}`);
});
