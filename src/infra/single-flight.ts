/**
 * Coalesce chamadas concorrentes com a mesma chave numa unica execucao.
 *
 * Sem isso, N usuarios batendo em /api/imoveis com o cache frio disparam N scrapings
 * completos dos ~47 sites em paralelo (cada um com Chromium + dezenas de paginas), e o
 * primeiro a terminar so entao popula o Redis.
 */
export class SingleFlight {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  public run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => fn())().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  public get size(): number {
    return this.inFlight.size;
  }
}

export default new SingleFlight();
