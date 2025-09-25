import { describe, it, expect } from '@jest/globals';
import {
  buildMamDownloadUrl,
  buildMamTorrentUrl,
  buildPayload,
  formatNumberWithCommas,
  parseAuthorInfo
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
});
