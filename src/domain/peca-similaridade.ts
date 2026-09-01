export function normalizarTextoPeca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function nomesParecidos(a: string, b: string): boolean {
  const esquerda = normalizarTextoPeca(a);
  const direita = normalizarTextoPeca(b);
  if (!esquerda || !direita) return false;
  if (esquerda === direita) return true;
  if (esquerda.includes(direita) || direita.includes(esquerda)) return true;

  const distancia = levenshtein(esquerda, direita);
  const maior = Math.max(esquerda.length, direita.length);
  if (maior <= 24) return distancia <= 3;
  return distancia / maior <= 0.15;
}

function levenshtein(a: string, b: string): number {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const matriz: number[][] = Array.from({ length: linhas }, (_, i) => {
    const linha = new Array<number>(colunas);
    linha[0] = i;
    return linha;
  });
  for (let j = 0; j < colunas; j += 1) {
    matriz[0][j] = j;
  }
  for (let i = 1; i < linhas; i += 1) {
    for (let j = 1; j < colunas; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo,
      );
    }
  }
  return matriz[a.length][b.length];
}
