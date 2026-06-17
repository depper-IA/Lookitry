/* eslint-disable @typescript-eslint/no-var-requires */
import jwt from 'jsonwebtoken';

/**
 * C-4: access tokens y refresh tokens deben ser distinguibles por un claim `type`,
 * de modo que un refresh token nunca pueda usarse donde se espera un access token,
 * independientemente de la configuración de secrets.
 *
 * jwt.ts lee process.env.* al cargarse, por eso se setean las env vars y se hace
 * require() (no import hoisted) dentro de beforeAll.
 */
describe('jwt type claims (C-4)', () => {
  const ACCESS_SECRET = 'test-access-secret';
  const REFRESH_SECRET = 'test-refresh-secret';
  let jwtUtil: typeof import('../jwt');

  beforeAll(() => {
    process.env.JWT_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
    jwtUtil = require('../jwt');
  });

  const payload = { brandId: 'brand-1', email: 'a@b.com' };

  it('generateAccessToken stamps type=access', () => {
    const decoded = jwt.verify(jwtUtil.generateAccessToken(payload), ACCESS_SECRET) as any;
    expect(decoded.type).toBe('access');
  });

  it('generateRefreshToken stamps type=refresh', () => {
    const decoded = jwt.verify(jwtUtil.generateRefreshToken(payload), REFRESH_SECRET) as any;
    expect(decoded.type).toBe('refresh');
  });

  it('generateToken (legacy) stamps type=access', () => {
    const decoded = jwt.verify(jwtUtil.generateToken(payload), ACCESS_SECRET) as any;
    expect(decoded.type).toBe('access');
  });

  it('verifyToken rejects a refresh-typed token', () => {
    // Token con type=refresh pero firmado con el ACCESS secret: la firma es válida,
    // solo el claim type debe causar el rechazo.
    const refreshTyped = jwt.sign({ ...payload, type: 'refresh' }, ACCESS_SECRET);
    expect(() => jwtUtil.verifyToken(refreshTyped)).toThrow();
  });

  it('verifyAccessToken rejects a refresh-typed token', () => {
    const refreshTyped = jwt.sign({ ...payload, type: 'refresh' }, ACCESS_SECRET);
    expect(() => jwtUtil.verifyAccessToken(refreshTyped)).toThrow();
  });

  it('verifyRefreshToken rejects an access-typed token', () => {
    const accessTyped = jwt.sign({ ...payload, type: 'access' }, REFRESH_SECRET);
    expect(() => jwtUtil.verifyRefreshToken(accessTyped)).toThrow();
  });

  it('accepts a real access token via verifyToken', () => {
    const decoded = jwtUtil.verifyToken(jwtUtil.generateAccessToken(payload));
    expect(decoded.brandId).toBe('brand-1');
  });

  it('accepts a real refresh token via verifyRefreshToken', () => {
    const decoded = jwtUtil.verifyRefreshToken(jwtUtil.generateRefreshToken(payload));
    expect(decoded.brandId).toBe('brand-1');
  });

  it('backward compat: a legacy token WITHOUT type claim is still accepted by verifyToken', () => {
    const legacyNoType = jwt.sign({ ...payload }, ACCESS_SECRET);
    expect(() => jwtUtil.verifyToken(legacyNoType)).not.toThrow();
  });

  it('generateAdminToken stamps type=access and has 7d expiration', () => {
    const token = jwtUtil.generateAdminToken(payload);
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    expect(decoded.type).toBe('access');
    
    const expirationSeconds = decoded.exp - decoded.iat;
    expect(expirationSeconds).toBeCloseTo(7 * 24 * 60 * 60, -1);
  });
});
