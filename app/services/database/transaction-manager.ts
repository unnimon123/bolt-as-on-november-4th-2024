import { SupabaseClient } from '@supabase/supabase-js';
import { ConnectionManager } from './connection-manager';

export class TransactionManager {
  private static instance: TransactionManager;
  private connectionManager: ConnectionManager;

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
  }

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  async executeTransaction<T>(
    operations: (client: SupabaseClient) => Promise<T>,
    options: {
      maxRetries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, timeout = 30000 } = options;

    return this.connectionManager.executeWithRetry(async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timeout')), timeout);
      });

      const transactionPromise = this.connectionManager.transaction(operations);

      return Promise.race([timeoutPromise, transactionPromise]);
    }, maxRetries);
  }

  async batchOperation<T>(
    items: any[],
    operation: (item: any, client: SupabaseClient) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    const client = this.connectionManager.getClient();

    for (const item of items) {
      try {
        const result = await this.executeTransaction(async () => {
          return operation(item, client);
        });
        results.push(result);
      } catch (error) {
        console.error(`Batch operation failed for item:`, item, error);
        throw error;
      }
    }

    return results;
  }
}