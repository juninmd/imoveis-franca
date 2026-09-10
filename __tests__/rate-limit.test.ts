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

  it('não deixa a tabela crescer sem limite com chaves novas', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000, clock, 3);
    for (let i = 0; i < 10; i++) {
      expect(limiter.check(`ip-${i}`).allowed).toBe(true);
    }
    // A chave recente segue contabilizada...
    expect(limiter.check('ip-9').allowed).toBe(false);
    // ...e as antigas foram descartadas: memória limitada, precisão aproximada.
    expect(limiter.check('ip-0').allowed).toBe(true);
  });

  it('usa Date.now por padrão', () => {
    const limiter = new FixedWindowRateLimit(1, 60_000);
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
  });
});
