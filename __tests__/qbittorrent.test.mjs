import { describe, it, expect, jest } from '@jest/globals';
import * as qb from '../src/lib/qbittorrent.js';

global.fetch = jest.fn();

describe('qbittorrent.js', () => {
  describe('qbLogin', () => {
    it('returns cookie on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'SID=abc123; Path=/' },
        text: async () => '',
      });
      const cookie = await qb.qbLogin('http://qb', 'user', 'pass');
      expect(cookie).toBe('SID=abc123');
    });

    it('throws error if login fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        headers: { get: () => '' },
      });
      await expect(qb.qbLogin('http://qb', 'user', 'pass')).rejects.toThrow(/qBittorrent login failed/);
    });

    it('throws error if no cookie received', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => '' },
        text: async () => '',
      });
      await expect(qb.qbLogin('http://qb', 'user', 'pass')).rejects.toThrow(/No session cookie/);
    });
  });

  describe('qbAddUrl', () => {
    it('returns true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      const result = await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', 'cat');
      expect(result).toBe(true);
    });

    it('throws error if add fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });
      await expect(qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', 'cat')).rejects.toThrow(/qBittorrent add failed/);
    });
  });
});
