const fs = require('fs');
const file = 'src/sites/cidadenovaimoveis.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/quartos,\n\s*link,/g, "quartos,\n        suites,\n        link,");
fs.writeFileSync(file, code);
