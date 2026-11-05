const fs = require('fs');
const file = 'src/sites/cidadenovaimoveis.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/suites = vals\[2\] \|\| 0;/g, "// suites = vals[2] || 0;");
code = code.replace(/suites = vals\[1\] \|\| 0;/g, "// suites = vals[1] || 0;");
fs.writeFileSync(file, code);
