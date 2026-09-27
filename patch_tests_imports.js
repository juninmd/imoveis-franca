const fs = require('fs');

let content = fs.readFileSync('__tests__/novos-sites.test.ts', 'utf8');

// I'm manually adding the missing imports to the TOP
const missingImports = `import wi7imobiliaria from '../src/sites/wi7imobiliaria';
import fortscunha from '../src/sites/fortscunha';
import luanaimoveis from '../src/sites/luanaimoveis';\n\n`;

content = content.replace("import wi7imobiliaria from '../src/sites/wi7imobiliaria';\nimport fortscunha from '../src/sites/fortscunha';\nimport luanaimoveis from '../src/sites/luanaimoveis';\n\n", "");

fs.writeFileSync('__tests__/novos-sites.test.ts', missingImports + content);
