import { Site } from '../types';
import { parseLlmsCatalog } from './platforms/llmstxt';

const SITE_NAME = 'ferreiraferreiraimob.com.br';
const CATALOG_URL = 'https://www.ferreiraferreiraimob.com.br/llms.txt';

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
  return parseLlmsCatalog(text, SITE_NAME);
}
