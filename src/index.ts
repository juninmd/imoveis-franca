import { generateList } from './imoveis';
import './server';

async function init() {
  try {
    await generateList({});
  } catch (error) {
    console.error(`Falha ao iniciar Cache ${error.message} ${error.stack}`);
  }
}
init();