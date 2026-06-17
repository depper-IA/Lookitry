/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * C-5: cuando Redis no está disponible, el comportamiento de isTokenBlacklisted
 * debe ser configurable:
 *  - default (fail-open): no se puede verificar → token NO bloqueado (disponibilidad)
 *  - JWT_BLACKLIST_STRICT=true (fail-closed): no se puede verificar → token bloqueado (seguridad)
 */
describe('isTokenBlacklisted fail mode (C-5)', () => {
  let redisModule: typeof import('../redis');

  beforeAll(() => {
    redisModule = require('../redis');
  });

  afterEach(() => {
    delete process.env.JWT_BLACKLIST_STRICT;
    jest.restoreAllMocks();
  });

  it('fail-open por defecto: Redis caído → token NO bloqueado', async () => {
    jest.spyOn(redisModule.RedisService, 'isAlive').mockReturnValue(false);
    expect(await redisModule.isTokenBlacklisted('some-token')).toBe(false);
  });

  it('fail-closed con JWT_BLACKLIST_STRICT=true: Redis caído → token bloqueado', async () => {
    process.env.JWT_BLACKLIST_STRICT = 'true';
    jest.spyOn(redisModule.RedisService, 'isAlive').mockReturnValue(false);
    expect(await redisModule.isTokenBlacklisted('some-token')).toBe(true);
  });
});
