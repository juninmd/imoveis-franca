import { Site } from '../types';
import { parseLlmsCatalog } from './platforms/llmstxt';

const SITE_NAME = 'atitudeimoveisoficial.com.br';
const CATALOG_URL = 'http://www.atitudeimoveisoficial.com.br/llms.txt';

// Imobiliaria de Franca na plataforma ImobiBrasil. O certificado TLS nao cobre o dominio,
// entao o catalogo e os links ficam em http (upgrade para https quebraria os links).
export default {
  enabled: true,
  tipo: 'ambos',
  url: CATALOG_URL,
  name: SITE_NAME,
  driver: 'axios',
  itemsPerPage: 1000,
  params: [],
  getPaginateParams: () => ({ url: CATALOG_URL }),
  adapter,
} as Site;

export async function adapter(text: string) {
  return parseLlmsCatalog(text, SITE_NAME, false);
}
