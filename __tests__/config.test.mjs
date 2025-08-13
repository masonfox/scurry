import { config, readMamToken } from '../src/lib/config.js';

describe('config', () => {
  test('should have default appPassword', () => {
    expect(config.appPassword).toBeDefined();
    expect(typeof config.appPassword).toBe('string');
  });
  test('should have qbUrl, qbUser, qbPass', () => {
    expect(config.qbUrl).toBeDefined();
    expect(config.qbUser).toBeDefined();
    expect(config.qbPass).toBeDefined();
  });
});

describe('readMamToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return token if file exists', () => {
    const fakeToken = 'FAKE_TOKEN';
    jest.spyOn(require('node:fs'), 'readFileSync').mockReturnValue(fakeToken);
    const token = readMamToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(token).toBe(fakeToken);
  });
});
