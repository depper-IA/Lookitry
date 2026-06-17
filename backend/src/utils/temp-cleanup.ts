/**
 * C-3: selecciona los paths del prefijo `temp/` cuyo timestamp embebido
 * (`temp/{Date.now()}-{hex}.ext`) es más viejo que `maxAgeHours`.
 *
 * Función pura y sin dependencias (no importa el SDK de GCS) para poder testear la
 * lógica de selección de forma aislada — es la parte peligrosa del cleanup (un error
 * borra uploads recientes). Por seguridad: solo el prefijo `temp/` y solo nombres
 * con timestamp parseable.
 */
export function selectExpiredTempPaths(names: string[], maxAgeHours: number, now: number): string[] {
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return names.filter((name) => {
    if (!name.startsWith('temp/')) return false;
    const match = name.slice('temp/'.length).match(/^(\d+)-/);
    if (!match) return false;
    const ts = Number(match[1]);
    if (!Number.isFinite(ts) || ts <= 0) return false;
    return now - ts > maxAgeMs;
  });
}
