import { jest } from '@jest/globals';
import { TEST_CONFIG, MOCK_RESPONSES } from './test-constants.mjs';

/**
 * Centralized mock setup for all E2E tests
 * Note: jest.mock() calls must be at the top level, not inside class methods
 */
export class MockManager {
  constructor() {
    this.originalFetch = global.fetch;
  }

  /**
   * Setup all mocks with sensible defaults
   * This assumes jest.mock() calls are already made at the test file level
   */
  setupMocks() {
    // Get references to already mocked functions
    const { qbLogin, qbAddUrl } = require('../../src/lib/qbittorrent');
    this.mockQbLogin = qbLogin;
    this.mockQbAddUrl = qbAddUrl;

    // Setup default successful mocks
    this.mockQbLogin.mockResolvedValue(TEST_CONFIG.SESSION_COOKIE);
    this.mockQbAddUrl.mockResolvedValue(true);
    
    // Mock fetch globally
    global.fetch = jest.fn();
  }

  /**
   * Reset all mocks to their default state
   */
  resetMocks() {
    jest.clearAllMocks();
    
    // Re-setup defaults
    this.mockQbLogin.mockResolvedValue(TEST_CONFIG.SESSION_COOKIE);
    this.mockQbAddUrl.mockResolvedValue(true);
  }

  /**
   * Clean up mocks
   */
  cleanup() {
    jest.resetAllMocks();
    global.fetch = this.originalFetch;
  }

  /**
   * Setup fetch to return a successful MAM response
   */
  mockMamSuccess(response) {
    global.fetch.mockResolvedValueOnce(response);
  }

  /**
   * Setup fetch to return an error
   */
  mockMamError(error) {
    if (error instanceof Error) {
      global.fetch.mockRejectedValueOnce(error);
    } else {
      global.fetch.mockResolvedValueOnce(error);
    }
  }

  /**
   * Setup qBittorrent login to fail
   */
  mockQbLoginFailure(error = MOCK_RESPONSES.QB_UNAVAILABLE) {
    this.mockQbLogin.mockRejectedValueOnce(error);
  }

  /**
   * Setup qBittorrent add to fail
   */
  mockQbAddFailure(error = new Error('Failed to add torrent')) {
    this.mockQbAddUrl.mockRejectedValueOnce(error);
  }

  /**
   * Verify qBittorrent login was called with correct parameters
   */
  expectQbLoginCalled() {
    expect(this.mockQbLogin).toHaveBeenCalledWith(
      TEST_CONFIG.QB_URL,
      TEST_CONFIG.QB_USER,
      TEST_CONFIG.QB_PASS
    );
  }

  /**
   * Verify qBittorrent add was called with correct parameters
   */
  expectQbAddCalled(downloadUrl, category = TEST_CONFIG.QB_CATEGORY) {
    expect(this.mockQbAddUrl).toHaveBeenCalledWith(
      TEST_CONFIG.QB_URL,
      TEST_CONFIG.SESSION_COOKIE,
      downloadUrl,
      category
    );
  }

  /**
   * Verify no qBittorrent operations were called
   */
  expectNoQbCalls() {
    expect(this.mockQbLogin).not.toHaveBeenCalled();
    expect(this.mockQbAddUrl).not.toHaveBeenCalled();
  }

  /**
   * Get mock references for custom setup
   */
  getMocks() {
    return {
      qbLogin: this.mockQbLogin,
      qbAddUrl: this.mockQbAddUrl,
      fetch: global.fetch
    };
  }
}

/**
 * Create a new mock manager instance for each test suite
 */
export function createMockManager() {
  return new MockManager();
}