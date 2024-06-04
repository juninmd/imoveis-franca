export const getFixValue = (rawArea = '0') => {
  // Se tiver ponto, diferenciar mil de centavo
  if (rawArea.indexOf('.') >= 1) {
    const l = rawArea.split('.')[1].length;
    if (l > 2) {
      rawArea = rawArea.replace(/\./g, '').trim();
    }
    else {
      rawArea = rawArea.replace('.', ',').trim();
    }
  } else if (rawArea.indexOf(',') >= 1) {

  }
  else if (isNaN(Number(rawArea))) {
    rawArea = '0';
  }
  const parsedArea = parseFloat(rawArea.replace(',', '.').trim() || '0');
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