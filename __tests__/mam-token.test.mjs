import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST, DELETE } from '../app/api/mam-token/route.js';
import fs from 'node:fs';
import path from 'node:path';

describe('mam-token API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    test('returns exists: true with masked token if token file exists', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('test-token-1234567890abcdef');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe('test-t...cdef'); // masked token
      expect(data.fullLength).toBe(27); // actual length of 'test-token-1234567890abcdef'
      expect(typeof data.location).toBe('string');
    });

    test('returns exists: true with *** for short tokens', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('short');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe('***'); // short token masked as ***
      expect(data.fullLength).toBe(5);
    });

    test('returns exists: true with empty string for empty token', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe(''); // empty token
      expect(data.fullLength).toBe(0);
    });

    test('returns exists: false if token file does not exist', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(false);
      expect(data.token).toBe(null);
      expect(typeof data.location).toBe('string');
    });

    test('handles file read errors', async () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const res = await GET();
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.exists).toBe(false);
      expect(data.error).toBe('File system error');
    });
  });

  describe('POST', () => {
    test('saves valid token successfully', async () => {
      // Use a longer token that passes validation (50+ chars)
      const validToken = 'valid-test-token-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ token: validToken })
      };
      
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'mkdirSync').mockImplementation();
      vi.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const res = await POST(mockRequest);
      
      // If we get a 500, show the error details for debugging
      if (res.status === 500) {
        const errorData = await res.json();
        throw new Error(`Expected 200 but got 500. Error: ${JSON.stringify(errorData)}`);
      }
      
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token updated successfully');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('creates directory if it does not exist', async () => {
      const validToken = 'valid-test-token-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ token: validToken })
      };
      
      // First call for directory check returns false, then true for subsequent calls
      vi.spyOn(fs, 'existsSync')
        .mockReturnValueOnce(false) // directory doesn't exist
        .mockReturnValue(true);      // subsequent calls return true
      
      const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation();
      vi.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(200);
      
      expect(mkdirSyncSpy).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('handles file write errors', async () => {
      const validToken = 'valid-test-token-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ token: validToken })
      };
      
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error).toBe('Failed to save token: Permission denied');
    });

    test('rejects empty token', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ token: '   ' }) // whitespace only
      };
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe('Token cannot be empty');
    });

    test('rejects missing token', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({})
      };
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe('Token is required and must be a string');
    });

    test('rejects invalid token format', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ token: 'short' }) // too short
      };
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toContain('Token format appears invalid');
      expect(data.warning).toBe(true);
    });
  });

  describe('DELETE', () => {
    test('deletes existing token file', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'unlinkSync').mockImplementation();
      
      const res = await DELETE();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token deleted successfully');
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    test('handles non-existent file gracefully', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const res = await DELETE();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token deleted successfully');
    });

    test('handles file deletion errors', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        throw new Error('File is locked');
      });
      
      const res = await DELETE();
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error).toBe('Failed to delete token: File is locked');
    });
  });
});
