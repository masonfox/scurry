import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { getDefaults, readSettings, readSettingsSafe, writeSettings, validateSettings } from '../src/lib/settings.js';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe('settings.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefaults', () => {
    it('returns default settings structure', () => {
      const defaults = getDefaults();
      expect(defaults).toHaveProperty('qbittorrent');
      expect(defaults).toHaveProperty('tags');
      expect(defaults).toHaveProperty('categories');
      expect(defaults.tags.enabled).toBe(false);
      expect(defaults.categories.enabled).toBe(false);
      expect(defaults.tags.available).toEqual([]);
      expect(defaults.tags.defaults.books).toEqual([]);
      expect(defaults.tags.defaults.audiobooks).toEqual([]);
    });
  });

  describe('readSettings', () => {
    it('returns defaults when no file exists', () => {
      fs.existsSync.mockReturnValue(false);
      const settings = readSettings();
      expect(settings.tags.enabled).toBe(false);
      expect(settings.categories.enabled).toBe(false);
    });

    it('reads from file when it exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        qbittorrent: { url: 'http://test:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction'], defaults: { books: ['fiction'], audiobooks: [] } },
        categories: { enabled: true, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      }));

      const settings = readSettings();
      expect(settings.tags.enabled).toBe(true);
      expect(settings.tags.available).toEqual(['fiction']);
      expect(settings.tags.defaults.books).toEqual(['fiction']);
      expect(settings.tags.defaults.audiobooks).toEqual([]);
      expect(settings.qbittorrent.url).toBe('http://test:8080');
    });

    it('merges saved settings with defaults for missing keys', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        qbittorrent: { url: 'http://test:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction'], defaults: { books: ['fiction'], audiobooks: [] } }
        // categories key is missing
      }));

      const settings = readSettings();
      expect(settings.categories).toBeDefined();
      expect(settings.categories.enabled).toBe(false);
    });

    it('falls back to defaults on parse error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const settings = readSettings();
      expect(settings.tags.enabled).toBe(false);
    });
  });

  describe('readSettingsSafe', () => {
    it('masks password in returned settings', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        qbittorrent: { url: 'http://test:8080', username: 'admin', password: 'secretpass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      }));

      const settings = readSettingsSafe();
      expect(settings.qbittorrent.password).toBe('••••••••');
      expect(settings.qbittorrent.url).toBe('http://test:8080');
    });
  });

  describe('validateSettings', () => {
    it('returns no errors for valid settings', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction'], defaults: { books: ['fiction'], audiobooks: [] } },
        categories: { enabled: true, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid settings with multiple default tags', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction', 'non-fiction', 'mystery'], defaults: { books: ['fiction', 'mystery'], audiobooks: ['non-fiction'] } },
        categories: { enabled: true, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });
      expect(errors).toHaveLength(0);
    });

    it('rejects empty qBittorrent URL', () => {
      const errors = validateSettings({
        qbittorrent: { url: '', username: 'admin', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('URL is required'))).toBe(true);
    });

    it('rejects invalid URL format', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'not-a-url', username: 'admin', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('not a valid URL'))).toBe(true);
    });

    it('rejects non-http/https URL scheme', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'ftp://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('http or https'))).toBe(true);
    });

    it('rejects tags longer than 50 characters', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['a'.repeat(51)], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('50 character limit'))).toBe(true);
    });

    it('rejects default tag not in available tags', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction'], defaults: { books: ['nonexistent'], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('not in available tags'))).toBe(true);
    });

    it('rejects any invalid tag in a multi-default array', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['fiction', 'mystery'], defaults: { books: ['fiction', 'nonexistent'], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('"nonexistent"') && e.includes('not in available tags'))).toBe(true);
    });

    it('rejects empty tag names', () => {
      const errors = validateSettings({
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'pass' },
        tags: { enabled: true, available: ['', 'valid'], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      });
      expect(errors.some(e => e.includes('non-empty strings'))).toBe(true);
    });
  });

  describe('writeSettings', () => {
    it('writes valid settings to file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(getDefaults()));

      const newSettings = {
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: 'newpass' },
        tags: { enabled: true, available: ['fiction'], defaults: { books: ['fiction'], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      };

      writeSettings(newSettings);
      expect(fs.writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(written.qbittorrent.password).toBe('newpass');
      expect(written.tags.defaults.books).toEqual(['fiction']);
      expect(written.tags.defaults.audiobooks).toEqual([]);
    });

    it('preserves existing password when mask is provided', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        qbittorrent: { url: 'http://test:8080', username: 'admin', password: 'realpass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      }));

      const newSettings = {
        qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: '••••••••' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      };

      writeSettings(newSettings);
      const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(written.qbittorrent.password).toBe('realpass');
    });

    it('throws on invalid settings', () => {
      expect(() => writeSettings({
        qbittorrent: { url: '', username: '', password: '' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: '', audiobooks: '' } }
      })).toThrow(/Invalid settings/);
    });
  });
});
