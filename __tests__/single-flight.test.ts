import { SingleFlight } from '../src/infra/single-flight';

const deferred = <T>() => {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve: resolve!, reject: reject! };
};

describe('SingleFlight', () => {
  it('executa a função uma única vez para chamadas concorrentes com a mesma chave', async () => {
    const sf = new SingleFlight();
    const gate = deferred<string>();
    const fn = jest.fn(() => gate.promise);

    const a = sf.run('k', fn);
    const b = sf.run('k', fn);
    expect(sf.size).toBe(1);

    gate.resolve('ok');
    expect(await a).toBe('ok');
    expect(await b).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('não compartilha execução entre chaves diferentes', async () => {
    const sf = new SingleFlight();
    const fn = jest.fn(async (v: string) => v);

    const [a, b] = await Promise.all([sf.run('a', () => fn('a')), sf.run('b', () => fn('b'))]);
    expect([a, b]).toEqual(['a', 'b']);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('libera a chave depois de concluir, permitindo nova execução', async () => {
    const sf = new SingleFlight();
    const fn = jest.fn(async () => 1);

    await sf.run('k', fn);
    expect(sf.size).toBe(0);
    await sf.run('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('propaga a rejeição para todos os interessados e libera a chave', async () => {
    const sf = new SingleFlight();
    const gate = deferred<never>();

    const a = sf.run('k', () => gate.promise);
    const b = sf.run('k', () => gate.promise);
    gate.reject(new Error('boom'));

    await expect(a).rejects.toThrow('boom');
    await expect(b).rejects.toThrow('boom');
    expect(sf.size).toBe(0);
  });

  it('converte lançamento síncrono em rejeição sem travar a chave', async () => {
    const sf = new SingleFlight();
    await expect(sf.run('k', () => { throw new Error('sync'); })).rejects.toThrow('sync');
    expect(sf.size).toBe(0);
  });
});
