

import { GET } from '../app/api/mam-token-exists/route.js';
import fs from 'node:fs';

import { readMamToken } from '../src/lib/config.js';

describe('mam-token-exists API and readMamToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET returns exists: true if token file exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exists).toBe(true);
    expect(typeof data.location).toBe('string');
  });

  test('GET returns exists: false if token file does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exists).toBe(false);
    expect(typeof data.location).toBe('string');
  });

  it('readMamToken throws if file read fails', () => {
    jest.spyOn(require('node:fs'), 'readFileSync').mockImplementation(() => { throw new Error('fail'); });
    expect(() => readMamToken()).toThrow('fail');
  });

  it('readMamToken returns null if file is empty', () => {
    jest.spyOn(require('node:fs'), 'readFileSync').mockReturnValue('');
    expect(readMamToken()).toBeNull();
  });
});
