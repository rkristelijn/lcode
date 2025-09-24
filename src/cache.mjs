import fs from 'fs';
import path from 'path';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class RepoCache {
  constructor(cacheFile = path.join(process.env.HOME, '.lcode-cache.json')) {
    this.cacheFile = cacheFile;
  }

  get(baseDir, maxDepth) {
    try {
      if (!fs.existsSync(this.cacheFile)) return null;
      
      const cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
      const isValid = Date.now() - cache.timestamp < CACHE_TTL && 
                     cache.baseDir === baseDir && 
                     cache.maxDepth === maxDepth;
      
      return isValid ? cache.repos : null;
    } catch {
      return null;
    }
  }

  set(baseDir, maxDepth, repos) {
    try {
      const cache = {
        baseDir,
        maxDepth,
        repos,
        timestamp: Date.now()
      };
      fs.writeFileSync(this.cacheFile, JSON.stringify(cache));
    } catch {
      // Silently fail if can't write cache
    }
  }

  clear() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch {
      // Silently fail
    }
  }
}
