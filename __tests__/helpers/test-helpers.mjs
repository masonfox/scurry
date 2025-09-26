import { expect } from '@jest/globals';
import { EXPECTED_ERRORS } from './test-constants.mjs';

/**
 * Helper functions for common test assertions and operations
 */

/**
 * Assert that a search response is successful
 */
export function expectSuccessfulSearch(data, expectedResultCount = null) {
  if (expectedResultCount !== null) {
    expect(data.results).toHaveLength(expectedResultCount);
  }
  
  expect(Array.isArray(data.results)).toBe(true);
}

/**
 * Assert that a download response is successful
 */
export function expectSuccessfulDownload(data) {
  expect(data.ok).toBe(true);
}

/**
 * Assert that a response contains token expiration error
 */
export function expectTokenExpiredError(data) {
  expect(data.tokenExpired).toBe(true);
  expect(data.error).toBe(EXPECTED_ERRORS.TOKEN_EXPIRED);
  expect(data.results).toEqual([]);
}

/**
 * Assert that a response contains a search failure error
 */
export function expectSearchFailure(data, statusCode) {
  expect(data.error).toContain(`Search failed: ${statusCode}`);
  expect(data.results).toEqual([]);
}

/**
 * Assert that a download response contains an error
 */
export function expectDownloadError(data, errorPattern) {
  expect(data.ok).toBe(false);
  
  if (errorPattern) {
    expect(data.error).toMatch(errorPattern);
  }
}

/**
 * Assert that a torrent result has the expected structure and values
 */
export function expectValidTorrentResult(result, expectedValues = {}) {
  // Check required fields exist
  expect(result).toHaveProperty('id');
  expect(result).toHaveProperty('title');
  expect(result).toHaveProperty('downloadUrl');
  expect(result).toHaveProperty('torrentUrl');
  expect(result).toHaveProperty('size');
  expect(result).toHaveProperty('filetypes');
  expect(result).toHaveProperty('seeders');
  expect(result).toHaveProperty('leechers');
  expect(result).toHaveProperty('downloads');
  expect(result).toHaveProperty('vip');
  expect(result).toHaveProperty('snatched');
  
  // Check URL formats
  if (result.downloadUrl) {
    expect(result.downloadUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/tor\/download\.php\//);
  }
  
  if (result.torrentUrl) {
    expect(result.torrentUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/t\//);
  }
  
  // Check specific expected values
  Object.entries(expectedValues).forEach(([key, value]) => {
    expect(result[key]).toBe(value);
  });
}

/**
 * Execute a complete search-to-download workflow
 */
export async function executeSearchAndDownload(searchGET, addPOST, query, category = 'books') {
  // Perform search
  const searchReq = createSearchRequest(query, category);
  const searchRes = await searchGET(searchReq);
  const searchData = await searchRes.json();
  
  // Assert search response status
  expect(searchRes.status).toBe(200);
  expectSuccessfulSearch(searchData);
  
  if (searchData.results.length === 0) {
    throw new Error('No search results to download');
  }
  
  // Download first result
  const firstResult = searchData.results[0];
  const downloadReq = createDownloadRequest({
    title: firstResult.title,
    downloadUrl: firstResult.downloadUrl,
    category
  });
  
  const downloadRes = await addPOST(downloadReq);
  const downloadData = await downloadRes.json();
  
  return {
    searchData,
    downloadData,
    searchRes,
    downloadRes,
    firstResult
  };
}

/**
 * Helper to run multiple searches in parallel
 */
export async function executeParallelSearches(searchGET, queries) {
  const searchPromises = queries.map(query => 
    searchGET(createSearchRequest(query))
  );
  
  const searchResponses = await Promise.all(searchPromises);
  const searchDataArray = await Promise.all(
    searchResponses.map(res => res.json())
  );
  
  return { searchResponses, searchDataArray };
}

/**
 * Helper to run multiple downloads in parallel
 */
export async function executeParallelDownloads(addPOST, downloadRequests) {
  const downloadPromises = downloadRequests.map(req => addPOST(req));
  
  const downloadResponses = await Promise.all(downloadPromises);
  const downloadDataArray = await Promise.all(
    downloadResponses.map(res => res.json())
  );
  
  return { downloadResponses, downloadDataArray };
}

/**
 * Create a test scenario with specific setup
 */
export function createTestScenario(name, setup, assertion) {
  return {
    name,
    setup: typeof setup === 'function' ? setup : () => setup,
    assert: assertion
  };
}

/**
 * Retry helper for flaky operations
 */
export async function withRetry(operation, maxAttempts = 3, delay = 100) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Import factory functions (exported separately to avoid circular imports)
import { createSearchRequest, createDownloadRequest } from './test-factories.mjs';