import { Imoveis } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';

// Sites ImobiBrasil publicam o catalogo inteiro (precos, areas, descricao e todas as fotos) em
// /llms.txt, um markdown estavel feito para ser lido por maquinas; as paginas HTML mudam e redirecionam.

const field = (block: string, label: string): string =>
  (block.match(new RegExp(`^\\s*-\\s*${label}:\\s*(.+)$`, 'mi')) || [])[1]?.trim() || '';

const count = (block: string, label: string): number => parseInt(field(block, label), 10) || 0;

// So linhas estruturadas ("  - Área ..."): a descricao em texto livre tambem cita metragens.
const squareMeters = (block: string, label: RegExp): number => {
  const line = block.split('\n').find(l => /^\s*-\s*Área/.test(l) && label.test(l)) || '';
  const match = line.match(/:\s*([\d.,]+)\s*m/);
  return match ? getFixValue(match[1]) : 0;
};

export function parseLlmsCatalog(text: string, siteName: string): { imoveis: Imoveis[], qtd: number, html: string } {
  const imoveis: Imoveis[] = [];
  // Cada anuncio e um bloco "### Tipo - Referencia"; o que vem antes e o cabecalho da imobiliaria.
  const blocks = text.split(/^### /m).slice(1);

  for (const block of blocks) {
    const link = (block.match(/\[Ver imóvel completo\]\(([^)]+)\)/) || [])[1];
    const valor = getFixValue((field(block, 'Valor').match(/R\$\s*([\d.]+(?:,\d+)?)/) || [])[1]);
    // Imobiliarias de varias cidades (ex.: Ribeirao Preto + Franca) informam a cidade por anuncio.
    const cidade = field(block, 'Cidade');
    if (!link || valor <= 0 || (cidade && normalizeText(cidade) !== 'franca')) continue;

    const finalidade = field(block, 'Finalidade').toLowerCase();
    const tipoTexto = field(block, 'Tipo');
    const bairro = field(block, 'Bairro');
    const area = squareMeters(block, /Área (constru|útil|privativa|total constru)/i);
    const areaTotal = squareMeters(block, /Área do terreno|Área total/i) || area;
    const imagens = [...block.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]);
    const areaPreco = area || areaTotal;

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto}${bairro ? ` - ${bairro}` : ''}`),
      descricao: cleanTitle(field(block, 'Descrição')),
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: count(block, 'Dormitórios'),
      banheiros: count(block, 'Banheiros'),
      vagas: count(block, 'Vagas de garagem'),
      link: link.replace(/^http:/, 'https:'),
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: siteName,
      entrada: valor * 0.20,
      tipo: finalidade.startsWith('loca') ? 'aluguel' : finalidade === 'venda' ? 'venda' : undefined,
      codigo: field(block, 'Referência') || undefined,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: imoveis.length, html: text };
}
