import { describe, it, expect } from '@jest/globals';
import { isSecureConnection } from '../src/lib/auth.js';

describe('auth utilities', () => {
  describe('isSecureConnection', () => {
    it('returns true when x-forwarded-proto is https', () => {
      const request = {
        headers: {
          get: (key) => key === 'x-forwarded-proto' ? 'https' : null
        },
        url: 'http://localhost:3000/api/login'
      };
      
      expect(isSecureConnection(request)).toBe(true);
    });

    it('returns false when x-forwarded-proto is http', () => {
      const request = {
        headers: {
          get: (key) => key === 'x-forwarded-proto' ? 'http' : null
        },
        url: 'http://localhost:3000/api/login'
      };
      
      expect(isSecureConnection(request)).toBe(false);
    });

    it('returns true when URL starts with https:// and no x-forwarded-proto header', () => {
      const request = {
        headers: {
          get: () => null
        },
        url: 'https://example.com/api/login'
      };
      
      expect(isSecureConnection(request)).toBe(true);
    });

    it('returns false when URL starts with http:// and no x-forwarded-proto header', () => {
      const request = {
        headers: {
          get: () => null
        },
        url: 'http://localhost:3000/api/login'
      };
      
      expect(isSecureConnection(request)).toBe(false);
    });

    it('prioritizes x-forwarded-proto over URL protocol', () => {
      // Simulates a reverse proxy scenario where the proxy terminates HTTPS
      // but forwards to the app over HTTP
      const request = {
        headers: {
          get: (key) => key === 'x-forwarded-proto' ? 'https' : null
        },
        url: 'http://localhost:3000/api/login'
      };
      
      expect(isSecureConnection(request)).toBe(true);
    });

    it('handles case where x-forwarded-proto exists but is not https', () => {
      const request = {
        headers: {
          get: (key) => key === 'x-forwarded-proto' ? 'ws' : null
        },
        url: 'https://example.com/api/login'
      };
      
      // x-forwarded-proto takes priority, so even though URL is https,
      // the result should be false because x-forwarded-proto is not 'https'
      expect(isSecureConnection(request)).toBe(false);
    });
  });
});
