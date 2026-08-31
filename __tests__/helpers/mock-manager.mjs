// vi is available globally when vitest globals:true is configured.
// vi.mock() must be hoisted to the top level of each test file — it cannot
// be called inside class methods. This class therefore expects the caller to
// pass already-mocked module references into setupMocks().
import { TEST_CONFIG, MOCK_RESPONSES } from './test-constants.mjs';

/**
 * Centralized mock manager for E2E tests (Vitest edition).
 *
 * Usage in a test file:
 *   vi.mock('../../src/lib/qbittorrent', () => ({ qbLogin: vi.fn(), qbAddUrl: vi.fn() }));
 *   import * as qb from '../../src/lib/qbittorrent';
 *   const manager = createMockManager();
 *   manager.setupMocks(qb.qbLogin, qb.qbAddUrl);
 */
export class MockManager {
  constructor() {
    this.originalFetch = global.fetch;
    this.mockQbLogin = null;
    this.mockQbAddUrl = null;
  }

  /**
   * Attach already-mocked qbittorrent functions and configure sensible defaults.
   * @param {Function} mockQbLogin  - vi.fn() reference for qbLogin
   * @param {Function} mockQbAddUrl - vi.fn() reference for qbAddUrl
   */
  setupMocks(mockQbLogin, mockQbAddUrl) {
    this.mockQbLogin = mockQbLogin;
    this.mockQbAddUrl = mockQbAddUrl;

    // Setup default successful mocks
    this.mockQbLogin.mockResolvedValue(TEST_CONFIG.SESSION_COOKIE);
    this.mockQbAddUrl.mockResolvedValue(true);

    // Mock fetch globally
    global.fetch = vi.fn();
  }

  /**
   * Reset all mocks to their default state
   */
  resetMocks() {
    vi.clearAllMocks();

    // Re-setup defaults
    if (this.mockQbLogin) this.mockQbLogin.mockResolvedValue(TEST_CONFIG.SESSION_COOKIE);
    if (this.mockQbAddUrl) this.mockQbAddUrl.mockResolvedValue(true);
  }

  /**
   * Clean up mocks
   */
  cleanup() {
    vi.resetAllMocks();
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