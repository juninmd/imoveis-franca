const fs = require('fs');
const file = 'src/sites/cidadenovaimoveis.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/infos\.match\(\/\\(\.\+)\/g, ' '\)/g, "infos.replace(/\\\\s+/g, ' ')");
fs.writeFileSync(file, code);
