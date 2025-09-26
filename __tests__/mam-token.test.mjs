

import { GET, POST, DELETE } from '../app/api/mam-token/route.js';
import fs from 'node:fs';
import path from 'node:path';

describe('mam-token API', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    test('returns exists: true with masked token if token file exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('test-token-1234567890abcdef');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe('test-t...cdef'); // masked token
      expect(data.fullLength).toBe(27); // actual length of 'test-token-1234567890abcdef'
      expect(typeof data.location).toBe('string');
    });

    test('returns exists: true with *** for short tokens', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('short');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe('***'); // short token masked as ***
      expect(data.fullLength).toBe(5);
    });

    test('returns exists: true with empty string for empty token', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.token).toBe(''); // empty token
      expect(data.fullLength).toBe(0);
    });

    test('returns exists: false if token file does not exist', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(false);
      expect(data.token).toBe(null);
      expect(typeof data.location).toBe('string');
    });

    test('handles file read errors', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
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
        json: jest.fn().mockResolvedValue({ token: validToken })
      };
      
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'mkdirSync').mockImplementation();
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token updated successfully');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('creates directory if it does not exist', async () => {
      const validToken = 'valid-test-token-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: validToken })
      };
      
      // Mock path.dirname to return a specific directory path
      jest.spyOn(path, 'dirname').mockReturnValue('/mock/secrets');
      
      // First call for directory check returns false, then true for the directory creation
      jest.spyOn(fs, 'existsSync')
        .mockReturnValueOnce(false) // directory doesn't exist
        .mockReturnValue(true);      // subsequent calls return true
      
      const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation();
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(200);
      
      expect(mkdirSyncSpy).toHaveBeenCalledWith('/mock/secrets', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('handles file write errors', async () => {
      const validToken = 'valid-test-token-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: validToken })
      };
      
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error).toBe('Failed to save token: Permission denied');
    });

    test('rejects empty token', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: '   ' }) // whitespace only
      };
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe('Token cannot be empty');
    });

    test('rejects missing token', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      };
      
      const res = await POST(mockRequest);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe('Token is required and must be a string');
    });

    test('rejects invalid token format', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: 'short' }) // too short
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
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation();
      
      const res = await DELETE();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token deleted successfully');
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    test('handles non-existent file gracefully', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const res = await DELETE();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token deleted successfully');
    });

    test('handles file deletion errors', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        throw new Error('File is locked');
      });
      
      const res = await DELETE();
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error).toBe('Failed to delete token: File is locked');
    });
  });
});
