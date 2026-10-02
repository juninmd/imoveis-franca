const fs = require('fs');
let code = fs.readFileSync('client/src/Home.tsx', 'utf8');

if (!code.includes('Limpar Todos os Filtros')) {
  // Encontrar o botão de limpar filtros que já possa existir ou adicionar um novo
  code = code.replace(
      /<\/div>\s*<\/AnimatePresence>\s*<\/div>\s*<\/div>\s*<\!-- active filters/g,
      `</div></AnimatePresence></div></div>`
  ); // fallback caso precisasse
}
