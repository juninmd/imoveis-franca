import express, { Request, Response } from 'express';
import { generateList } from './imoveis';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const port = 3000;

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

// Rota para o frontend
app.use(express.static(__dirname + '/../../client/dist', {
  maxAge: '1y', // Cache static assets for 1 year
  etag: false
}));

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(__dirname + '/../../client/dist/index.html');
});

// Rota para a API que gera a lista de imóveis
app.get('/api/imoveis', async (req: Request, res: Response) => {
  try {
    const lista = await generateList(req.query);
    // Cache control for API response - short duration as data might change
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    return res.json({ data: lista });
  } catch (error) {
    return res.json({ error: error }).status(500);
  }

});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando http://localhost:${port}`);
});
