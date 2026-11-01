import { FixedWindowRateLimit } from '../src/infra/rate-limit';

describe('FixedWindowRateLimit', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => { now = 1_000_000; });

  it('libera até o limite e bloqueia o excedente', () => {
    const limiter = new FixedWindowRateLimit(2, 60_000, clock);

    expect(limiter.check('ip')).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check('ip')).toMatchObject({ allowed: true, remaining: 0 });

    const blocked = limiter.check('ip');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('conta cada cliente separadamente', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000, clock);
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('reabre a janela depois que ela expira', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000, clock);
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);

    now += 60_001;
    expect(limiter.check('ip').allowed).toBe(true);
  });

  it('no teto de chaves recusa as novas em vez de zerar os contadores existentes', () => {
    // Antes isso era um `clear()`: um atacante gerando chaves novas resetava o contador de
    // todo cliente honesto — a tabela do limitador virava recurso compartilhado alcançável.
    const limiter = new FixedWindowRateLimit(2, 60_000, clock, 3);

    expect(limiter.check('honesto').allowed).toBe(true); // conta 1

    for (let i = 0; i < 10; i++) {
      limiter.check(`atacante-${i}`);
    }

    // O contador do cliente honesto sobreviveu: segunda chamada passa, terceira não.
    expect(limiter.check('honesto').allowed).toBe(true);
    expect(limiter.check('honesto').allowed).toBe(false);
  });

  it('libera as chaves novas de volta quando a janela expira', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000, clock, 2);
    limiter.check('a');
    limiter.check('b');
    expect(limiter.check('c').allowed).toBe(false);

    now += 60_001;
    expect(limiter.check('c').allowed).toBe(true);
  });

  it('usa Date.now por padrão', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000);
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
  });
});
