export const getFixValue = (rawArea = '0') => {
  let areaStr = (rawArea || '').trim();

  // Se tiver ponto, diferenciar mil de centavo
  if (areaStr.indexOf('.') >= 1) {
    const l = areaStr.split('.')[1].length;
    if (l > 2) {
      areaStr = areaStr.replace(/\./g, '').trim();
    }
    else {
      areaStr = areaStr.replace('.', ',').trim();
    }
  }

  // Convert comma to dot for parsing
  const standardized = areaStr.replace(',', '.').trim();

  // Now check if it's a number
  if (isNaN(Number(standardized))) {
    return 0;
  }

  const parsedArea = parseFloat(standardized || '0');
  return parsedArea;
}

export function normalizeNeighborhoodName(name: string = ''): string {
  // Função para remover acentos
  const removeAccents = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Remover acentos
  let normalized = removeAccents(name);

  // Trocar "PQ" por "Parque"
  normalized = normalized.replace(/\bPQ\b/gi, "Parque");

  // Remover pontos
  normalized = normalized.replace(/\./g, "");

  // Remover espaços extras e trimar o resultado
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized.toUpperCase();
}

export function cleanTitle(title: string = ''): string {
   return title.replace(/\s+/g, ' ').trim();
}

export function normalizeText(text: string = ''): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// A ordem importa: o primeiro padrao que casa vence ("chacara com casa" e rural, nao casa).
const TIPOS_IMOVEL: Array<[string, RegExp]> = [
  ['rural', /\b(chacara|sitio|fazenda|rancho|haras)\b/],
  ['apartamento', /\b(apartamento|apto|flat|kitnet|kitinete|studio|cobertura)\b/],
  ['casa', /\b(casa|sobrado|residencia|edicula)\b/],
  ['terreno', /\b(terreno|lote|loteamento|area)\b/],
  ['comercial', /\b(sala|salao|comercial|loja|galpao|barracao|predio|ponto)\b/],
];

/** Classifica o anuncio por palavras do titulo; vazio quando nao reconhece. */
export function inferTipoImovel(text: string = ''): string {
  const normalized = normalizeText(text);
  const match = TIPOS_IMOVEL.find(([, pattern]) => pattern.test(normalized));
  return match ? match[0] : '';
}

export function safeUrl(href: string, base: string): URL | null {
  try {
    return new URL(href, base);
  } catch {
    return null;
  }
}
