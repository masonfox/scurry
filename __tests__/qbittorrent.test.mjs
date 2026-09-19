import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as qb from '../src/lib/qbittorrent.js';

global.fetch = vi.fn();

describe('qbittorrent.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    it('returns true on success with options object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      const result = await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', { category: 'cat' });
      expect(result).toBe(true);
    });

    it('returns true on success with legacy string category', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      const result = await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', 'cat');
      expect(result).toBe(true);
      
      const callArgs = global.fetch.mock.calls[0];
      const body = callArgs[1].body;
      expect(body.get('category')).toBe('cat');
    });

    it('sends tags as comma-separated string', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', { category: 'cat', tags: ['fiction', 'favorites'] });
      
      const callArgs = global.fetch.mock.calls[0];
      const body = callArgs[1].body;
      expect(body.get('tags')).toBe('fiction,favorites');
      expect(body.get('category')).toBe('cat');
    });

    it('omits category when not provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', { tags: ['fiction'] });
      
      const callArgs = global.fetch.mock.calls[0];
      const body = callArgs[1].body;
      expect(body.has('category')).toBe(false);
      expect(body.get('tags')).toBe('fiction');
    });

    it('omits tags when empty array', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', { category: 'cat', tags: [] });
      
      const callArgs = global.fetch.mock.calls[0];
      const body = callArgs[1].body;
      expect(body.has('tags')).toBe(false);
      expect(body.get('category')).toBe('cat');
    });

    it('works with no options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
      const result = await qb.qbAddUrl('http://qb', 'cookie', 'http://torrent');
      expect(result).toBe(true);
    });

    it('throws error if add fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });
      await expect(qb.qbAddUrl('http://qb', 'cookie', 'http://torrent', { category: 'cat' })).rejects.toThrow(/qBittorrent add failed/);
    });
  });
});
