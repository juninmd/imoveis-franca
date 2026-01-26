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
