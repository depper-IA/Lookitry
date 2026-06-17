/**
 * A-3: determina si hay consentimiento biométrico explícito (Ley 1581, Art. 10-C).
 *
 * Acepta el booleano `true` y el string `'true'` — el frontend envía el flag por
 * multipart formData con `String(value)`, así que el backend lo recibe como string.
 * Cualquier otro valor (false, 'false', undefined, null, '', truthy genéricos) se
 * considera SIN consentimiento.
 */
export function isBiometricConsentGiven(value: unknown): boolean {
  return value === true || value === 'true';
}
