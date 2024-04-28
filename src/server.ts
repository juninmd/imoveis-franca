import express, { Request, Response } from 'express';
import { filterImoveis, generateList } from './imoveis';

const app = express();
const port = 3000;

// Rota para o frontend
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(__dirname + '/index.html');
});

// Rota para a API que gera a lista de imóveis
app.get('/api/imoveis', async (req: Request, res: Response) => {
  try {
    let lista = await generateList();
    lista = filterImoveis(lista, req.query);
    return res.json({ data: lista });
  } catch (error) {
    return res.json({ error: error }).status(500);
  }

});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando http://localhost:${port}`);
});
