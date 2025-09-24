import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { RepoCache } from '../src/cache.mjs';

test('RepoCache - stores and retrieves data', () => {
  const cacheFile = path.join(process.cwd(), 'test-cache.json');
  const cache = new RepoCache(cacheFile);
  
  try {
    const baseDir = '/test/dir';
    const maxDepth = 3;
    const repos = ['/test/dir/repo1', '/test/dir/repo2'];
    
    // Initially should return null
    assert.strictEqual(cache.get(baseDir, maxDepth), null);
    
    // Set cache
    cache.set(baseDir, maxDepth, repos);
    
    // Should retrieve cached data
    const cached = cache.get(baseDir, maxDepth);
    assert.deepStrictEqual(cached, repos);
  } finally {
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
  }
});

test('RepoCache - expires after TTL', () => {
  const cacheFile = path.join(process.cwd(), 'test-cache-ttl.json');
  const cache = new RepoCache(cacheFile);
  
  try {
    // Manually create expired cache
    const expiredCache = {
      baseDir: '/test/dir',
      maxDepth: 3,
      repos: ['/test/repo'],
      timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes ago
    };
    
    fs.writeFileSync(cacheFile, JSON.stringify(expiredCache));
    
    // Should return null for expired cache
    assert.strictEqual(cache.get('/test/dir', 3), null);
  } finally {
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
  }
});

test('RepoCache - clears cache file', async (_t) => {
  const cacheFile = path.join(process.cwd(), 'test-cache-clear.json');
  const cache = new RepoCache(cacheFile);
  
  // Create cache file
  cache.set('/test', 3, ['/test/repo']);
  assert.strictEqual(fs.existsSync(cacheFile), true);
  
  // Clear cache
  cache.clear();
  assert.strictEqual(fs.existsSync(cacheFile), false);
});

test('RepoCache - handles invalid cache file gracefully', () => {
  const cacheFile = path.join(process.cwd(), 'test-cache-invalid.json');
  const cache = new RepoCache(cacheFile);
  
  // Create invalid JSON file
  fs.writeFileSync(cacheFile, 'invalid json');
  
  // Should return null without throwing
  assert.strictEqual(cache.get('/test', 3), null);
  
  // Cleanup
  if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
});
