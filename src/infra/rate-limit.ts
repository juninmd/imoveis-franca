export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Janela fixa em memoria. Suficiente para uma instancia unica: o objetivo e impedir que um
 * unico cliente enfileire scrapings completos (cada miss de cache custa dezenas de segundos
 * e um Chromium), nao contabilidade distribuida exata.
 */
export class FixedWindowRateLimit {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 10_000,
  ) { }

  public check(key: string): RateLimitDecision {
    const now = this.now();
    this.evictExpired(now);

    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      // Limite de chaves: um atacante variando o IP de origem (ou X-Forwarded-For) nao pode
      // fazer a tabela crescer sem fim.
      if (this.hits.size >= this.maxKeys) {
        this.hits.clear();
      }
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }

    entry.count += 1;
    const allowed = entry.count <= this.limit;
    return {
      allowed,
      remaining: Math.max(0, this.limit - entry.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  private evictExpired(now: number): void {
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) {
        this.hits.delete(key);
      }
    }
  }
}
