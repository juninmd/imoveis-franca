import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const HOST = 'https://www.ferreiraferreiraimob.com.br';
const SITE_NAME = 'ferreiraferreiraimob.com.br';
const CATALOG_URL = `${HOST}/llms.txt`;

// O site publica o catalogo inteiro (precos, areas, descricao e todas as fotos) em /llms.txt,
// um markdown estavel feito para ser lido por maquinas; as paginas HTML redirecionam e mudam.
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

const field = (block: string, label: string): string =>
  (block.match(new RegExp(`^\\s*-\\s*${label}:\\s*(.+)$`, 'mi')) || [])[1]?.trim() || '';

const count = (block: string, label: string): number => parseInt(field(block, label), 10) || 0;

const squareMeters = (block: string, label: RegExp): number => {
  // So linhas estruturadas ("  - Área ..."): a descricao em texto livre tambem cita metragens.
  const line = block.split('\n').find(l => /^\s*-\s*Área/.test(l) && label.test(l)) || '';
  const match = line.match(/:\s*([\d.,]+)\s*m/);
  return match ? getFixValue(match[1]) : 0;
};

export async function adapter(text: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  // Cada anuncio e um bloco "### Tipo - Referencia"; o que vem antes e o cabecalho da imobiliaria.
  const blocks = text.split(/^### /m).slice(1);

  for (const block of blocks) {
    const link = (block.match(/\[Ver imóvel completo\]\(([^)]+)\)/) || [])[1];
    const valor = getFixValue((field(block, 'Valor').match(/R\$\s*([\d.]+(?:,\d+)?)/) || [])[1]);
    if (!link || valor <= 0) continue;

    const finalidade = field(block, 'Finalidade').toLowerCase();
    const tipoTexto = field(block, 'Tipo');
    const bairro = field(block, 'Bairro');
    const area = squareMeters(block, /Área (constru|útil|privativa|total constru)/i);
    const areaTotal = squareMeters(block, /Área do terreno|Área total/i) || area;
    const imagens = [...block.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]);
    const area0 = area || areaTotal;

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto}${bairro ? ` - ${bairro}` : ''}`),
      descricao: cleanTitle(field(block, 'Descrição')),
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: area0,
      areaTotal,
      quartos: count(block, 'Dormitórios'),
      banheiros: count(block, 'Banheiros'),
      vagas: count(block, 'Vagas de garagem'),
      link: link.replace(/^http:/, 'https:'),
      precoPorMetro: area0 > 0 ? valor / area0 : 0,
      site: SITE_NAME,
      entrada: valor * 0.20,
      tipo: finalidade.startsWith('loca') ? 'aluguel' : finalidade === 'venda' ? 'venda' : undefined,
      codigo: field(block, 'Referência') || undefined,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: imoveis.length, html: text };
}
