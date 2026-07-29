/**
 * High-Performance In-Memory TTL Cache & Cache-Control Optimization Service
 * Provides fast server-side caching for database queries, external API fetches, and route responses.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieves an item from cache if it exists and hasn't expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Sets an item in cache with a specified Time-To-Live (TTL) in milliseconds.
   */
  set<T>(key: string, value: T, ttlMs: number = 60000): void {
    // Evict oldest entry if max capacity reached
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Deletes a specific key from cache.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Deletes all keys matching a prefix string.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance across hot reloads in Next.js
const globalWithCache = global as typeof globalThis & {
  _notexiaMemoryCache?: MemoryCache;
};

export const memoryCache =
  globalWithCache._notexiaMemoryCache || new MemoryCache(2000);

if (process.env.NODE_ENV !== "production") {
  globalWithCache._notexiaMemoryCache = memoryCache;
}

/**
 * Returns optimized HTTP Cache-Control header options for Next.js NextResponse.
 */
export function getCacheHeaders(options?: {
  public?: boolean;
  maxAge?: number;
  staleWhileRevalidate?: number;
}): Record<string, string> {
  const isPublic = options?.public ?? false;
  const maxAge = options?.maxAge ?? 30; // 30 seconds default
  const swr = options?.staleWhileRevalidate ?? 60; // 60 seconds stale-while-revalidate

  const scope = isPublic ? "public" : "private";
  return {
    "Cache-Control": `${scope}, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
  };
}
