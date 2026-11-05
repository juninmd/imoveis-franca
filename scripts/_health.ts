import { sites } from '../src/sites';
import { retrieImoveisSite } from '../src/imoveis';
import * as fs from 'fs';

const out = process.argv[2];
(async () => {
  const enabled = sites.filter(s => s.enabled && s.driver !== 'puppet');
  const res: any[] = [];
  let i = 0;
  const worker = async () => {
    while (i < enabled.length) {
      const s = enabled[i++];
      const t = Date.now();
      try {
        const r: any = await Promise.race([retrieImoveisSite(s, { finalidade: 'todos' } as any), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 90000))]);
        res.push({ name: s.name, n: r.length, u: new Set(r.map((x: any) => x.link)).size, ms: Date.now() - t });
      } catch (e: any) { res.push({ name: s.name, n: 0, u: 0, err: String(e.message).slice(0, 80) }); }
    }
  };
  await Promise.all(Array.from({ length: 2 }, worker));
  fs.writeFileSync(out, JSON.stringify(res));
  process.exit(0);
})();
