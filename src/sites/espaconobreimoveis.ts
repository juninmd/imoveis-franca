import { buildProjetiveSite, parseProjetive } from './platforms/projetive';

const BASE = 'https://espaconobreimoveis.com.br';
const NAME = 'espaconobreimoveis.com.br';

export default buildProjetiveSite({ base: BASE, name: NAME });

export const adapter = async (json: any) => parseProjetive(json, NAME, BASE);
