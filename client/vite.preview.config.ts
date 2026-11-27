import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Serve docs/sonido-migration/preview.html a partir da raiz do repositório,
// reaproveitando o CSS real do client. Rode com `pnpm preview:sonido` dentro de client/.
const clientDir = path.dirname(fileURLToPath(import.meta.url));
const dependency = (name: string) => path.join(clientDir, 'node_modules', name);

export default defineConfig({
  root: path.resolve(clientDir, '..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    // A página de docs fica fora de client/; sem os aliases o Node não acha
    // os pacotes instalados em client/node_modules.
    alias: [
      // O export map do pacote aponta para dist/sonido.css; o alias direto
      // precisa repetir esse caminho para o CSS não cair na raiz do pacote.
      { find: '@juninmd/sonido/styles.css', replacement: dependency('@juninmd/sonido/dist/sonido.css') },
      { find: '@juninmd/sonido', replacement: dependency('@juninmd/sonido') },
      { find: 'react-dom', replacement: dependency('react-dom') },
      { find: 'react', replacement: dependency('react') },
      { find: 'lucide-react', replacement: dependency('lucide-react') },
      { find: 'clsx', replacement: dependency('clsx') },
      { find: 'framer-motion', replacement: dependency('framer-motion') },
    ],
  },
  server: {
    port: 5313,
    strictPort: true,
    fs: { allow: [path.resolve(clientDir, '..')] },
  },
});
