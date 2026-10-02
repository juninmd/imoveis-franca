const fs = require('fs');
let code = fs.readFileSync('src/sites/index.ts', 'utf8');

const imobsToAdd = ['liderimobiliaria', 'imobiliariazanetti'];
let imports = '';
let items = '';

for (const imob of imobsToAdd) {
    if (!code.includes(`import ${imob}`)) {
        imports += `import ${imob} from "./${imob}";\n`;
        items += `  ${imob} as unknown as Site,\n`;
    }
}

if (imports) {
    code = imports + code;
    code = code.replace(/export const sites: Site\[\] = \[/, `export const sites: Site[] = [\n${items}`);
    fs.writeFileSync('src/sites/index.ts', code);
    console.log('patched index.ts');
}
