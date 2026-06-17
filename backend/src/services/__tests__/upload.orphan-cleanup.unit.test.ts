import { selectExpiredTempPaths } from '../../utils/temp-cleanup';

/**
 * C-3: el cleanup programado de selfies huérfanas debe seleccionar SOLO archivos
 * temporales más viejos que el umbral, parseando el timestamp del nombre
 * (`temp/{Date.now()}-{hex}.ext`). La lógica de selección es la parte peligrosa
 * (un error borra uploads recientes), por eso se aísla en un módulo puro y se testea.
 */
describe('selectExpiredTempPaths (C-3)', () => {
  const HOUR = 60 * 60 * 1000;
  const now = 1_700_000_000_000;

  it('selecciona archivos temp más viejos que el umbral', () => {
    const old = `temp/${now - 25 * HOUR}-abc123.webp`;
    expect(selectExpiredTempPaths([old], 24, now)).toEqual([old]);
  });

  it('NO selecciona archivos temp recientes', () => {
    const recent = `temp/${now - 1 * HOUR}-abc123.webp`;
    expect(selectExpiredTempPaths([recent], 24, now)).toEqual([]);
  });

  it('NUNCA selecciona archivos fuera del prefijo temp/ (seguridad)', () => {
    const product = `products/${now - 100 * HOUR}-abc123.webp`;
    expect(selectExpiredTempPaths([product], 24, now)).toEqual([]);
  });

  it('NO selecciona nombres sin timestamp parseable (seguridad)', () => {
    const malformed = 'temp/no-timestamp-here.webp';
    expect(selectExpiredTempPaths([malformed], 24, now)).toEqual([]);
  });

  it('respeta el umbral exacto: justo en el límite no se borra', () => {
    const exactly = `temp/${now - 24 * HOUR}-abc123.webp`;
    expect(selectExpiredTempPaths([exactly], 24, now)).toEqual([]);
  });

  it('filtra una mezcla correctamente', () => {
    const old1 = `temp/${now - 48 * HOUR}-a.webp`;
    const old2 = `temp/${now - 25 * HOUR}-b.webp`;
    const recent = `temp/${now - 2 * HOUR}-c.webp`;
    const product = `products/${now - 99 * HOUR}-d.webp`;
    expect(selectExpiredTempPaths([old1, old2, recent, product], 24, now)).toEqual([old1, old2]);
  });
});
