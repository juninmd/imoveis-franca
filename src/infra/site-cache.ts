import RedisConnection from './redis';
import { Imoveis } from '../types';

const FRESH_TTL_SECONDS = 3600;
const EMPTY_TTL_SECONDS = 300;
const STALE_WINDOW_SECONDS = 24 * 3600;
const JITTER_RATIO = 0.1;

interface Envelope {
  v: 1;
  freshUntil: number;
  lastGoodAt: number;
  data: Imoveis[];
}

export interface CachedSite {
  data: Imoveis[];
  fresh: boolean;
  lastGoodAt: number;
}

const isEnvelope = (raw: unknown): raw is Envelope =>
  !!raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as Envelope).v === 1 && Array.isArray((raw as Envelope).data);

// TTL com jitter: sem ele, todos os sites populados juntos expiram juntos e a proxima
// requisicao dispara o scraping de todos de uma vez.
const withJitter = (seconds: number, random: () => number): number =>
  Math.round(seconds * (1 + (random() * 2 - 1) * JITTER_RATIO));

/** Le a entrada do site. `fresh=false` significa vencida, mas ainda servivel enquanto se
 *  revalida em segundo plano (stale-while-revalidate). Aceita o formato antigo (array puro). */
export const readSiteCache = async (key: string, now = Date.now()): Promise<CachedSite | null> => {
  const raw = await RedisConnection.getKey<unknown>(key);
  if (Array.isArray(raw)) {
    return { data: raw as Imoveis[], fresh: true, lastGoodAt: now };
  }
  if (isEnvelope(raw)) {
    return { data: raw.data, fresh: raw.freshUntil > now, lastGoodAt: raw.lastGoodAt ?? now };
  }
  return null;
};

/** Grava o resultado. Vazio so vive o TTL curto (cache negativo); com dados, o Redis guarda
 *  por uma janela longa para que um site fora do ar continue servindo o ultimo resultado bom. */
export const writeSiteCache = async (
  key: string,
  data: Imoveis[],
  now = Date.now(),
  random: () => number = Math.random,
): Promise<void> => {
  const hasData = data.length > 0;
  const freshSeconds = withJitter(hasData ? FRESH_TTL_SECONDS : EMPTY_TTL_SECONDS, random);
  const envelope: Envelope = { v: 1, freshUntil: now + freshSeconds * 1000, lastGoodAt: now, data };
  await RedisConnection.setKey(key, envelope, hasData ? freshSeconds + STALE_WINDOW_SECONDS : freshSeconds);
};

/**
 * Estende dados antigos quando o refresh falhou, evitando martelar o site por 5 min.
 * A janela stale NAO reinicia: conta a partir do ultimo scraping bom. Sem esse teto, um dominio
 * morto ou um adapter quebrado serviria anuncios vendidos para sempre, sem nenhum sinal.
 * Devolve false quando a janela ja acabou (o chamador deve gravar o resultado vazio).
 */
export const extendSiteCache = async (key: string, data: Imoveis[], lastGoodAt: number, now = Date.now()): Promise<boolean> => {
  const remainingSeconds = Math.floor((lastGoodAt + (FRESH_TTL_SECONDS + STALE_WINDOW_SECONDS) * 1000 - now) / 1000);
  if (remainingSeconds <= 0) {
    return false;
  }
  const envelope: Envelope = { v: 1, freshUntil: now + EMPTY_TTL_SECONDS * 1000, lastGoodAt, data };
  await RedisConnection.setKey(key, envelope, remainingSeconds);
  return true;
};
