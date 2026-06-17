import { sanitizeHeaders, sanitizeObject, sanitizeUrl } from '../logSanitizer';

describe('Log Sanitizer (VULN-004)', () => {
  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers case-insensitively', () => {
      const headers = {
        Host: 'api.lookitry.com',
        Authorization: 'Bearer secret_token_123',
        'X-Api-Key': '***REMOVED-SECRET***',
        Cookie: 'session=abc; other=def',
        'Set-Cookie': 'session=abc',
        'Content-Type': 'application/json'
      };

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized.Host).toBe('api.lookitry.com');
      expect(sanitized['Content-Type']).toBe('application/json');
      expect(sanitized.Authorization).toBe('[REDACTED]');
      expect(sanitized['X-Api-Key']).toBe('[REDACTED]');
      expect(sanitized.Cookie).toBe('[REDACTED]');
      expect(sanitized['Set-Cookie']).toBe('[REDACTED]');
    });

    it('should return empty object if headers is undefined', () => {
      expect(sanitizeHeaders(undefined)).toEqual({});
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively redact sensitive fields in query, body, or params', () => {
      const body = {
        name: 'John Doe',
        password: 'super_secret_password_123',
        apiKey: 'sk_test_key',
        nested: {
          token: 'nested_token_value',
          other: 'safe_value'
        },
        array: [
          { secret: 'secret_1' },
          { safe: 'safe_1' }
        ]
      };

      const sanitized = sanitizeObject(body);

      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.nested.token).toBe('[REDACTED]');
      expect(sanitized.nested.other).toBe('safe_value');
      expect(sanitized.array[0].secret).toBe('[REDACTED]');
      expect(sanitized.array[1].safe).toBe('safe_1');
    });

    it('should handle null, undefined, and non-object inputs', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
      expect(sanitizeObject('string')).toBe('string');
    });
  });

  describe('sanitizeUrl', () => {
    it('should redact sensitive query parameters in relative URLs', () => {
      const url = '/api/pruebalo/validate-api-key?key=sk_live_abc123&domain=example.com';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('/api/pruebalo/validate-api-key?key=%5BREDACTED%5D&domain=example.com');
    });

    it('should redact sensitive query parameters in absolute URLs', () => {
      const url = 'https://api.lookitry.com/api/pruebalo/synced-products?key=sk_live_abc123&other=value';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('https://api.lookitry.com/api/pruebalo/synced-products?key=%5BREDACTED%5D&other=value');
    });

    it('should fallback to regex if URL parsing fails', () => {
      const url = '://invalid-path?key=sk_live_123';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('://invalid-path?key=[REDACTED]');
    });
  });
});
