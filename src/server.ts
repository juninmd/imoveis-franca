import path from 'path';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { generateList } from './imoveis';
import browser from './infra/browser';
import { FixedWindowRateLimit } from './infra/rate-limit';

const app = express();
const port = Number(process.env.PORT) || 3000;
const clientDir = path.join(__dirname, '..', '..', 'client', 'dist');
const indexHtml = path.join(clientDir, 'index.html');

// Security and Performance Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simplicity with external images/scripts
}));

// Compression with optimized settings
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      // don't compress responses with this request header
      return false
    }
    // fallback to standard filter function
    return compression.filter(req, res)
  }
}));

app.use(cors());

// Rota para o frontend. `index: false` é essencial: o index.html referencia bundles com hash
// no nome, então servi-lo com `max-age=1y` congelava a versão do app no navegador do usuário
// (e, depois de um deploy, apontava para chunks que já não existem -> tela branca).
app.use(express.static(clientDir, {
  maxAge: '1y',
  etag: false,
  index: false,
}));

const sendIndex = (_req: Request, res: Response) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(indexHtml);
};

app.get('/', sendIndex);

// Health check para orquestradores (Docker, k8s) — não depende de Redis/scraping.
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Um miss de cache custa dezenas de segundos e um Chromium; sem limite, um único cliente
// enfileira scrapings completos à vontade.
const apiLimiter = new FixedWindowRateLimit(60, 60_000);

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const decision = apiLimiter.check(req.ip || 'unknown');
  if (!decision.allowed) {
    res.set('Retry-After', String(decision.retryAfterSeconds));
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
  }
  res.set('X-RateLimit-Remaining', String(decision.remaining));
  return next();
});

// Rota para a API que gera a lista de imóveis
app.get('/api/imoveis', async (req: Request, res: Response) => {
  try {
    const lista = await generateList(req.query);
    // Cache control for API response - short duration as data might change
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    return res.json({ data: lista, total: lista.length });
  } catch (error) {
    // A mensagem crua pode carregar URL interna, host de Redis ou trecho de stack: registra
    // no servidor, devolve genérico ao cliente.
    console.error('Falha em /api/imoveis', error);
    return res.status(500).json({ error: 'Não foi possível carregar os imóveis.' });
  }
});

// SPA: qualquer rota não-API cai no index.html (deep link, refresh em /favoritos, etc).
app.get(/^(?!\/api\/).*/, sendIndex);

// Iniciar o servidor
const server = app.listen(port, () => {
  console.log(`Servidor rodando http://localhost:${port}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} recebido, encerrando...`);
  server.close();
  await browser.close().catch(() => undefined);
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export default app;
