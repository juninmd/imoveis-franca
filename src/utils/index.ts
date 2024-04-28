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