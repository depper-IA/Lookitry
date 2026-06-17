import { isBiometricConsentGiven } from '../consent';

/**
 * A-3: el gate de consentimiento biométrico debe ser estricto pero tolerar la
 * forma en que el dato llega. El frontend envía `termsAccepted` por multipart
 * formData con `String(value)`, por lo que el backend lo recibe como el string
 * 'true' (no el booleano true). El gate debe aceptar AMBOS y rechazar todo lo demás.
 */
describe('isBiometricConsentGiven (A-3)', () => {
  it('acepta el booleano true', () => {
    expect(isBiometricConsentGiven(true)).toBe(true);
  });

  it("acepta el string 'true' (multipart formData)", () => {
    expect(isBiometricConsentGiven('true')).toBe(true);
  });

  it('rechaza el booleano false', () => {
    expect(isBiometricConsentGiven(false)).toBe(false);
  });

  it("rechaza el string 'false'", () => {
    expect(isBiometricConsentGiven('false')).toBe(false);
  });

  it('rechaza undefined', () => {
    expect(isBiometricConsentGiven(undefined)).toBe(false);
  });

  it('rechaza null', () => {
    expect(isBiometricConsentGiven(null)).toBe(false);
  });

  it('rechaza string vacío', () => {
    expect(isBiometricConsentGiven('')).toBe(false);
  });

  it('rechaza otros valores truthy que no sean consentimiento explícito', () => {
    expect(isBiometricConsentGiven(1)).toBe(false);
    expect(isBiometricConsentGiven('1')).toBe(false);
    expect(isBiometricConsentGiven('yes')).toBe(false);
  });
});
