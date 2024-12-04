import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { retry, delay } from 'rxjs/operators';
import { SecureStorageService } from '../secure-storage';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private client: SupabaseClient | null = null;
  private connectionStatus = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.initializeConnection();
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  private async initializeConnection() {
    try {
      const supabaseUrl = await SecureStorageService.getInstance().getItem('SUPABASE_URL');
      const supabaseKey = await SecureStorageService.getInstance().getItem('SUPABASE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-app-version': '1.0.0'
          }
        }
      });

      // Test connection
      await this.client.from('health_check').select('*').limit(1);
      this.connectionStatus.next('connected');
    } catch (error) {
      console.error('Database connection error:', error);
      this.connectionStatus.next('disconnected');
      this.retryConnection();
    }
  }

  private retryConnection() {
    let retries = 0;
    const retryObservable = new Observable(subscriber => {
      const attempt = async () => {
        try {
          await this.initializeConnection();
          subscriber.complete();
        } catch (error) {
          if (retries < this.MAX_RETRIES) {
            retries++;
            setTimeout(attempt, this.RETRY_DELAY * retries);
          } else {
            subscriber.error(error);
          }
        }
      };
      attempt();
    });

    retryObservable.pipe(
      retry(this.MAX_RETRIES),
      delay(this.RETRY_DELAY)
    ).subscribe({
      error: (error) => {
        console.error('Failed to establish database connection:', error);
        // Notify user of connection failure
      }
    });
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }
    return this.client;
  }

  getConnectionStatus(): Observable<'connected' | 'disconnected'> {
    return this.connectionStatus.asObservable();
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)));
          continue;
        }
      }
    }
    throw lastError!;
  }

  async transaction<T>(
    operations: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = this.getClient();
    try {
      await client.rpc('begin_transaction');
      const result = await operations(client);
      await client.rpc('commit_transaction');
      return result;
    } catch (error) {
      await client.rpc('rollback_transaction');
      throw error;
    }
  }
}