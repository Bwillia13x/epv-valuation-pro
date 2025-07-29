// EPV Valuation Pro - Redis Cache Service
import Redis from 'ioredis';
import { AuditService } from './AuditService';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
}

export class CacheService {
  private static instance: Redis | null = null;
  private static readonly DEFAULT_TTL = 3600; // 1 hour
  private static readonly DEFAULT_PREFIX = 'epv:';

  /**
   * Get Redis instance (singleton)
   */
  private static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.instance = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        keyPrefix: this.DEFAULT_PREFIX,
      });
    }

    return this.instance;
  }

  /**
   * Check if Redis is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const redis = this.getInstance();
      await redis.ping();
      return true;
    } catch (error) {
      console.error('Redis availability check failed:', error);
      return false;
    }
  }

  /**
   * Set cache value
   */
  static async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const redis = this.getInstance();
      const ttl = options.ttl || this.DEFAULT_TTL;
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;

      let serializedValue: string;

      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      // Compress if requested (for large objects)
      if (options.compress && serializedValue.length > 1000) {
        // Simple compression flag - in production use actual compression
        serializedValue = `COMPRESSED:${serializedValue}`;
      }

      await redis.setex(fullKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  static async get<T = any>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const redis = this.getInstance();
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;

      const value = await redis.get(fullKey);

      if (!value) {
        return null;
      }

      // Handle compression
      let processedValue = value;
      if (value.startsWith('COMPRESSED:')) {
        processedValue = value.substring(11);
      }

      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(processedValue);
      } catch {
        return processedValue as T;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  static async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const redis = this.getInstance();
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;

      const result = await redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(
    key: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const redis = this.getInstance();
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;

      const result = await redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration time for key
   */
  static async expire(
    key: string,
    ttl: number,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const redis = this.getInstance();
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;

      const result = await redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys
   */
  static async mget(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<(any | null)[]> {
    try {
      const redis = this.getInstance();
      const fullKeys = keys.map((key) =>
        options.prefix ? `${options.prefix}:${key}` : key
      );

      const values = await redis.mget(...fullKeys);

      return values.map((value) => {
        if (!value) return null;

        let processedValue = value;
        if (value.startsWith('COMPRESSED:')) {
          processedValue = value.substring(11);
        }

        try {
          return JSON.parse(processedValue);
        } catch {
          return processedValue;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  static async mset(
    keyValues: Record<string, any>,
    ttl?: number,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const redis = this.getInstance();
      const pipeline = redis.pipeline();

      Object.entries(keyValues).forEach(([key, value]) => {
        const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
        const serializedValue =
          typeof value === 'string' ? value : JSON.stringify(value);

        if (ttl) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get keys matching pattern
   */
  static async keys(
    pattern: string,
    options: CacheOptions = {}
  ): Promise<string[]> {
    try {
      const redis = this.getInstance();
      const fullPattern = options.prefix
        ? `${options.prefix}:${pattern}`
        : pattern;

      const keys = await redis.keys(fullPattern);

      // Remove prefix from returned keys
      if (options.prefix) {
        return keys.map((key) => key.substring(`${options.prefix}:`.length));
      }

      return keys;
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  /**
   * Flush all cache
   */
  static async flushAll(): Promise<boolean> {
    try {
      const redis = this.getInstance();
      await redis.flushall();

      await AuditService.logSystemEvent('CACHE_FLUSH_ALL', 'Cache', undefined, {
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Cache flush all error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    connected: boolean;
    memory: any;
    keyspace: any;
    clients: any;
  } | null> {
    try {
      const redis = this.getInstance();
      const info = await redis.info();

      // Parse Redis INFO response
      const parseInfo = (infoString: string) => {
        const result: any = {};
        const sections = infoString.split('\r\n\r\n');

        sections.forEach((section) => {
          const lines = section.split('\r\n');
          const sectionName = lines[0].replace('# ', '');
          result[sectionName] = {};

          lines.slice(1).forEach((line) => {
            if (line && line.includes(':')) {
              const [key, value] = line.split(':');
              result[sectionName][key] = value;
            }
          });
        });

        return result;
      };

      const parsedInfo = parseInfo(info);

      return {
        connected: true,
        memory: parsedInfo.Memory || {},
        keyspace: parsedInfo.Keyspace || {},
        clients: parsedInfo.Clients || {},
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memory: {},
        keyspace: {},
        clients: {},
      };
    }
  }

  /**
   * Specialized cache methods for EPV platform
   */

  // Cache case data
  static async cacheCase(
    caseId: string,
    caseData: any,
    ttl: number = 1800
  ): Promise<boolean> {
    return this.set(`case:${caseId}`, caseData, { ttl, prefix: 'epv' });
  }

  // Get cached case
  static async getCachedCase(caseId: string): Promise<any> {
    return this.get(`case:${caseId}`, { prefix: 'epv' });
  }

  // Cache analysis results
  static async cacheAnalysis(
    caseId: string,
    agentType: string,
    results: any,
    ttl: number = 3600
  ): Promise<boolean> {
    return this.set(`analysis:${caseId}:${agentType}`, results, {
      ttl,
      prefix: 'epv',
    });
  }

  // Get cached analysis
  static async getCachedAnalysis(
    caseId: string,
    agentType: string
  ): Promise<any> {
    return this.get(`analysis:${caseId}:${agentType}`, { prefix: 'epv' });
  }

  // Cache market data
  static async cacheMarketData(
    symbol: string,
    dataType: string,
    data: any,
    ttl: number = 300
  ): Promise<boolean> {
    return this.set(`market:${symbol}:${dataType}`, data, {
      ttl,
      prefix: 'epv',
    });
  }

  // Get cached market data
  static async getCachedMarketData(
    symbol: string,
    dataType: string
  ): Promise<any> {
    return this.get(`market:${symbol}:${dataType}`, { prefix: 'epv' });
  }

  // Cache user session data
  static async cacheUserSession(
    userId: string,
    sessionData: any,
    ttl: number = 7200
  ): Promise<boolean> {
    return this.set(`session:${userId}`, sessionData, { ttl, prefix: 'epv' });
  }

  // Get cached user session
  static async getCachedUserSession(userId: string): Promise<any> {
    return this.get(`session:${userId}`, { prefix: 'epv' });
  }

  /**
   * Close Redis connection
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
      console.log('✅ Redis connection closed');
    }
  }
}

export default CacheService;
