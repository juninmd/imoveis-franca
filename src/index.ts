import './server';

import { generateList } from './imoveis';

async function init() {
  try {
    await generateList();
  } catch (error) {
    console.error(`Falha ao iniciar Cache`);
  }
}
init();