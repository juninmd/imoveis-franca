import Redis from 'ioredis';

export class RedisConnection {
  private static instance: Redis;

  private constructor() { }

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new Redis({
        port: Number(process.env.REDIS_PORT) || 6379,
        host: process.env.REDIS_HOST || 'redis.databases.svc.cluster.local',
        password: process.env.REDIS_PASSWORD,
        // Sem limite de tentativas, comandos emitidos com o Redis fora do ar ficavam
        // pendurados até o timeout do cliente HTTP em vez de falharem rápido.
        maxRetriesPerRequest: 2,
      });

      // ioredis emite 'error' no reconnect; um EventEmitter sem listener de 'error' derruba
      // o processo inteiro. O cache é opcional — a API precisa sobreviver ao Redis cair.
      RedisConnection.instance.on('error', (error) => {
        console.error(`Redis indisponível: ${error.message}`);
      });
    }
    return RedisConnection.instance;
  }

  public static async setKey(key: string, value, ttl?: number): Promise<void> {
    try {
      const client = RedisConnection.getInstance();
      if (ttl) {
        await client.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        await client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      // Degrada para "sem cache": perder a gravação é aceitável, derrubar a resposta não.
      console.error(`Falha ao gravar cache ${key}: ${error.message}`);
    }
  }

  public static async getKey<T>(key: string): Promise<T | null> {
    try {
      const client = RedisConnection.getInstance();
      const value = await client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch (error) {
      console.error(`Falha ao ler cache ${key}: ${error.message}`);
    }
    return null;
  }
}

export default RedisConnection;
