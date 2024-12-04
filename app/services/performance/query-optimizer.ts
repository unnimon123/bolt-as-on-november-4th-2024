import { supabase } from '../supabase';
import { QueryCache } from './cache-manager';

export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryCache: QueryCache;

  private constructor() {
    this.queryCache = new QueryCache();
  }

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  async optimizeQuery<T>(
    query: string,
    params: any[] = [],
    options: {
      cacheDuration?: number;
      forceRefresh?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<T[]> {
    const cacheKey = this.generateCacheKey(query, params);

    if (!options.forceRefresh) {
      const cachedResult = await this.queryCache.get<T[]>(cacheKey);
      if (cachedResult) return cachedResult;
    }

    const result = await this.executeBatchedQuery<T>(query, params, options.batchSize);
    await this.queryCache.set(cacheKey, result, options.cacheDuration);
    
    return result;
  }

  private async executeBatchedQuery<T>(
    query: string,
    params: any[],
    batchSize: number = 1000
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.rpc('execute_optimized_query', {
        p_query: query,
        p_params: params,
        p_limit: batchSize,
        p_offset: offset
      });

      if (error) throw error;
      if (!data || data.length === 0) break;

      results.push(...data);
      offset += batchSize;

      if (data.length < batchSize) break;
    }

    return results;
  }

  private generateCacheKey(query: string, params: any[]): string {
    return `query:${query}:${JSON.stringify(params)}`;
  }

  async invalidateCache(pattern: string): Promise<void> {
    await this.queryCache.invalidate(pattern);
  }
}