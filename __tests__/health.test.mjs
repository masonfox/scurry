import { GET } from '../app/api/health/route.js';

describe('health API', () => {
  test('GET should return OK', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('OK');
  });
});
