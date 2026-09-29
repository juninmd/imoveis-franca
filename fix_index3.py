import re

with open("src/sites/index.ts", "r") as f:
    content = f.read()

# remove duplicate top imports
content = content.replace("import fortscunha from \"./fortscunha\";\nimport wi7imobiliaria from \"./wi7imobiliaria\";\nimport agessani from \"./agessani\";\nimport luanaimoveis from \"./luanaimoveis\";\n", "", 1)

with open("src/sites/index.ts", "w") as f:
    f.write(content)
