import re

# Safely add vlicit without breaking the existing ones

with open("src/sites/index.ts", "r") as f:
    content = f.read()

if "import vlicitimoveis" not in content:
    content = content.replace('import casafacilimobiliaria from "./casafacilimobiliaria";', 'import casafacilimobiliaria from "./casafacilimobiliaria";\nimport vlicitimoveis from "./vlicitimoveis";')
    content = content.replace('  casafacilimobiliaria as unknown as Site,', '  casafacilimobiliaria as unknown as Site,\n  vlicitimoveis,')
    with open("src/sites/index.ts", "w") as f:
        f.write(content)
