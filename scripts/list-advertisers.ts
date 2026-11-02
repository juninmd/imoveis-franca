/**
 * Enumera os anunciantes de Franca no Chaves na Mao (JSON-LD `offeredBy`) e ordena por volume.
 *
 * Uso: npx tsx scripts/list-advertisers.ts
 *
 * Le TODAS as paginas (o total vem do proprio JSON-LD), porque os anunciantes menores so
 * aparecem no fim da listagem. Serve para achar lacunas de cobertura: um anunciante com volume
 * e sem provider proprio e candidato a novo adapter (ou so anuncia por portal).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SECTIONS = ['imoveis-a-venda', 'imoveis-para-alugar'];
const PAGE_SIZE = 15;
const CONCURRENCY = 6;

interface Page { advertisers: string[]; total: number }

const readPage = (html: string): Page => {
  const $ = cheerio.load(html);
  const page: Page = { advertisers: [], total: 0 };
  $('script[type="application/ld+json"]').each((_i, script) => {
    try {
      const json = JSON.parse($(script).contents().text());
      if (json['@type'] !== 'RealEstateListing') return;
      page.total = Number(json.offers?.numberOfItems) || 0;
      (json.offers?.itemListElement ?? []).forEach((offer: { offeredBy?: { name?: string } }) => {
        if (offer.offeredBy?.name) page.advertisers.push(offer.offeredBy.name);
      });
    } catch {
      // bloco JSON-LD de terceiros que nao e JSON valido
    }
  });
  return page;
};

const fetchPage = async (slug: string, n: number): Promise<Page> => {
  try {
    const { data } = await axios.get<string>(`https://www.chavesnamao.com.br/${slug}/sp-franca/${n > 1 ? `?pg=${n}` : ''}`, { headers: { 'User-Agent': UA }, timeout: 30000 });
    return readPage(data);
  } catch {
    return { advertisers: [], total: 0 };
  }
};

(async () => {
  const counts = new Map<string, number>();
  for (const slug of SECTIONS) {
    const first = await fetchPage(slug, 1);
    const pages = Math.ceil(first.total / PAGE_SIZE);
    const batches: Page[] = [first];
    for (let n = 2; n <= pages; n += CONCURRENCY) {
      batches.push(...await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pages - n + 1) }, (_v, i) => fetchPage(slug, n + i))));
    }
    batches.flatMap(b => b.advertisers).forEach(name => counts.set(name, (counts.get(name) ?? 0) + 1));
  }
  [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([name, count]) => console.log(`${count}\t${name}`));
})();
