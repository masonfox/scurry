

import { GET } from '../app/api/mam-token-exists/route.js';
import fs from 'node:fs';

import { readMamToken } from '../src/lib/config.js';

describe('mam-token-exists API', () => {
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
});
