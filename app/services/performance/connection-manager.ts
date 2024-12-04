import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { supabase } from '../supabase';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionStatus = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 5000;

  private constructor() {
    this.setupConnectionMonitoring();
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  private setupConnectionMonitoring(): void {
    supabase.realtime.onOpen(() => {
      this.connectionStatus.next('connected');
      this.reconnectAttempts = 0;
    });

    supabase.realtime.onClose(() => {
      this.connectionStatus.next('disconnected');
      this.handleDisconnection();
    });
  }

  private async handleDisconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    await new Promise(resolve => setTimeout(resolve, this.RECONNECT_INTERVAL));

    try {
      await supabase.realtime.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.handleDisconnection();
    }
  }

  getConnectionStatus(): Observable<'connected' | 'disconnected'> {
    return this.connectionStatus.asObservable();
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('Max retries exceeded');
  }
}