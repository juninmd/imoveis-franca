/**
 * Enumera os anunciantes de Franca no Chaves na Mao (JSON-LD `offeredBy`) e ordena por volume.
 *
 * Uso: npx tsx scripts/list-advertisers.ts
 *
 * Serve para achar lacunas de cobertura: um anunciante grande que nao tem provider proprio
 * e candidato a novo adapter (ou so anuncia por portal, e ja esta coberto pelos portais).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SECTIONS: Array<[slug: string, pages: number]> = [['imoveis-a-venda', 60], ['imoveis-para-alugar', 25]];
const CONCURRENCY = 6;

const advertisersOf = (html: string): string[] => {
  const $ = cheerio.load(html);
  const names: string[] = [];
  $('script[type="application/ld+json"]').each((_i, script) => {
    try {
      const json = JSON.parse($(script).contents().text());
      if (json['@type'] === 'RealEstateListing') {
        (json.offers?.itemListElement ?? []).forEach((offer: { offeredBy?: { name?: string } }) => {
          if (offer.offeredBy?.name) names.push(offer.offeredBy.name);
        });
      }
    } catch {
      // bloco JSON-LD de terceiros que nao e JSON valido
    }
  });
  return names;
};

(async () => {
  const counts = new Map<string, number>();
  for (const [slug, pages] of SECTIONS) {
    const urls = Array.from({ length: pages }, (_v, i) => `https://www.chavesnamao.com.br/${slug}/sp-franca/${i ? `?pg=${i + 1}` : ''}`);
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = await Promise.all(urls.slice(i, i + CONCURRENCY).map(url =>
        axios.get<string>(url, { headers: { 'User-Agent': UA }, timeout: 30000 }).then(r => advertisersOf(r.data)).catch(() => [] as string[])));
      batch.flat().forEach(name => counts.set(name, (counts.get(name) ?? 0) + 1));
    }
  }
  [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([name, count]) => console.log(`${count}\t${name}`));
})();
