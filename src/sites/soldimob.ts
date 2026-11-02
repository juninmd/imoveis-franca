import { buildKenloSites, parseKenlo } from './platforms/kenlo';

const HOST = 'https://www.soldimob.com.br';

export default buildKenloSites(HOST, 'soldimob.com.br');

export const adapter = (payload: unknown, siteName = 'soldimob.com.br') => parseKenlo(payload, HOST, siteName);
