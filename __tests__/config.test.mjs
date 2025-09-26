import { config, readMamToken } from '../src/lib/config.js';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear module cache
    process.env = { ...originalEnv }; // Reset environment variables
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original environment
  });

  test('should have default appPassword', () => {
    expect(config.appPassword).toBeDefined();
    expect(typeof config.appPassword).toBe('string');
  });
  
  test('should have qbUrl, qbUser, qbPass', () => {
    expect(config.qbUrl).toBeDefined();
    expect(config.qbUser).toBeDefined();
    expect(config.qbPass).toBeDefined();
  });

  test('should use default values when environment variables are not set', () => {
    // Remove environment variables that have defaults
    delete process.env.APP_PASSWORD;
    delete process.env.APP_QB_CATEGORY;
    delete process.env.APP_QB_USERNAME;
    delete process.env.APP_QB_PASSWORD;
    delete process.env.APP_MAM_USER_AGENT;
    
    // Set required environment variable
    process.env.APP_QB_URL = 'http://test-qb-url';
    
    // Re-import config to get fresh instance
    jest.isolateModules(() => {
      const { config: freshConfig } = require('../src/lib/config.js');
      expect(freshConfig.appPassword).toBe('cheese');
      expect(freshConfig.qbCategory).toBe('books');
      expect(freshConfig.qbUser).toBe('admin');
      expect(freshConfig.qbPass).toBe('adminadmin');
      expect(freshConfig.mamUA).toBe('Scurry/1.0 (+contact)');
      expect(freshConfig.qbUrl).toBe('http://test-qb-url');
    });
  });

  test('should use environment variables when they are set', () => {
    process.env.APP_PASSWORD = 'custom-password';
    process.env.APP_QB_URL = 'http://custom-qb-url';
    process.env.APP_QB_CATEGORY = 'custom-category';
    process.env.APP_QB_USERNAME = 'custom-user';
    process.env.APP_QB_PASSWORD = 'custom-pass';
    process.env.APP_MAM_USER_AGENT = 'Custom/1.0';
    
    jest.isolateModules(() => {
      const { config: freshConfig } = require('../src/lib/config.js');
      expect(freshConfig.appPassword).toBe('custom-password');
      expect(freshConfig.qbUrl).toBe('http://custom-qb-url');
      expect(freshConfig.qbCategory).toBe('custom-category');
      expect(freshConfig.qbUser).toBe('custom-user');
      expect(freshConfig.qbPass).toBe('custom-pass');
      expect(freshConfig.mamUA).toBe('Custom/1.0');
    });
  });

  test('should throw error when required environment variable is missing', () => {
    delete process.env.APP_QB_URL;
    
    jest.isolateModules(() => {
      expect(() => {
        require('../src/lib/config.js');
      }).toThrow('Missing env: APP_QB_URL');
    });
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

  it('readMamToken throws if file read fails', () => {
    jest.spyOn(require('node:fs'), 'readFileSync').mockImplementation(() => { throw new Error('fail'); });
    expect(() => readMamToken()).toThrow('fail');
  });

  it('readMamToken returns null if file is empty', () => {
    jest.spyOn(require('node:fs'), 'readFileSync').mockReturnValue('');
    expect(readMamToken()).toBeNull();
  });
});
