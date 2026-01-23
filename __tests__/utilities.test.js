import { describe, it, expect } from '@jest/globals';
import {
  buildMamDownloadUrl,
  buildMamTorrentUrl,
  buildPayload,
  formatNumberWithCommas,
  parseAuthorInfo,
  parseSizeToBytes,
  formatBytesToSize,
  calculateNewRatio,
  calculateRatioDiff
} from '../src/lib/utilities.js';

describe('utilities', () => {
  it('buildMamDownloadUrl returns correct url', () => {
    expect(buildMamDownloadUrl('abc')).toContain('/tor/download.php/abc');
    expect(buildMamDownloadUrl()).toBeNull();
  });

  it('buildMamTorrentUrl returns correct url', () => {
    expect(buildMamTorrentUrl('456')).toContain('/t/456');
    expect(buildMamTorrentUrl(123)).toContain('/t/123');
    expect(buildMamTorrentUrl()).toBeNull();
  });

  // NOTE: this is bound to change as functionality evolves
  it('buildPayload returns correct structure', () => {
    const payload = buildPayload('test');
    expect(payload).toHaveProperty('tor');
    expect(payload.tor.text).toBe('test');
    expect(payload.tor.srchIn).toEqual(['title', 'author']);
    expect(payload.tor.main_cat).toEqual([14]);
    expect(payload.dlLink).toBe('');
  });

  it('formatNumberWithCommas formats numbers correctly', () => {
    expect(formatNumberWithCommas(1000)).toBe('1,000');
    expect(formatNumberWithCommas(1234567)).toBe('1,234,567');
    expect(formatNumberWithCommas(0)).toBe('0');
    expect(formatNumberWithCommas(null)).toBe('0');
    expect(formatNumberWithCommas('abc')).toBe('0');
  });

  it('parseAuthorInfo parses valid JSON', () => {
    expect(parseAuthorInfo('{"author":"Author Name"}')).toBe('Author Name');
  });

  it('parseAuthorInfo returns null for invalid JSON', () => {
    expect(parseAuthorInfo('not json')).toBeNull();
    expect(parseAuthorInfo(null)).toBeNull();
    expect(parseAuthorInfo('{}')).toBeNull();
  });

  it('validateMamToken validates token format correctly', () => {
    const { validateMamToken } = require('../src/lib/utilities');
    
    // Valid tokens
    expect(validateMamToken('CWX7gfubkHotwItFiZu0QmBNkvXcq_76fR6AZxPmSacmLAmkPEI')).toBe(true);
    expect(validateMamToken('a'.repeat(51))).toBe(true); // 51 chars
    
    // Invalid tokens
    expect(validateMamToken('short')).toBe(false); // too short
    expect(validateMamToken('')).toBe(false); // empty
    expect(validateMamToken(null)).toBe(false); // null
    expect(validateMamToken(undefined)).toBe(false); // undefined
    expect(validateMamToken('contains spaces and symbols!')).toBe(false); // invalid chars
  });

  it('maskToken masks tokens correctly', () => {
    const { maskToken } = require('../src/lib/utilities');
    
    expect(maskToken('1234567890abcdef')).toBe('123456...cdef');
    expect(maskToken('short')).toBe('***');
    expect(maskToken('')).toBe('');
    expect(maskToken(null)).toBe('');
    expect(maskToken(undefined)).toBe('');
  });

  describe('parseSizeToBytes', () => {
    it('parses bytes correctly', () => {
      expect(parseSizeToBytes('0 B')).toBe(0);
      expect(parseSizeToBytes('512 B')).toBe(512);
    });

    it('parses kilobytes correctly', () => {
      expect(parseSizeToBytes('1 KB')).toBe(1024);
      expect(parseSizeToBytes('1 KiB')).toBe(1024);
      expect(parseSizeToBytes('525.1 KiB')).toBe(537702);
    });

    it('parses megabytes correctly', () => {
      expect(parseSizeToBytes('1 MB')).toBe(1048576);
      expect(parseSizeToBytes('1 MiB')).toBe(1048576);
      expect(parseSizeToBytes('2.4 MiB')).toBe(2516582);
    });

    it('parses gigabytes correctly', () => {
      expect(parseSizeToBytes('1 GB')).toBe(1073741824);
      expect(parseSizeToBytes('1 GiB')).toBe(1073741824);
      expect(parseSizeToBytes('1.5 GB')).toBe(1610612736);
    });

    it('parses terabytes correctly', () => {
      expect(parseSizeToBytes('1 TB')).toBe(1099511627776);
      expect(parseSizeToBytes('1 TiB')).toBe(1099511627776);
    });

    it('handles edge cases', () => {
      expect(parseSizeToBytes('< 1 KB')).toBe(0);
      expect(parseSizeToBytes('')).toBeNull();
      expect(parseSizeToBytes(null)).toBeNull();
      expect(parseSizeToBytes(undefined)).toBeNull();
      expect(parseSizeToBytes('invalid')).toBeNull();
    });

    it('handles numbers with commas', () => {
      expect(parseSizeToBytes('1,234 KB')).toBe(1263616);
      // 1234.5 MB = 1234.5 * 1024 * 1024 = 1294467072
      expect(parseSizeToBytes('1,234.5 MB')).toBe(1294467072);
    });
  });

  describe('formatBytesToSize', () => {
    it('formats bytes correctly', () => {
      expect(formatBytesToSize(0)).toBe('0 B');
      expect(formatBytesToSize(512)).toBe('512.0 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatBytesToSize(1024)).toBe('1.0 KB');
      expect(formatBytesToSize(537702)).toBe('525.1 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatBytesToSize(1048576)).toBe('1.0 MB');
      expect(formatBytesToSize(2516582)).toBe('2.4 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatBytesToSize(1073741824)).toBe('1.0 GB');
      expect(formatBytesToSize(1610612736)).toBe('1.5 GB');
    });

    it('formats terabytes correctly', () => {
      expect(formatBytesToSize(1099511627776)).toBe('1.0 TB');
    });

    it('handles edge cases', () => {
      expect(formatBytesToSize(null)).toBe('0 B');
      expect(formatBytesToSize(undefined)).toBe('0 B');
      expect(formatBytesToSize('invalid')).toBe('0 B');
    });
  });

  describe('calculateNewRatio', () => {
    it('calculates new ratio correctly', () => {
      // Current: 100MB uploaded, 50MB downloaded = 2.0 ratio
      // Download 50MB more
      // New: 100MB uploaded, 100MB downloaded = 1.0 ratio
      expect(calculateNewRatio(104857600, 52428800, 52428800)).toBe('1.0000');
    });

    it('handles small downloads', () => {
      // Current: 10GB uploaded, 5GB downloaded = 2.0 ratio
      // Download 500KB more
      const uploaded = 10 * 1024 * 1024 * 1024;
      const downloaded = 5 * 1024 * 1024 * 1024;
      const additional = 500 * 1024;
      const result = calculateNewRatio(uploaded, downloaded, additional);
      expect(result).toBe('1.9998');
    });

    it('handles large downloads', () => {
      // Current: 1GB uploaded, 1GB downloaded = 1.0 ratio
      // Download 10GB more
      const uploaded = 1073741824;
      const downloaded = 1073741824;
      const additional = 10737418240;
      const result = calculateNewRatio(uploaded, downloaded, additional);
      expect(result).toBe('0.0909');
    });

    it('handles zero current download with new download', () => {
      // Edge case: new user with no downloads yet
      expect(calculateNewRatio(0, 0, 1048576)).toBe('0.0000');
    });

    it('handles division edge cases', () => {
      // uploaded: 1MB, downloaded: 0, additional: 1MB
      // new downloaded = 0 + 1MB = 1MB
      // ratio = 1MB / 1MB = 1.0
      expect(calculateNewRatio(1048576, 0, 1048576)).toBe('1.0000');
    });

    it('returns null for invalid inputs', () => {
      expect(calculateNewRatio(null, 100, 100)).toBeNull();
      expect(calculateNewRatio(100, null, 100)).toBeNull();
      expect(calculateNewRatio(100, 100, null)).toBeNull();
      expect(calculateNewRatio(undefined, 100, 100)).toBeNull();
      expect(calculateNewRatio('invalid', 100, 100)).toBeNull();
      expect(calculateNewRatio(100, 'invalid', 100)).toBeNull();
      expect(calculateNewRatio(100, 100, 'invalid')).toBeNull();
    });

    it('returns 4 decimal places consistently', () => {
      const result = calculateNewRatio(1000000, 500000, 250000);
      expect(result).toMatch(/^\d+\.\d{4}$/);
    });
  });

  describe('calculateRatioDiff', () => {
    it('calculates negative difference when ratio decreases', () => {
      // Current: 100MB uploaded, 50MB downloaded = 2.0 ratio
      // Download 50MB more → 1.0 ratio
      // Diff: -1.0000
      expect(calculateRatioDiff(104857600, 52428800, 52428800)).toBe('-1.0000');
    });

    it('calculates small negative differences for small files', () => {
      // Current: 10GB uploaded, 5GB downloaded = 2.0 ratio
      // Download 525.1 KiB more
      const uploaded = 10 * 1024 * 1024 * 1024;
      const downloaded = 5 * 1024 * 1024 * 1024;
      const additional = 537702; // 525.1 KiB
      const result = calculateRatioDiff(uploaded, downloaded, additional);
      expect(result).toBe('-0.0002');
      // Should NOT be -0.00 (which would happen with 2 decimal places)
      expect(result).not.toBe('-0.00');
    });

    it('handles large ratio changes', () => {
      // Current: 1GB uploaded, 1GB downloaded = 1.0 ratio
      // Download 10GB more → 0.0909 ratio
      // Diff: -0.9091
      const uploaded = 1073741824;
      const downloaded = 1073741824;
      const additional = 10737418240;
      const result = calculateRatioDiff(uploaded, downloaded, additional);
      expect(result).toBe('-0.9091');
    });

    it('handles both mode combined downloads', () => {
      // Simulating "Both" mode: book + audiobook
      // Current: 50GB uploaded, 25GB downloaded = 2.0 ratio
      // Download: 2.4 MiB book + 312.6 MiB audiobook = 315 MiB total
      const uploaded = 50 * 1024 * 1024 * 1024;
      const downloaded = 25 * 1024 * 1024 * 1024;
      const bookSize = 2.4 * 1024 * 1024;
      const audiobookSize = 312.6 * 1024 * 1024;
      const totalSize = bookSize + audiobookSize;
      const result = calculateRatioDiff(uploaded, downloaded, totalSize);
      // Should show small negative difference
      expect(result).toMatch(/^-\d+\.\d{4}$/);
      // Verifies 4 decimal places
      expect(result.split('.')[1].length).toBe(4);
    });

    it('returns null for invalid inputs', () => {
      expect(calculateRatioDiff(null, 100, 100)).toBeNull();
      expect(calculateRatioDiff(100, null, 100)).toBeNull();
      expect(calculateRatioDiff(100, 100, null)).toBeNull();
      expect(calculateRatioDiff(undefined, 100, 100)).toBeNull();
      expect(calculateRatioDiff('invalid', 100, 100)).toBeNull();
      expect(calculateRatioDiff(100, 0, 100)).toBeNull(); // Division by zero
    });

    it('returns null when calculateNewRatio returns null', () => {
      // When new download would result in invalid ratio
      expect(calculateRatioDiff(null, 1000, 1000)).toBeNull();
    });

    it('returns 4 decimal places consistently', () => {
      const result = calculateRatioDiff(1000000, 500000, 250000);
      expect(result).toMatch(/^-?\d+\.\d{4}$/);
    });

    it('formats positive and negative values consistently', () => {
      // Negative diff (ratio decreases - typical case)
      const negative = calculateRatioDiff(1000000, 500000, 500000);
      expect(negative).toMatch(/^-\d+\.\d{4}$/);
      
      // Very small diff
      const verySmall = calculateRatioDiff(10000000000, 5000000000, 1000);
      // Should be like "-0.0000" (6 chars)
      expect(verySmall).toMatch(/^-?\d+\.\d{4}$/);
      expect(verySmall.split('.')[1].length).toBe(4);
    });
  });

  describe('ratio calculations integration', () => {
    it('maintains precision across size parsing and ratio calculation', () => {
      // Real-world scenario: user stats and small file download
      const userStats = {
        uploaded: '53.7858 TB',
        downloaded: '1.0961 TB'
      };
      
      const fileSize = '525.1 KiB';
      
      const uploadedBytes = parseSizeToBytes(userStats.uploaded);
      const downloadedBytes = parseSizeToBytes(userStats.downloaded);
      const fileSizeBytes = parseSizeToBytes(fileSize);
      
      const newRatio = calculateNewRatio(uploadedBytes, downloadedBytes, fileSizeBytes);
      const diff = calculateRatioDiff(uploadedBytes, downloadedBytes, fileSizeBytes);
      
      // Should maintain 4 decimal precision
      expect(newRatio).toMatch(/^\d+\.\d{4}$/);
      expect(diff).toMatch(/^-?\d+\.\d{4}$/);
      
      // Diff should NOT be -0.0000 for this size file
      // (This was the bug being fixed)
      expect(parseFloat(diff)).toBeLessThan(0);
    });

    it('handles combined "Both" mode calculations', () => {
      // Real scenario: selecting both book and audiobook
      const userStats = {
        uploaded: '53.7858 TB',
        downloaded: '1.0961 TB'
      };
      
      const bookSize = '2.4 MiB';
      const audiobookSize = '312.6 MiB';
      
      const uploadedBytes = parseSizeToBytes(userStats.uploaded);
      const downloadedBytes = parseSizeToBytes(userStats.downloaded);
      const bookBytes = parseSizeToBytes(bookSize);
      const audiobookBytes = parseSizeToBytes(audiobookSize);
      const totalBytes = bookBytes + audiobookBytes;
      
      const newRatio = calculateNewRatio(uploadedBytes, downloadedBytes, totalBytes);
      const diff = calculateRatioDiff(uploadedBytes, downloadedBytes, totalBytes);
      
      // Should have 4 decimal precision (not 2)
      // Diff will be negative since ratio decreases when downloading
      expect(diff).toMatch(/^-?\d+\.\d{4}$/);
      expect(diff.split('.')[1].length).toBe(4);
    });
  });
});
