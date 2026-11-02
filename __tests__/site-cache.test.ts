import RedisConnection from '../src/infra/redis';
import { extendSiteCache, readSiteCache, writeSiteCache } from '../src/infra/site-cache';
import { Imoveis } from '../src/types';

jest.mock('../src/infra/redis', () => {
  const impl = { getKey: jest.fn(), setKey: jest.fn() };
  return { __esModule: true, default: impl, RedisConnection: impl };
});

const getKey = RedisConnection.getKey as jest.Mock;
const setKey = RedisConnection.setKey as jest.Mock;
const item = { titulo: 'a', link: 'http://a', valor: 1 } as Imoveis;
const DAY = 24 * 3600;

describe('site-cache', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('readSiteCache', () => {
    it('devolve null quando nao ha entrada', async () => {
      getKey.mockResolvedValue(null);
      expect(await readSiteCache('k')).toBeNull();
    });

    it('trata o formato antigo (array puro) como fresco, para o deploy nao invalidar o cache', async () => {
      getKey.mockResolvedValue([item]);
      expect(await readSiteCache('k', 1000)).toEqual({ data: [item], fresh: true, lastGoodAt: 1000 });
    });

    it('marca como fresco enquanto freshUntil esta no futuro', async () => {
      getKey.mockResolvedValue({ v: 1, freshUntil: 2000, lastGoodAt: 500, data: [item] });
      expect(await readSiteCache('k', 1000)).toEqual({ data: [item], fresh: true, lastGoodAt: 500 });
    });

    it('marca como vencido (servivel) depois de freshUntil', async () => {
      getKey.mockResolvedValue({ v: 1, freshUntil: 1000, lastGoodAt: 400, data: [item] });
      expect(await readSiteCache('k', 1000)).toEqual({ data: [item], fresh: false, lastGoodAt: 400 });
    });

    it('envelope sem lastGoodAt assume agora', async () => {
      getKey.mockResolvedValue({ v: 1, freshUntil: 1000, data: [item] });
      expect((await readSiteCache('k', 1500))?.lastGoodAt).toBe(1500);
    });

    it.each([
      ['objeto sem versao', { data: [item] }],
      ['versao desconhecida', { v: 2, freshUntil: 1, data: [item] }],
      ['data nao e array', { v: 1, freshUntil: 1, data: 'x' }],
      ['string', 'lixo'],
    ])('ignora entrada corrompida: %s', async (_name, raw) => {
      getKey.mockResolvedValue(raw);
      expect(await readSiteCache('k')).toBeNull();
    });
  });

  describe('writeSiteCache', () => {
    it('com dados: janela fresca de 1h (sem jitter) + 24h de stale no Redis', async () => {
      await writeSiteCache('k', [item], 1000, () => 0.5);
      expect(setKey).toHaveBeenCalledWith('k', { v: 1, freshUntil: 1000 + 3600 * 1000, lastGoodAt: 1000, data: [item] }, 3600 + DAY);
    });

    it('aplica jitter de +-10% para os sites nao expirarem todos juntos', async () => {
      await writeSiteCache('k', [item], 0, () => 0);
      await writeSiteCache('k', [item], 0, () => 1);
      expect(setKey.mock.calls.map(call => call[2])).toEqual([3240 + DAY, 3960 + DAY]);
    });

    it('vazio: cache negativo de 5 min, sem janela stale', async () => {
      await writeSiteCache('k', [], 1000, () => 0.5);
      expect(setKey).toHaveBeenCalledWith('k', { v: 1, freshUntil: 1000 + 300 * 1000, lastGoodAt: 1000, data: [] }, 300);
    });

    it('usa Date.now e Math.random por padrao', async () => {
      await writeSiteCache('k', [item]);
      expect(setKey.mock.calls[0][1].freshUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('extendSiteCache', () => {
    it('renova por 5 min os dados antigos, sem reiniciar a janela stale', async () => {
      const lastGoodAt = 1_000_000;
      const now = lastGoodAt + 2 * 3600 * 1000; // 2h depois do ultimo scraping bom
      expect(await extendSiteCache('k', [item], lastGoodAt, now)).toBe(true);
      expect(setKey).toHaveBeenCalledWith('k', { v: 1, freshUntil: now + 300 * 1000, lastGoodAt, data: [item] }, 3600 + DAY - 2 * 3600);
    });

    it('recusa quando o ultimo scraping bom saiu da janela (site morto nao serve anuncio para sempre)', async () => {
      const lastGoodAt = 1_000_000;
      const now = lastGoodAt + (3600 + DAY) * 1000;
      expect(await extendSiteCache('k', [item], lastGoodAt, now)).toBe(false);
      expect(setKey).not.toHaveBeenCalled();
    });

    it('usa Date.now por padrao', async () => {
      expect(await extendSiteCache('k', [item], Date.now())).toBe(true);
    });
  });
});
