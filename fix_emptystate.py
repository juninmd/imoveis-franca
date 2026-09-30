import re
with open("client/src/components/EmptyState.tsx", "r") as f:
    content = f.read()

content = content.replace("  tips?: string[];\n  tips?: string[];", "  tips?: string[];")
content = content.replace("  tips?: string[];\n  action?: {\n    label: string;\n    onClick: () => void;\n  };\n  tips?: string[];", "  action?: {\n    label: string;\n    onClick: () => void;\n  };\n  tips?: string[];")

with open("client/src/components/EmptyState.tsx", "w") as f:
    f.write(content)
